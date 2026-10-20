// Shared mapping from a waka_daily row to the timeline payload used by the
// dashboard cards and the /api/timeline route.

export interface TimelineBlock {
  time: number
  duration: number
  project: string
}

export interface TimelinePayload {
  date: string
  totalText: string | null
  projectBlocks: TimelineBlock[]
  slices: Record<string, TimelineBlock[]>
}

interface DurationsWrapper {
  data?: Array<Record<string, unknown> & { time: number; duration: number }>
}

export interface TimelineRow {
  data?: { grand_total?: { text?: string } } | null
  durations?: DurationsWrapper | null
  durations_category?: DurationsWrapper | null
  durations_slices?: Record<string, DurationsWrapper | null> | null
}

// Canonical display names for machines that have multiple WakaTime hostnames.
// Single source of truth — the dashboard imports this too.
export const MACHINE_ALIASES: Record<string, string> = {
  '80a9973d436b': 'MacBook M3 Max',
  'Farhans-MacBook-Neo.local': 'MacBook Neo',
  'codespaces-f027bb': 'GitHub Codespaces',
  'dev-dsk-fsadeek-2a-5b2fc1da.us-west-2.amazon.com': 'Amazon Dev Desktop',
}

export function normalizeMachineName(name: string): string {
  if (MACHINE_ALIASES[name]) return MACHINE_ALIASES[name]
  // macOS appends -2, -5, -6, ... to the hostname on network conflicts.
  if (/^Farhans-MacBook-Pro(-\d+)?\.local$/.test(name)) return 'MacBook M4 Pro'
  // EC2 internal hostnames and dataplane agent boxes are all Amazon EC2.
  if (/^ip-\d+-\d+-\d+-\d+\./.test(name) || /^ds-.*agent/.test(name)) return 'Amazon EC2'
  return name
}

// Each slice's blocks carry their own field name (category, language, ...).
function blockLabel(b: Record<string, unknown>): string {
  const raw = String(
    b.category ??
      b.language ??
      b.editor ??
      b.machine ??
      b.operating_system ??
      b.os ??
      b.project ??
      'Other'
  )
  // Normalize machine names if this block is machine-sliced.
  if (b.machine !== undefined) return normalizeMachineName(raw)
  // Unattributed time shares the Miscellaneous lane with the daily stacks.
  if (raw === 'Unknown Project') return 'Miscellaneous'
  return raw
}

function toBlocks(wrap: DurationsWrapper | null | undefined): TimelineBlock[] {
  return (wrap?.data ?? []).map((b) => ({
    time: b.time,
    duration: b.duration,
    project: blockLabel(b),
  }))
}

// Human coding wins over AI coding: AI Coding time that overlaps a Coding
// block is cut out, so the two lanes never cover the same moment.
export const HUMAN_CODING = 'Coding'
export const AI_CODING = 'AI Coding'

// Remove every part of `blocks` that overlaps any span in `cut`.
export function subtractSpans<T extends { time: number; duration: number }>(
  blocks: T[],
  cut: { time: number; duration: number }[]
): T[] {
  const spans = [...cut].sort((a, b) => a.time - b.time)
  const out: T[] = []
  for (const b of blocks) {
    let start = b.time
    const end = b.time + b.duration
    for (const c of spans) {
      const cEnd = c.time + c.duration
      if (cEnd <= start) continue
      if (c.time >= end) break
      if (c.time > start) out.push({ ...b, time: start, duration: c.time - start })
      start = Math.max(start, cEnd)
      if (start >= end) break
    }
    if (start < end) out.push({ ...b, time: start, duration: end - start })
  }
  return out
}

export function exclusiveCoding<T extends { time: number; duration: number; project?: string | null }>(
  blocks: T[]
): T[] {
  const human = blocks.filter((b) => b.project === HUMAN_CODING)
  if (human.length === 0) return blocks
  const ai = blocks.filter((b) => b.project === AI_CODING)
  const rest = blocks.filter((b) => b.project !== AI_CODING)
  return [...rest, ...subtractSpans(ai, human)]
}

export function mapTimelineRow(date: string, row: TimelineRow | null): TimelinePayload {
  const slices: Record<string, TimelineBlock[]> = {}
  if (row?.durations_slices) {
    for (const [key, wrap] of Object.entries(row.durations_slices)) {
      const blocks = toBlocks(wrap)
      if (blocks.length > 0) slices[key] = blocks
    }
  }
  // Older syncs only have the category slice in its own column.
  if (!slices.category && row?.durations_category?.data?.length) {
    slices.category = toBlocks(row.durations_category)
  }
  if (slices.category) slices.category = exclusiveCoding(slices.category)

  return {
    date,
    totalText: row?.data?.grand_total?.text ?? null,
    projectBlocks: toBlocks(row?.durations),
    slices,
  }
}
