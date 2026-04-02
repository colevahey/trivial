'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
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
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [listSort, setListSort] = useState<'chronological' | 'rating'>('chronological')

  const genreCounts: Record<string, number> = {}
  credits.forEach(movie => {
    (movie.genre_ids || []).forEach(id => {
      const name = GENRE_MAP[id]
      if (name) genreCounts[name] = (genreCounts[name] || 0) + 1
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

  const filteredFilms = selectedGenre
    ? credits
        .filter(m =>
          m.release_date &&
          m.vote_average > 0 &&
          (m.genre_ids || []).some(id => GENRE_MAP[id] === selectedGenre)
        )
        .sort((a, b) =>
          listSort === 'rating'
            ? b.vote_average - a.vote_average
            : new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
        )
    : []

  return (
    <div>
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

      {/* Genre chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        {topGenres.map(({ genre, count }) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedGenre === genre
                ? 'bg-amber-400 text-zinc-900'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            {genre} <span className="opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {/* Filtered film list */}
      {selectedGenre && (
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-zinc-400 text-xs">
              {filteredFilms.length} {selectedGenre} film{filteredFilms.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-1">
              {(['chronological', 'rating'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setListSort(s)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    listSort === s ? 'bg-amber-400 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {s === 'chronological' ? 'Oldest' : <span title="Sorted by TMDB user rating — the average score given by viewers on themoviedb.org">Rating ↓</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredFilms.map(film => (
              <Link
                key={film.id}
                href={`/movie/${film.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex-shrink-0 w-8 h-12 bg-zinc-800 rounded overflow-hidden">
                  {film.poster_path ? (
                    <Image
                      src={`${TMDB_IMAGE_BASE}${film.poster_path}`}
                      alt={film.title}
                      width={32}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-700" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium group-hover:text-amber-400 transition-colors truncate">
                    {film.title}
                  </div>
                  <div className="text-zinc-500 text-xs">
                    {new Date(film.release_date).getFullYear()}
                    {film.character && <span className="ml-2 italic">as {film.character}</span>}
                  </div>
                </div>
                {film.vote_average > 0 && (
                  <div className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                    film.vote_average >= 7 ? 'bg-amber-400/20 text-amber-400' : 'text-zinc-500'
                  }`}>
                    {film.vote_average.toFixed(1)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
