'use client'

import { useWatchlist } from '@/hooks/useWatchlist'
import type { Movie } from '@/lib/types'

interface WatchlistButtonProps {
  movie: Movie
  className?: string
}

export function WatchlistButton({ movie, className = '' }: WatchlistButtonProps) {
  const { isInWatchlist, toggle } = useWatchlist()
  const saved = isInWatchlist(movie.id)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggle(movie)
  }

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? 'Remove from watchlist' : 'Add to watchlist'}
      className={`flex items-center justify-center w-9 h-9 rounded-full bg-zinc-950/70 backdrop-blur-sm border border-white/5 transition-all duration-150 active:scale-95 ${
        saved
          ? 'opacity-100 [@media(hover:hover)]:hover:scale-110'
          : 'opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:scale-105'
      } ${className}`}
    >
      <svg
        className={`w-4 h-4 transition-colors duration-150 ${
          saved ? 'text-amber-400' : 'text-zinc-400'
        }`}
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  )
}
