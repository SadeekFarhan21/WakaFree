import { supabase } from '@/lib/supabase'
import { formatSeconds } from '@/lib/compute'
import ActivityChart from '@/components/ActivityChart'
import BreakdownPie from '@/components/BreakdownPie'

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

async function getData() {
  const { data: rows, error } = await supabase
    .from('waka_daily')
    .select('date, data')
    .order('date', { ascending: false })
    .limit(365)

  if (error || !rows || rows.length === 0) return null

  const typed = rows as DailyRow[]

  const latest = typed[0]
  const last7 = typed.slice(0, 7)
  const last30 = typed.slice(0, 30)

  const allTimeSeconds = typed.reduce((s, r) => s + (r.data.grand_total?.total_seconds ?? 0), 0)
  const weekSeconds = last7.reduce((s, r) => s + (r.data.grand_total?.total_seconds ?? 0), 0)
  const monthSeconds = last30.reduce((s, r) => s + (r.data.grand_total?.total_seconds ?? 0), 0)

  const totalAiCost = typed.reduce((s, r) => s + (r.data.grand_total?.ai_agent_total_cost ?? 0), 0)

  const dailyActivity = [...typed]
    .reverse()
    .map((r) => ({ date: r.date, seconds: r.data.grand_total?.total_seconds ?? 0 }))

  return {
    latestDate: latest.data.range.text,
    latestSeconds: latest.data.grand_total?.total_seconds ?? 0,
    latestText: latest.data.grand_total?.text ?? '0 min',
    latestAiCost: latest.data.grand_total?.ai_agent_total_cost ?? 0,
    weekSeconds,
    monthSeconds,
    allTimeSeconds,
    totalAiCost,
    daysStored: typed.length,
    dailyActivity,
    // last 30 days aggregated
    topProjects: aggregateEntries(last30, 'projects', 8),
    topLanguages: aggregateEntries(last30, 'languages', 8),
    topEditors: aggregateEntries(last30, 'editors', 6),
    topCategories: aggregateEntries(last30, 'categories', 4),
    // most recent day breakdown
    latestProjects: (latest.data.projects ?? []).slice(0, 8).map((p) => ({ name: p.name, seconds: p.total_seconds })),
    latestLanguages: (latest.data.languages ?? []).slice(0, 8).map((l) => ({ name: l.name, seconds: l.total_seconds })),
    latestEditors: (latest.data.editors ?? []).slice(0, 4).map((e) => ({ name: e.name, seconds: e.total_seconds })),
    latestCategories: (latest.data.categories ?? []).slice(0, 4).map((c) => ({ name: c.name, seconds: c.total_seconds, percent: c.percent })),
  }
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function BreakdownList({ items }: { items: { name: string; seconds: number }[] }) {
  if (items.length === 0) return <p className="text-gray-500 text-sm">No data yet.</p>
  const max = items[0].seconds
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.name}>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-sm text-gray-200 truncate">{item.name}</span>
            <span className="text-sm text-gray-400 ml-4 shrink-0">{formatSeconds(item.seconds)}</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full">
            <div
              className="h-1 bg-indigo-500 rounded-full"
              style={{ width: `${(item.seconds / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default async function DashboardPage() {
  const data = await getData()

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-950 p-6 max-w-6xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4">W</div>
          <h1 className="text-white text-xl font-semibold mb-2">No data yet</h1>
          <p className="text-gray-400 text-sm max-w-sm">
            Trigger your first sync by visiting{' '}
            <code className="bg-gray-800 px-1 rounded text-indigo-300">/api/wakatime/sync</code>.
            <br />
            To backfill history:{' '}
            <code className="bg-gray-800 px-1 rounded text-indigo-300">/api/wakatime/sync?backfill=30</code>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm font-bold">W</div>
          <h1 className="text-xl font-semibold text-white">WakaFree</h1>
        </div>
        <p className="text-gray-500 text-sm">
          {data.daysStored} day{data.daysStored !== 1 ? 's' : ''} archived
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={`Latest · ${data.latestDate}`}
          value={data.latestText}
          sub={data.latestAiCost > 0 ? `$${data.latestAiCost.toFixed(2)} AI cost` : undefined}
        />
        <StatCard label="Last 7 Days" value={formatSeconds(data.weekSeconds)} />
        <StatCard label="Last 30 Days" value={formatSeconds(data.monthSeconds)} />
        <StatCard
          label={`All Time · ${data.daysStored} days`}
          value={formatSeconds(data.allTimeSeconds)}
          sub={data.totalAiCost > 0 ? `$${data.totalAiCost.toFixed(2)} total AI spend` : undefined}
        />
      </div>

      {/* Daily activity chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-300 mb-4">Daily Activity (all archived days)</h2>
        <ActivityChart data={data.dailyActivity} />
      </div>

      {/* 30-day aggregated breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4">Projects — Last 30 Days</h2>
          <BreakdownPie data={data.topProjects} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-300 mb-4">Languages — Last 30 Days</h2>
          <BreakdownPie data={data.topLanguages} />
        </div>
      </div>

      {/* Most recent day detail */}
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        Most Recent Day · {data.latestDate}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Projects</h3>
          <BreakdownList items={data.latestProjects} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Languages</h3>
          <BreakdownList items={data.latestLanguages} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Editors</h3>
          <BreakdownList items={data.latestEditors} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Categories</h3>
          <ul className="space-y-2">
            {data.latestCategories.map((c) => (
              <li key={c.name} className="flex justify-between items-center">
                <span className="text-sm text-gray-200">{c.name}</span>
                <div className="flex items-center gap-3">
                  {c.percent != null && (
                    <span className="text-xs text-gray-500">{c.percent.toFixed(1)}%</span>
                  )}
                  <span className="text-sm text-gray-400">{formatSeconds(c.seconds)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
