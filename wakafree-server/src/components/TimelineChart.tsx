import { timezoneForDate, localMidnightEpochSeconds } from '@/lib/timezone'

interface DurationBlock {
  time: number // epoch seconds (block start)
  duration: number // seconds
  project?: string | null
}

interface Props {
  date: string // YYYY-MM-DD — used to anchor the day in the right timezone
  blocks: DurationBlock[]
}

// WakaTime (c3/d3) default chart palette
const PALETTE = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
]

function colorFor(project: string, projects: string[]): string {
  const i = projects.indexOf(project)
  return PALETTE[i % PALETTE.length]
}

// Hour labels across the day (12a, 3a, 6a, ... 12a)
const HOUR_MARKS = [0, 3, 6, 9, 12, 15, 18, 21, 24]
function hourLabel(h: number): string {
  const hh = h % 24
  if (hh === 0) return '12a'
  if (hh === 12) return '12p'
  return hh < 12 ? `${hh}a` : `${hh - 12}p`
}

export default function TimelineChart({ date, blocks }: Props) {
  // Anchor the day to local midnight in the timezone the user was in on this
  // date (Eastern before Jun 11, Pacific after), so the hour axis is correct.
  const tz = timezoneForDate(date)
  const startEpoch = localMidnightEpochSeconds(date, tz)
  const span = 86400 // one full day in seconds

  if (blocks.length === 0) {
    return <p className="text-[#7f8ea3] text-sm text-center py-8">No timeline for this day.</p>
  }

  const projects = Array.from(new Set(blocks.map((b) => b.project ?? 'Unknown')))

  return (
    <div>
      {/* Track */}
      <div className="relative h-10 bg-[#1d283a] rounded-md overflow-hidden">
        {blocks.map((b, i) => {
          const left = ((b.time - startEpoch) / span) * 100
          const width = (b.duration / span) * 100
          const project = b.project ?? 'Unknown'
          const mins = Math.round(b.duration / 60)
          return (
            <div
              key={i}
              className="absolute top-0 h-full rounded-sm"
              style={{
                left: `${Math.max(0, left)}%`,
                width: `${Math.max(0.4, width)}%`,
                backgroundColor: colorFor(project, projects),
              }}
              title={`${project} · ${mins}m`}
            />
          )
        })}
      </div>

      {/* Hour axis */}
      <div className="relative h-4 mt-1">
        {HOUR_MARKS.map((h) => (
          <span
            key={h}
            className="absolute text-[10px] text-[#7f8ea3] -translate-x-1/2"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {hourLabel(h)}
          </span>
        ))}
      </div>

      {/* Project legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {projects.map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: colorFor(p, projects) }}
            />
            <span className="text-xs text-[#7f8ea3]">{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
