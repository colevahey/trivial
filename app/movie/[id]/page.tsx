'use client'

import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import { useMovieDetail } from '@/hooks/useMovieDetail'
import { useMovieCredits } from '@/hooks/useMovieCredits'
import { ActorCard } from '@/components/ui/ActorCard'
import type { Credit } from '@/lib/types'

export default function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const movieId = parseInt(id, 10)

  const { movie, isLoading: movieLoading } = useMovieDetail(movieId)
  const { cast, crew, isLoading: castLoading } = useMovieCredits(movieId)
  const director = crew.find(c => c.job === 'Director')

  if (movieLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500">Loading film data...</span>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-zinc-600 text-6xl mb-4">?</div>
        <h2 className="text-2xl font-bold text-white mb-2">Film not found</h2>
        <p className="text-zinc-500 mb-8">We couldn&apos;t find this film in the database.</p>
        <Link href="/" className="text-amber-400 hover:text-amber-300 transition-colors">
          Back to search
        </Link>
      </div>
    )
  }

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  const genres = movie.genres ?? []

  const stats = [
    { label: 'Rating', value: movie.vote_average > 0 ? movie.vote_average.toFixed(1) : '—', tooltip: 'Average user rating on themoviedb.org (0–10)' },
    { label: 'Box Office', value: movie.revenue > 0 ? `$${(movie.revenue / 1_000_000).toFixed(0)}M` : '—' },
    { label: 'Budget', value: (movie.budget && movie.budget > 0) ? `$${(movie.budget / 1_000_000).toFixed(0)}M` : '—' },
    { label: 'Runtime', value: movie.runtime ? `${movie.runtime}m` : '—' },
  ]

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to search
      </Link>

      {/* Hero */}
      <div className="flex flex-col sm:flex-row gap-8 mb-10">
        <div className="flex-shrink-0">
          <div className="w-40 sm:w-56 rounded-2xl overflow-hidden bg-zinc-800 ring-2 ring-zinc-700 shadow-2xl aspect-[2/3]">
            {movie.poster_path ? (
              <Image
                src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
                alt={movie.title}
                width={224}
                height={336}
                className="w-full h-full object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <h1 className="text-4xl font-black text-white mb-1 leading-tight">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {year && <span className="text-amber-400 font-medium">{year}</span>}
              {genres.map(g => (
                <span key={g.id} className="text-zinc-500">{g.name}</span>
              ))}
            </div>
            {director && (
              <p className="text-zinc-400 text-sm mt-2">
                Directed by{' '}
                <Link href={`/director/${director.id}`} className="text-amber-400 hover:text-amber-300 transition-colors">
                  {director.name}
                </Link>
              </p>
            )}
            {movie.tagline && (
              <p className="text-zinc-400 italic text-sm mt-1">&ldquo;{movie.tagline}&rdquo;</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {stats.map(stat => (
              <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3" title={stat.tooltip}>
                <div className="text-2xl font-black text-amber-400">{stat.value}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {movie.overview && (
            <p className="text-zinc-400 text-sm leading-relaxed">{movie.overview}</p>
          )}
        </div>
      </div>

      {/* Cast */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Cast</h2>
        {castLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-24 aspect-[2/3] bg-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : cast.length === 0 ? (
          <p className="text-zinc-500 text-sm">No cast data available.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {cast.map((member: Credit) => (
              <div key={member.id} className="flex-shrink-0 w-24">
                <ActorCard
                  actor={{ ...member, biography: '', birthday: null, known_for_department: member.character, popularity: 0 }}
                  href={`/actor/${member.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
