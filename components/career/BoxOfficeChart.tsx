'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Movie } from '@/lib/types'

interface BoxOfficeChartProps {
  credits: Movie[]
}

interface DataPoint {
  year: number
  revenue: number
  topFilm: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: number
}) {
  if (!active || !payload?.length) return null
  const revenue = payload[0].value
  // Find topFilm from the payload's data
  const topFilm = (payload[0] as unknown as { payload: DataPoint }).payload.topFilm
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl max-w-[200px]">
      <div className="text-zinc-300 text-xs font-semibold mb-1">{label}</div>
      <div className="text-amber-400 text-sm font-bold">${revenue.toFixed(0)}M</div>
      {topFilm && (
        <div className="text-zinc-400 text-xs mt-1 leading-tight">{topFilm}</div>
      )}
    </div>
  )
}

export function BoxOfficeChart({ credits }: BoxOfficeChartProps) {
  const byYear: Record<number, { revenue: number[]; films: Movie[] }> = {}

  credits
    .filter(m => m.release_date && m.revenue > 0)
    .forEach(m => {
      const year = new Date(m.release_date).getFullYear()
      if (!byYear[year]) byYear[year] = { revenue: [], films: [] }
      byYear[year].revenue.push(m.revenue)
      byYear[year].films.push(m)
    })

  const data: DataPoint[] = Object.entries(byYear)
    .map(([year, vals]) => {
      const topFilm = vals.films.reduce((best, m) => m.revenue > best.revenue ? m : best, vals.films[0])
      return {
        year: parseInt(year),
        revenue: vals.revenue.reduce((s, v) => s + v, 0) / 1_000_000,
        topFilm: topFilm?.title ?? '',
      }
    })
    .sort((a, b) => a.year - b.year)

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
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="year"
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={{ stroke: '#3f3f46' }}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={{ stroke: '#3f3f46' }}
            tickFormatter={v => `$${v.toFixed(0)}M`}
          />
          <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: '#27272a' }} />
          <Bar
            dataKey="revenue"
            name="Box Office"
            fill="#f59e0b"
            fillOpacity={0.8}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
