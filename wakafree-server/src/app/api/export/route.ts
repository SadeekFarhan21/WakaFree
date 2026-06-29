import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/export
// Dumps everything WakaFree has collected: every daily summary + timeline,
// plus all account-level snapshots (profile, all-time, goals, projects,
// machines, agents, stats). One place that exposes everything.
export async function GET() {
  const [daily, meta] = await Promise.all([
    supabase
      .from('waka_daily')
      .select('date, data, durations, synced_at')
      .order('date', { ascending: false }),
    supabase.from('waka_meta').select('key, data, synced_at'),
  ])

  if (daily.error || meta.error) {
    return NextResponse.json(
      { error: daily.error?.message ?? meta.error?.message },
      { status: 500 }
    )
  }

  // Reshape meta rows into a keyed object for convenience.
  const metaObject: Record<string, unknown> = {}
  for (const row of meta.data ?? []) {
    metaObject[row.key] = { data: row.data, synced_at: row.synced_at }
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    counts: {
      days: daily.data?.length ?? 0,
      days_with_durations: (daily.data ?? []).filter((d) => d.durations != null).length,
      meta_keys: Object.keys(metaObject).length,
    },
    meta: metaObject,
    daily: daily.data ?? [],
  })
}
