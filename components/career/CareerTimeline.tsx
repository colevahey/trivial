'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { Movie } from '@/lib/types'

interface CareerTimelineProps {
  credits: Movie[]
}

interface DataPoint {
  year: number
  rating: number
  revenue: number
  title: string
  id: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DataPoint }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-xl max-w-[200px]">
      <div className="text-amber-400 font-semibold text-sm">{d.title}</div>
      <div className="text-zinc-300 text-xs mt-1">{d.year}</div>
      <div className="text-white text-xs mt-0.5">Rating: {d.rating.toFixed(1)}</div>
      {d.revenue > 0 && (
        <div className="text-zinc-400 text-xs">Box Office: ${(d.revenue / 1_000_000).toFixed(0)}M</div>
      )}
    </div>
  )
}

export function CareerTimeline({ credits }: CareerTimelineProps) {
  const data: DataPoint[] = credits
    .filter(m => m.release_date && m.vote_average > 0)
    .map(m => ({
      year: new Date(m.release_date).getFullYear(),
      rating: m.vote_average,
      revenue: m.revenue || 0,
      title: m.title,
      id: m.id,
    }))
    .sort((a, b) => a.year - b.year)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        No timeline data available
      </div>
    )
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue))

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="year"
            type="number"
            domain={['auto', 'auto']}
            tickCount={8}
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={{ stroke: '#3f3f46' }}
            label={{ value: 'Year', position: 'insideBottom', offset: -10, fill: '#71717a', fontSize: 11 }}
          />
          <YAxis
            dataKey="rating"
            type="number"
            domain={[0, 10]}
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={{ stroke: '#3f3f46' }}
            label={{ value: 'Rating', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} fillOpacity={0.85}>
            {data.map((entry, index) => {
              const size = maxRevenue > 0 ? 4 + (entry.revenue / maxRevenue) * 16 : 6
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.rating >= 7 ? '#f59e0b' : entry.rating >= 5 ? '#6366f1' : '#52525b'}
                  r={size}
                />
              )
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
