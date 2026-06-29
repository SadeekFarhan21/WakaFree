import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const WAKATIME_API = 'https://wakatime.com/api/v1/users/current'

function wakaHeaders(): HeadersInit {
  const key = process.env.WAKATIME_API_KEY
  if (!key) throw new Error('WAKATIME_API_KEY env var is not set')
  return {
    Authorization: `Basic ${Buffer.from(key).toString('base64')}`,
  }
}

function offsetDate(daysAgo: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

// Fetch a WakaTime endpoint and return its `data` field (or the whole body).
// Returns null on any failure so one bad endpoint never aborts the whole sync.
async function fetchWaka<T = unknown>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${WAKATIME_API}${path}`, { headers: wakaHeaders() })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data ?? json) as T
  } catch {
    return null
  }
}

// Like fetchWaka but returns the whole response body (used for durations, where
// we need the start/end/timezone wrapper to anchor the timeline, not just data).
async function fetchWakaFull<T = unknown>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${WAKATIME_API}${path}`, { headers: wakaHeaders() })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// Pull every account-level dataset WakaTime exposes and upsert it into waka_meta.
async function syncMeta(): Promise<string[]> {
  const synced_at = new Date().toISOString()

  const endpoints: Record<string, string> = {
    profile: '',
    all_time: '/all_time_since_today',
    goals: '/goals',
    projects: '/projects',
    machine_names: '/machine_names',
    user_agents: '/user_agents',
    stats_last_7_days: '/stats/last_7_days',
    stats_last_30_days: '/stats/last_30_days',
    stats_all_time: '/stats/all_time',
  }

  const results = await Promise.all(
    Object.entries(endpoints).map(async ([key, path]) => {
      const data = await fetchWaka(path)
      return data === null ? null : { key, data, synced_at }
    })
  )

  const rows = results.filter((r): r is NonNullable<typeof r> => r !== null)
  if (rows.length > 0) {
    await supabase.from('waka_meta').upsert(rows, { onConflict: 'key' })
  }
  return rows.map((r) => r.key)
}

// GET /api/wakatime/sync
// ?date=YYYY-MM-DD       → sync a specific date
// ?backfill=N            → sync the last N days (max 365)
// ?meta=0                → skip the account-level snapshot refresh
// no params              → sync yesterday
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { searchParams } = new URL(req.url)
  const specificDate = searchParams.get('date')
  const backfillDays = Math.min(Number(searchParams.get('backfill') ?? 1), 365)
  const includeMeta = searchParams.get('meta') !== '0'

  let start: string, end: string
  if (specificDate) {
    start = specificDate
    end = specificDate
  } else {
    end = offsetDate(1)
    start = backfillDays > 1 ? offsetDate(backfillDays) : end
  }

  try {
    // 1. Daily summaries for the whole range (single batched call).
    const summariesUrl = `/summaries?start=${start}&end=${end}`
    const res = await fetch(`${WAKATIME_API}${summariesUrl}`, { headers: wakaHeaders() })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `WakaTime ${res.status}`, detail: text.slice(0, 300) },
        { status: 502 }
      )
    }

    const json = (await res.json()) as {
      data: Array<{ range: { date: string } }>
    }
    const days = json.data ?? []

    // 2. Per-day durations (the timeline) — one call per date, in parallel.
    const durationsByDate = new Map<string, unknown>()
    await Promise.all(
      days.map(async (day) => {
        const date = day.range.date
        const durations = await fetchWakaFull(`/durations?date=${date}`)
        if (durations !== null) durationsByDate.set(date, durations)
      })
    )

    const synced_at = new Date().toISOString()
    const rows = days.map((day) => ({
      date: day.range.date,
      data: day,
      durations: durationsByDate.get(day.range.date) ?? null,
      synced_at,
    }))

    if (rows.length > 0) {
      const { error } = await supabase
        .from('waka_daily')
        .upsert(rows, { onConflict: 'date' })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // 3. Account-level snapshots (all-time, goals, projects, machines, agents, stats, profile).
    let metaSynced: string[] = []
    if (includeMeta) {
      metaSynced = await syncMeta()
    }

    return NextResponse.json({
      synced: rows.length,
      dates: rows.map((r) => r.date),
      durations_captured: durationsByDate.size,
      meta_synced: metaSynced,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
