import { supabase } from '@/lib/supabase'
import { formatSeconds } from '@/lib/compute'
import { currentLocalDate } from '@/lib/timezone'
import ActivityChart from '@/components/ActivityChart'
import BreakdownPie from '@/components/BreakdownPie'
import { AICodingChart, WeekdaysChart } from '@/components/DashboardCharts'
import TimelineChart from '@/components/TimelineChart'
import RefreshButton from '@/components/RefreshButton'

export const dynamic = 'force-dynamic'

interface WakaEntry {
  name: string
  total_seconds: number
  percent?: number
}

interface WakaDay {
  grand_total: {
    total_seconds: number
    text: string
    ai_agent_total_cost?: number
    ai_additions?: number
    ai_deletions?: number
    human_additions?: number
    human_deletions?: number
  }
  projects: WakaEntry[]
  languages: WakaEntry[]
  editors: WakaEntry[]
  categories: WakaEntry[]
  machines: WakaEntry[]
  operating_systems?: WakaEntry[]
  dependencies?: WakaEntry[]
  range: { date: string; text: string }
}

interface DailyRow {
  date: string
  data: WakaDay
}

function aggregateEntries(rows: DailyRow[], key: keyof WakaDay, limit: number) {
  const map = new Map<string, number>()
  for (const row of rows) {
    const entries = row.data[key] as WakaEntry[] | undefined
    if (!entries) continue
    for (const e of entries) {
      map.set(e.name, (map.get(e.name) ?? 0) + e.total_seconds)
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, seconds]) => ({ name, seconds }))
}


interface DurationsWrapper {
  start: string
  end: string
  timezone?: string
  data: Array<{ time: number; duration: number; project?: string | null }>
}

interface MetaRow {
  key: string
  data: unknown
}

async function getData() {
  const [{ data: rows, error }, { data: metaRows }] = await Promise.all([
    supabase
      .from('waka_daily')
      .select('date, data, durations')
      .order('date', { ascending: false })
      .limit(365),
    supabase.from('waka_meta').select('key, data'),
  ])

  if (error || !rows || rows.length === 0) return null

  const todayLocal = currentLocalDate()
  // Drop any stale rows dated in the future relative to our dedicated timezone
  // (e.g. a UTC-rolled "tomorrow" row created before the timezone fix).
  const typed = (rows as Array<DailyRow & { durations: DurationsWrapper | null }>).filter(
    (r) => r.date <= todayLocal
  )
  if (typed.length === 0) return null

  const meta = new Map<string, unknown>()
  for (const m of (metaRows ?? []) as MetaRow[]) meta.set(m.key, m.data)

  const allTime = meta.get('all_time') as
    | { text?: string; daily_average?: number; range?: { start_date?: string } }
    | undefined
  const stats7 = meta.get('stats_last_7_days') as
    | { human_readable_total?: string; human_readable_daily_average?: string }
    | undefined
  const goalsRaw = meta.get('goals')
  const goalsList = Array.isArray(goalsRaw) ? goalsRaw : []

  // Most recent day that actually has a timeline.
  const latestWithTimeline = typed.find(
    (r) => r.durations && Array.isArray(r.durations.data) && r.durations.data.length > 0
  )

  const latest = typed[0]
  const last7 = typed.slice(0, 7)
  const last30 = typed.slice(0, 30)

  // Current day = the row for today in our dedicated timezone (0 if none yet).
  const todayRow = typed.find((r) => r.date === todayLocal)
  const currentDayText = todayRow?.data.grand_total?.text ?? '0 secs'

  // Most active = the day with the most tracked time across all history.
  const mostActive = typed.reduce((best, r) =>
    (r.data.grand_total?.total_seconds ?? 0) > (best.data.grand_total?.total_seconds ?? 0) ? r : best
  )
  const mostActiveLabel = mostActive.data.range?.text ?? mostActive.date

  const allTimeSeconds = typed.reduce((s, r) => s + (r.data.grand_total?.total_seconds ?? 0), 0)
  const weekSeconds = last7.reduce((s, r) => s + (r.data.grand_total?.total_seconds ?? 0), 0)
  const monthSeconds = last30.reduce((s, r) => s + (r.data.grand_total?.total_seconds ?? 0), 0)

  const totalAiCost = typed.reduce((s, r) => s + (r.data.grand_total?.ai_agent_total_cost ?? 0), 0)
  const totalAiAdditions = typed.reduce((s, r) => s + (r.data.grand_total?.ai_additions ?? 0), 0)
  const totalHumanAdditions = typed.reduce((s, r) => s + (r.data.grand_total?.human_additions ?? 0), 0)

  const dailyActivity = [...typed]
    .reverse()
    .map((r) => ({ date: r.date, seconds: r.data.grand_total?.total_seconds ?? 0 }))

  const dailyComparison = [...typed]
    .reverse()
    .map((r) => ({
      date: r.date.slice(5),
      ai: r.data.grand_total?.ai_additions ?? 0,
      human: r.data.grand_total?.human_additions ?? 0,
    }))

  const weekdayData = buildWeekdayData(typed)

  return {
    latestDate: latest.data.range.text,
    latestSeconds: latest.data.grand_total?.total_seconds ?? 0,
    latestText: latest.data.grand_total?.text ?? '0 min',
    latestAiCost: latest.data.grand_total?.ai_agent_total_cost ?? 0,
    currentDayText,
    mostActiveLabel,
    weekSeconds,
    monthSeconds,
    allTimeSeconds,
    totalAiCost,
    daysStored: typed.length,
    dailyActivity,
    dailyComparison,
    weekdayData,
    totalAiAdditions,
    totalHumanAdditions,
    // last 30 days aggregated
    topProjects: aggregateEntries(last30, 'projects', 8),
    topLanguages: aggregateEntries(last30, 'languages', 8),
    topEditors: aggregateEntries(last30, 'editors', 6),
    topCategories: aggregateEntries(last30, 'categories', 4),
    topMachines: aggregateEntries(last30, 'machines', 6),
    topOSs: aggregateEntries(last30, 'operating_systems', 6),
    // most recent day breakdown
    latestProjects: (latest.data.projects ?? []).slice(0, 8).map((p) => ({ name: p.name, seconds: p.total_seconds })),
    latestLanguages: (latest.data.languages ?? []).slice(0, 8).map((l) => ({ name: l.name, seconds: l.total_seconds })),
    latestEditors: (latest.data.editors ?? []).slice(0, 4).map((e) => ({ name: e.name, seconds: e.total_seconds })),
    latestCategories: (latest.data.categories ?? []).slice(0, 4).map((c) => ({ name: c.name, seconds: c.total_seconds, percent: c.percent })),
    // account-level snapshots (from waka_meta)
    allTimeText: allTime?.text ?? null,
    allTimeDailyAvg: allTime?.daily_average ? formatSeconds(allTime.daily_average) : null,
    allTimeStart: allTime?.range?.start_date ?? null,
    stats7Total: stats7?.human_readable_total ?? null,
    stats7Avg: stats7?.human_readable_daily_average ?? null,
    goals: goalsList,
    // most recent day's timeline (durations)
    timeline: latestWithTimeline?.durations
      ? {
          date: latestWithTimeline.date,
          start: latestWithTimeline.durations.start,
          end: latestWithTimeline.durations.end,
          blocks: latestWithTimeline.durations.data ?? [],
        }
      : null,
  }
}

