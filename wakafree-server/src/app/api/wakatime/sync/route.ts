import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const WAKATIME_API = 'https://wakatime.com/api/v1'

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

// GET /api/wakatime/sync
// ?date=YYYY-MM-DD       → sync a specific date
// ?backfill=N            → sync the last N days (max 365)
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

  let start: string, end: string
  if (specificDate) {
    start = specificDate
    end = specificDate
  } else {
    end = offsetDate(1)
    start = backfillDays > 1 ? offsetDate(backfillDays) : end
  }

  try {
    const url = `${WAKATIME_API}/users/current/summaries?start=${start}&end=${end}`
    const res = await fetch(url, { headers: wakaHeaders() })

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

    if (days.length === 0) {
      return NextResponse.json({ synced: 0, message: 'WakaTime returned no data for this range' })
    }

    const rows = days.map((day) => ({
      date: day.range.date,
      data: day,
      synced_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('waka_daily')
      .upsert(rows, { onConflict: 'date' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ synced: rows.length, dates: rows.map((r) => r.date) })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
