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

// Each slice's blocks carry their own field name (category, language, ...).
function blockLabel(b: Record<string, unknown>): string {
  return String(
    b.category ??
      b.language ??
      b.editor ??
      b.machine ??
      b.operating_system ??
      b.os ??
      b.project ??
      'Other'
  )
}

function toBlocks(wrap: DurationsWrapper | null | undefined): TimelineBlock[] {
  return (wrap?.data ?? []).map((b) => ({
    time: b.time,
    duration: b.duration,
    project: blockLabel(b),
  }))
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

  return {
    date,
    totalText: row?.data?.grand_total?.text ?? null,
    projectBlocks: toBlocks(row?.durations),
    slices,
  }
}
