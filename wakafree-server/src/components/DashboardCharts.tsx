'use client'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function AICodingChart({ aiPercent }: { aiPercent: number }) {
  const data = [
    { name: 'AI', value: aiPercent },
    { name: 'Human', value: 100 - aiPercent },
  ]

  return (
    <div className="flex flex-col items-center justify-center">
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            paddingAngle={2}
            startAngle={90}
            endAngle={450}
          >
            <Cell fill="#2595ff" />
            <Cell fill="#1d283a" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <p className="text-4xl font-bold text-[#e1e7ef]">{aiPercent}%</p>
        <p className="text-[#7f8ea3] text-sm">AI-driven</p>
      </div>
    </div>
  )
}

export function WeekdaysChart({ data }: { data: Array<{ day: string; hours: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="day" tick={{ fill: '#7f8ea3', fontSize: 12 }} />
        <YAxis tick={{ fill: '#7f8ea3', fontSize: 12 }} unit="h" />
        <Tooltip
          formatter={(value) => [`${value}h`, 'Time']}
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