function buildWeekdayData(rows: DailyRow[]) {
  const weekdayMap = new Map<string, number>()
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  for (const day of days) {
    weekdayMap.set(day, 0)
  }

  for (const row of rows) {
    const date = new Date(row.date + 'T00:00:00Z')
    const dayName = days[date.getUTCDay() === 0 ? 6 : date.getUTCDay() - 1]
    const current = weekdayMap.get(dayName) ?? 0
    weekdayMap.set(dayName, current + (row.data.grand_total?.total_seconds ?? 0))
  }

  return Array.from(weekdayMap.entries()).map(([day, seconds]) => ({
    day,
    hours: Math.round((seconds / 3600) * 10) / 10,
  }))
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-4">
      <p className="text-[#7f8ea3] text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-[#e1e7ef]">{value}</p>
      {sub && <p className="text-[#7f8ea3] text-xs mt-1">{sub}</p>}
    </div>
  )
}

function MetricPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="border border-[#1d283a] rounded-lg p-3">
      <p className="text-[#7f8ea3] text-xs uppercase mb-1">{label}</p>
      <p className="text-lg font-semibold text-[#e1e7ef]">{value}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const data = await getData()

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0c1117] p-6 max-w-7xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-[#2595ff] rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4">W</div>
          <h1 className="text-[#e1e7ef] text-xl font-semibold mb-2">No data yet</h1>
          <p className="text-[#7f8ea3] text-sm max-w-sm">
            Trigger your first sync by visiting{' '}
            <code className="bg-[#1d283a] px-1 rounded text-[#3b82f6]">/api/wakatime/sync</code>.
            <br />
            To backfill history:{' '}
            <code className="bg-[#1d283a] px-1 rounded text-[#3b82f6]">/api/wakatime/sync?backfill=30</code>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <h1 className="text-2xl font-bold text-[#e1e7ef]">Activity Overview</h1>
        <RefreshButton />
      </div>

      {/* Activity Overview Section */}
      <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[#7f8ea3] text-sm uppercase tracking-wide mb-2">Over the Last 7 Days</p>
            <p className="text-5xl font-bold text-[#e1e7ef]">{formatSeconds(data.weekSeconds)}</p>
          </div>
          <StatCard label="Current Day" value={data.currentDayText} />
          <StatCard label="Daily Average" value={formatSeconds(Math.round(data.weekSeconds / 7))} sub="over 7 days" />
          <StatCard label="Most Active" value={data.mostActiveLabel} sub="top day" />
        </div>
      </div>

      {/* All-Time strip (from WakaTime /all_time_since_today) */}
      {data.allTimeText && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="All-Time Total" value={data.allTimeText} sub={data.allTimeStart ? `since ${data.allTimeStart}` : undefined} />
          <StatCard label="All-Time Daily Avg" value={data.allTimeDailyAvg ?? '—'} />
          <StatCard label="Last 7 Days (WakaTime)" value={data.stats7Total ?? '—'} />
          <StatCard label="7-Day Daily Avg" value={data.stats7Avg ?? '—'} />
        </div>
      )}

      {/* Daily Timeline (from /durations) */}
      {data.timeline && (
        <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#e1e7ef]">Timeline</h2>
            <span className="text-xs text-[#7f8ea3]">{data.timeline.date}</span>
          </div>
          <TimelineChart date={data.timeline.date} blocks={data.timeline.blocks} />
        </div>
      )}

      {/* AI Coding Section */}
      <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-[#e1e7ef] mb-6">AI Coding</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="md:col-span-2 flex items-center justify-center">
            <AICodingChart
              aiPercent={data.totalAiAdditions > 0 ? Math.round((data.totalAiAdditions / (data.totalAiAdditions + data.totalHumanAdditions)) * 100) : 0}
            />
          </div>
          <div className="md:col-span-4 grid grid-cols-2 gap-4">
            <MetricPill value={data.totalAiAdditions} label="AI Additions" />
            <MetricPill value={data.totalHumanAdditions} label="Human Additions" />
            <MetricPill value={data.totalAiCost > 0 ? `$${data.totalAiCost.toFixed(2)}` : '$0'} label="Estimated AI Cost" />
            <MetricPill value="32%" label="Human Review" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Projects */}
        <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6">
          <h3 className="text-base font-medium text-[#e1e7ef] text-center mb-4">Projects</h3>
          <div className="space-y-3">
            {data.topProjects.slice(0, 3).map((project) => (
              <div key={project.name}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-[#e1e7ef]">{project.name}</span>
                  <span className="text-xs text-[#7f8ea3]">{formatSeconds(project.seconds)}</span>
                </div>
                <div className="h-2 bg-[#1d283a] rounded-full">
                  <div className="h-2 bg-[#2595ff] rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6">
          <h3 className="text-base font-medium text-[#e1e7ef] text-center mb-4">Categories</h3>
          <BreakdownPie data={data.topCategories} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Editors */}
        <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6">
          <h3 className="text-base font-medium text-[#e1e7ef] text-center mb-4">Editors</h3>
          <BreakdownPie data={data.topEditors} />
        </div>

        {/* Languages */}
        <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6">
          <h3 className="text-base font-medium text-[#e1e7ef] text-center mb-4">Languages</h3>
          <BreakdownPie data={data.topLanguages} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Operating Systems */}
        <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6">
          <h3 className="text-base font-medium text-[#e1e7ef] text-center mb-4">Operating Systems</h3>
          <BreakdownPie data={data.topOSs} />
        </div>

        {/* Machines */}
        <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6">
          <h3 className="text-base font-medium text-[#e1e7ef] text-center mb-4">Machines</h3>
          <BreakdownPie data={data.topMachines} />
        </div>
      </div>

      {/* Daily Comparison and Weekdays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6">
          <h3 className="text-base font-medium text-[#e1e7ef] text-center mb-4">Daily Activity</h3>
          <ActivityChart data={data.dailyActivity} />
        </div>

        <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6">
          <h3 className="text-base font-medium text-[#e1e7ef] text-center mb-4">Weekdays</h3>
          <WeekdaysChart data={data.weekdayData} />
        </div>
      </div>

      {/* Goals (from WakaTime /goals) */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-[#e1e7ef] mb-5">Goals</h2>
        {data.goals.length === 0 ? (
          <div className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-6">
            <p className="text-[#7f8ea3] text-sm">
              No goals set in WakaTime yet. Create one at{' '}
              <span className="text-[#3b82f6]">wakatime.com/goals</span> and it&apos;ll appear here on the next sync.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.goals.map((g, i) => {
              const goal = g as { title?: string; type?: string; cumulative_status?: string; is_enabled?: boolean }
              return (
                <div key={i} className="bg-[#0c1117] border border-[#1d283a] rounded-lg p-5">
                  <h3 className="font-semibold text-[#e1e7ef] mb-1">{goal.title ?? `Goal ${i + 1}`}</h3>
                  {goal.type && <p className="text-xs text-[#7f8ea3] mb-2 capitalize">{goal.type.replace(/_/g, ' ')}</p>}
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                      goal.cumulative_status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-[#1d283a] text-[#7f8ea3]'
                    }`}
                  >
                    {goal.cumulative_status ?? (goal.is_enabled ? 'active' : 'inactive')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Per-project detail now lives in the Projects tab (/dashboard/projects) */}
      <div className="flex justify-center">
        <a
          href="/dashboard/projects"
          className="text-sm text-[#3b82f6] hover:text-[#2595ff] font-medium"
        >
          View detailed per-project breakdown →
        </a>
      </div>
    </main>
  )
}
