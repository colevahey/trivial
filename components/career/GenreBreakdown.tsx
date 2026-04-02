'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { Movie } from '@/lib/types'

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
}

interface GenreBreakdownProps {
  credits: Movie[]
}

export function GenreBreakdown({ credits }: GenreBreakdownProps) {
  const genreCounts: Record<string, number> = {}

  credits.forEach(movie => {
    (movie.genre_ids || []).forEach(id => {
      const name = GENRE_MAP[id]
      if (name) {
        genreCounts[name] = (genreCounts[name] || 0) + 1
      }
    })
  })

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([genre, count]) => ({ genre, count }))

  if (topGenres.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        No genre data available
      </div>
    )
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={topGenres} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis
            dataKey="genre"
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={90}
            tick={{ fill: '#71717a', fontSize: 9 }}
            axisLine={false}
            tickCount={4}
          />
          <Radar
            name="Films"
            dataKey="count"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 12,
            }}
            formatter={(value) => [`${value} films`, 'Count']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
