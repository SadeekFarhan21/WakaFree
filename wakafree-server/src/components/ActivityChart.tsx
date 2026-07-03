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
        <XAxis dataKey="date" tick={{ fill: '#7f8ea3', fontSize: 12 }} />
        <YAxis tick={{ fill: '#7f8ea3', fontSize: 12 }} unit="h" />
        <Tooltip
          formatter={(value) => [`${value}h`, 'Coding']}
          contentStyle={{
            backgroundColor: '#030711',
            border: '1px solid #1d283a',
            borderRadius: '8px',
            color: '#e1e7ef',
          }}
        />
        <Bar dataKey="hours" fill="#2595ff" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
