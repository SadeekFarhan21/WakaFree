'use client'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const COLORS = [
  '#6366f1', '#8b5cf6', '#60a5fa', '#34d399',
  '#fbbf24', '#f87171', '#fb923c', '#a78bfa',
]

interface Props {
  data: Array<{ name: string; seconds: number }>
}

function fmt(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function BreakdownPie({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-10">No data yet.</p>
    )
  }

  const chartData = data.map((d) => ({
    name: d.name,
    value: Math.round(d.seconds / 60),
    label: fmt(d.seconds),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          dataKey="value"
          paddingAngle={2}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(_value, _name, props) => [props.payload.label, props.name]}
          contentStyle={{
            backgroundColor: '#1f2937',
            border: 'none',
            borderRadius: '8px',
            color: '#f9fafb',
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
