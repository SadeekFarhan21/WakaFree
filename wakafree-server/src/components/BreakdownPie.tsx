'use client'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// WakaTime (c3/d3) default chart palette
const COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
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
      <p className="text-[#7f8ea3] text-sm text-center py-10">No data yet.</p>
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
            backgroundColor: '#030711',
            border: '1px solid #1d283a',
            borderRadius: '8px',
            color: '#e1e7ef',
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: '#7f8ea3', fontSize: '12px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
