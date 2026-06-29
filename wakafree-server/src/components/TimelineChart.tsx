interface DurationBlock {
  time: number // epoch seconds (block start)
  duration: number // seconds
  project?: string | null
}

interface Props {
  start: string // ISO day start
  end: string // ISO day end
  blocks: DurationBlock[]
}

const PALETTE = [
  '#6366f1', '#34d399', '#fb923c', '#60a5fa', '#f87171',
  '#a78bfa', '#fbbf24', '#2dd4bf', '#f472b6', '#818cf8',
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

export default function TimelineChart({ start, end, blocks }: Props) {
  const startEpoch = new Date(start).getTime() / 1000
  const endEpoch = new Date(end).getTime() / 1000
  const span = endEpoch - startEpoch

  if (span <= 0 || blocks.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">No timeline for this day.</p>
  }

  const projects = Array.from(new Set(blocks.map((b) => b.project ?? 'Unknown')))

  return (
    <div>
      {/* Track */}
      <div className="relative h-10 bg-gray-800 rounded-md overflow-hidden">
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
            className="absolute text-[10px] text-gray-500 -translate-x-1/2"
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
            <span className="text-xs text-gray-400">{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
