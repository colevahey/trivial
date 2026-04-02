'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { Movie } from '@/lib/types'

interface BoxOfficeChartProps {
  credits: Movie[]
}

interface DataPoint {
  year: number
  revenue: number
  rating: number
  title: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <div className="text-zinc-300 text-xs font-semibold mb-2">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="text-white font-medium">
            {p.name === 'Box Office' ? `$${p.value.toFixed(0)}M` : p.value.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function BoxOfficeChart({ credits }: BoxOfficeChartProps) {
  // Aggregate by year
  const byYear: Record<number, { revenue: number[]; rating: number[] }> = {}

  credits
    .filter(m => m.release_date && m.vote_average > 0)
    .forEach(m => {
      const year = new Date(m.release_date).getFullYear()
      if (!byYear[year]) byYear[year] = { revenue: [], rating: [] }
      if (m.revenue > 0) byYear[year].revenue.push(m.revenue)
      byYear[year].rating.push(m.vote_average)
    })

  const data: DataPoint[] = Object.entries(byYear)
    .map(([year, vals]) => ({
      year: parseInt(year),
      revenue: vals.revenue.length > 0
        ? vals.revenue.reduce((s, v) => s + v, 0) / 1_000_000
        : 0,
      rating: vals.rating.reduce((s, v) => s + v, 0) / vals.rating.length,
      title: `${year}`,
    }))
    .sort((a, b) => a.year - b.year)
    .filter(d => d.revenue > 0 || d.rating > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        No box office data available
      </div>
    )
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="year"
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={{ stroke: '#3f3f46' }}
          />
          <YAxis
            yAxisId="revenue"
            orientation="left"
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={{ stroke: '#3f3f46' }}
            tickFormatter={v => `$${v.toFixed(0)}M`}
          />
          <YAxis
            yAxisId="rating"
            orientation="right"
            domain={[0, 10]}
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={{ stroke: '#3f3f46' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }}
          />
          <Bar
            yAxisId="revenue"
            dataKey="revenue"
            name="Box Office"
            fill="#6366f1"
            fillOpacity={0.7}
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="rating"
            type="monotone"
            dataKey="rating"
            name="Avg Rating"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#fbbf24' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
