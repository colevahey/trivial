'use client'

import Link from 'next/link'
import { FilmCard } from '@/components/ui/FilmCard'
import { useWatchlist } from '@/hooks/useWatchlist'

export default function WatchlistPage() {
  const { watchlist, clear } = useWatchlist()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">Watchlist</h1>
          {watchlist.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-sm font-medium tabular-nums">
              {watchlist.length}
            </span>
          )}
        </div>

        {watchlist.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
          >
            Clear all
          </button>
        )}
      </div>

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-300 mb-2">No movies saved yet</h2>
          <p className="text-zinc-500 text-sm mb-7 max-w-xs leading-relaxed">
            Hover over any movie card and tap the bookmark to save it here.
          </p>
          <Link
            href="/"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm rounded-lg transition-colors"
          >
            Start exploring
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
          {watchlist.map(movie => (
            <FilmCard
              key={movie.id}
              movie={movie}
              href={`/movie/${movie.id}`}
              showWatchlist
            />
          ))}
        </div>
      )}
    </div>
  )
}
