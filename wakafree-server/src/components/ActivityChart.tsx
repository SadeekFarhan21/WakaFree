'use client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  data: Array<{ date: string; seconds: number }>
}

export default function ActivityChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    hours: Math.round(d.seconds / 360) / 10,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} unit="h" />
        <Tooltip
          formatter={(value) => [`${value}h`, 'Coding']}
          contentStyle={{
            backgroundColor: '#1f2937',
            border: 'none',
            borderRadius: '8px',
            color: '#f9fafb',
          }}
        />
        <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
