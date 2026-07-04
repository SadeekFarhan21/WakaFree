'use client'
import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

// Muted Nord-style family: matched saturation, distinct hues
const COLORS = [
  '#b48ead', '#88c0d0', '#a3be8c', '#ebcb8b', '#d08770',
  '#8fbcbb', '#81a1c1', '#bf616a', '#d5b3cf', '#94a3b8',
]

interface Props {
  data: Array<{ name: string; seconds: number }>
  // 'time' renders values as durations; 'lines' as compact line counts
  valueKind?: 'time' | 'lines'
  // Rotates the palette so each card leads with a different hue
  paletteOffset?: number
}

function fmtTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtLines(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

export default function BreakdownPie({ data, valueKind = 'time', paletteOffset = 0 }: Props) {
  const colorAt = (i: number) => COLORS[(i + paletteOffset) % COLORS.length]
  const fmt = valueKind === 'lines' ? fmtLines : fmtTime
  const [active, setActive] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <p className="text-outline text-sm text-center py-10">No data yet.</p>
    )
  }

  const chartData = data.map((d) => ({
    name: d.name,
    value: Math.round(d.seconds / 60),
  }))
  const total = data.reduce((s, d) => s + d.seconds, 0)
  const hovered = active !== null ? data[active] : null

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
      {/* Donut; center shows hovered slice, or the total */}
      <div className="relative h-[190px] w-[190px] shrink-0" onMouseLeave={() => setActive(null)}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              dataKey="value"
              paddingAngle={1.5}
              stroke="#12161d"
              strokeWidth={2}
              cornerRadius={3}
              isAnimationActive={false}
              onMouseEnter={(_, i) => setActive(i)}
            >
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={colorAt(i)}
                  fillOpacity={active === null || active === i ? 1 : 0.3}
                  style={{ transition: 'fill-opacity 150ms ease', outline: 'none' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-9 text-center">
          {hovered ? (
            <>
              <p className="text-lg font-semibold tracking-[-0.01em] text-onsurface">{fmt(hovered.seconds)}</p>
              <p className="w-full truncate font-mono text-[10px] tracking-[0.02em] text-onsurface-variant">
                {hovered.name}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold tracking-[-0.01em] text-onsurface">{fmt(total)}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-outline">
                {valueKind === 'lines' ? 'total lines' : 'total'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Breakdown list; hovering a row highlights its slice */}
      <ul className="w-full min-w-0 flex-1 space-y-1 self-center" onMouseLeave={() => setActive(null)}>
        {data.map((d, i) => (
          <li
            key={d.name}
            onMouseEnter={() => setActive(i)}
            className={`flex items-center gap-2 rounded px-1.5 py-0.5 transition-colors ${
              active === i ? 'bg-container-high' : ''
            }`}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: colorAt(i) }}
            />
            <span className="min-w-0 flex-1 truncate text-xs text-onsurface-variant" title={d.name}>
              {d.name}
            </span>
            <span className="shrink-0 font-mono text-[11px] tracking-[0.02em] text-outline">
              {fmt(d.seconds)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
