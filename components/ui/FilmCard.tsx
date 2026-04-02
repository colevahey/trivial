'use client'

import Image from 'next/image'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import type { Movie } from '@/lib/types'

interface FilmCardProps {
  movie: Movie
  onClick?: () => void
  selected?: boolean
  showCharacter?: boolean
}

export function FilmCard({ movie, onClick, selected, showCharacter = false }: FilmCardProps) {
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null

  return (
    <div
      onClick={onClick}
      className={`group relative bg-zinc-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
        selected
          ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-900/30 scale-[1.02]'
          : 'hover:ring-1 hover:ring-zinc-600 hover:scale-[1.02]'
      }`}
    >
      <div className="aspect-[2/3] relative bg-zinc-800">
        {movie.poster_path ? (
          <Image
            src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 p-4">
            <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <span className="text-xs text-center leading-tight">{movie.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

        {movie.vote_average > 0 && (
          <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-bold ${
            movie.vote_average >= 7
              ? 'bg-amber-400 text-zinc-900'
              : movie.vote_average >= 5
              ? 'bg-zinc-700 text-white'
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            {movie.vote_average.toFixed(1)}
          </div>
        )}

        {selected && (
          <div className="absolute top-2 left-2 bg-amber-400 rounded-full p-1">
            <svg className="w-3 h-3 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-2.5">
        <div className="text-white text-xs font-semibold leading-tight line-clamp-2">{movie.title}</div>
        <div className="flex items-center gap-1.5 mt-1">
          {year && <span className="text-zinc-500 text-xs">{year}</span>}
          {movie.revenue > 0 && (
            <span className="text-zinc-600 text-xs">
              ${(movie.revenue / 1_000_000).toFixed(0)}M
            </span>
          )}
        </div>
        {showCharacter && movie.character && (
          <div className="text-zinc-400 text-xs mt-1 italic line-clamp-1">as {movie.character}</div>
        )}
      </div>
    </div>
  )
}
