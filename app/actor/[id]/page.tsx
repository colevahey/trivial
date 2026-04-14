'use client'

import { use, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import { useActorCredits } from '@/hooks/useActorCredits'
import { CareerTimeline } from '@/components/career/CareerTimeline'
import { GenreBreakdown } from '@/components/career/GenreBreakdown'
import { BoxOfficeChart } from '@/components/career/BoxOfficeChart'
import { CoStarNetwork } from '@/components/career/CoStarNetwork'
import { FilmCard } from '@/components/ui/FilmCard'
import type { Actor, Movie } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type Tab = 'timeline' | 'genres' | 'boxoffice' | 'costar' | 'filmography'
type FilmSort = 'rating' | 'newest' | 'oldest'

export default function ActorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const actorId = parseInt(id, 10)

  const { data: actor, isLoading: actorLoading } = useSWR<Actor>(
    actorId ? `/api/actor/${actorId}` : null,
    fetcher
  )

  const { credits, isLoading: creditsLoading } = useActorCredits(actorId)
  const [activeTab, setActiveTab] = useState<Tab>('timeline')
  const [filmSort, setFilmSort] = useState<FilmSort>('newest')

  const validCredits = credits.filter(m => m.release_date && m.vote_average > 0)

  const sortedFilms = [...validCredits].sort((a, b) => {
    if (filmSort === 'rating') return b.vote_average - a.vote_average
    if (filmSort === 'newest') return new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    return new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
  })

  const isLoading = actorLoading || creditsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500">Loading actor data...</span>
        </div>
      </div>
    )
  }

  if (!actor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-zinc-600 text-6xl mb-4">?</div>
        <h2 className="text-2xl font-bold text-white mb-2">Actor not found</h2>
        <p className="text-zinc-500 mb-8">We couldn&apos;t find this actor in the database.</p>
        <Link href="/" className="text-amber-400 hover:text-amber-300 transition-colors">
          Back to search
        </Link>
      </div>
    )
  }

  const age = actor.birthday
    ? Math.floor((Date.now() - new Date(actor.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'genres', label: 'Genres' },
    { id: 'boxoffice', label: 'Box Office' },
    { id: 'costar', label: 'Co-Stars' },
    { id: 'filmography', label: 'All Films' },
  ]

  const topRevenue = credits
    .filter(m => m.revenue > 0)
    .reduce((sum, m) => sum + m.revenue, 0)

  const avgRating = validCredits.length > 0
    ? validCredits.reduce((s, m) => s + m.vote_average, 0) / validCredits.length
    : 0

  const chronological = [...validCredits].sort(
    (a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
  )
  const activeYears = chronological.length > 0
    ? `${new Date(chronological[0].release_date).getFullYear()} – ${new Date(chronological[chronological.length - 1].release_date).getFullYear()}`
    : '—'

  const sortLabels: { key: FilmSort; label: string; tooltip?: string }[] = [
    { key: 'rating', label: 'Rating ↓', tooltip: 'Sorted by TMDB user rating — the average score given by viewers on themoviedb.org' },
    { key: 'newest', label: 'Newest' },
    { key: 'oldest', label: 'Oldest' },
  ]

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to search
      </Link>

      {/* Actor hero */}
      <div className="flex flex-col sm:flex-row gap-8 mb-10">
        <div className="flex-shrink-0">
          <div className="w-36 h-48 sm:w-48 sm:h-64 rounded-2xl overflow-hidden bg-zinc-800 ring-2 ring-zinc-700 shadow-2xl">
            {actor.profile_path ? (
              <Image
                src={`${TMDB_IMAGE_BASE}${actor.profile_path}`}
                alt={actor.name}
                width={192}
                height={256}
                className="w-full h-full object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-black text-white mb-1">{actor.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-amber-400">{actor.known_for_department}</span>
                {actor.birthday && (
                  <span className="text-zinc-500">
                    Born {new Date(actor.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {age !== null && <span> · Age {age}</span>}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                href={`/six-degrees?from=${actorId}`}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Six Degrees
              </Link>
              <Link
                href={`/trivia/actor/${actorId}`}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Trivia
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Films', value: credits.length.toString() },
              { label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '—' },
              { label: 'Active Years', value: activeYears },
              { label: 'Total Revenue', value: topRevenue > 0 ? `$${(topRevenue / 1_000_000_000).toFixed(1)}B` : '—' },
            ].map(stat => (
              <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <div className="text-2xl font-black text-amber-400">{stat.value}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {actor.biography && (
            <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">{actor.biography}</p>
          )}
        </div>
      </div>

      {/* All Films section */}
      {sortedFilms.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">All Films</h2>
            <div className="flex gap-1">
              {sortLabels.map(({ key, label, tooltip }) => (
                <button
                  key={key}
                  onClick={() => setFilmSort(key)}
                  title={tooltip}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filmSort === key
                      ? 'bg-amber-400 text-zinc-900'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {sortedFilms.map((film: Movie) => (
              <div key={film.id} className="flex-shrink-0 w-28">
                <FilmCard movie={film} showCharacter href={`/movie/${film.id}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visualization tabs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex overflow-x-auto border-b border-zinc-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-5 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-zinc-800/50'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'timeline' && (
            <div>
              <h3 className="text-white font-semibold mb-1">Career Timeline</h3>
              <p className="text-zinc-500 text-xs mb-4">Film rating over time. Dot size represents box office revenue. Bands: gold = 7+, indigo = 5–7, gray = below 5.</p>
              <CareerTimeline credits={credits} />
            </div>
          )}

          {activeTab === 'genres' && (
            <div>
              <h3 className="text-white font-semibold mb-1">Genre Breakdown</h3>
              <p className="text-zinc-500 text-xs mb-4">Distribution of genres. Click a chip to filter films by genre.</p>
              <GenreBreakdown credits={credits} />
            </div>
          )}

          {activeTab === 'boxoffice' && (
            <div>
              <h3 className="text-white font-semibold mb-1">Box Office</h3>
              <p className="text-zinc-500 text-xs mb-4">Annual box office revenue. Hover a bar to see the top-grossing film that year.</p>
              <BoxOfficeChart credits={credits} />
            </div>
          )}

          {activeTab === 'costar' && (
            <div>
              <h3 className="text-white font-semibold mb-1">Co-Star Network</h3>
              <p className="text-zinc-500 text-xs mb-4">Force-directed graph of most frequent co-stars. Node size reflects shared film count. Click a node to explore that actor.</p>
              <CoStarNetwork
                actorId={actorId}
                actorName={actor.name}
                actorImage={actor.profile_path ? `${TMDB_IMAGE_BASE}${actor.profile_path}` : null}
                credits={credits}
              />
            </div>
          )}

          {activeTab === 'filmography' && (
            <div>
              <h3 className="text-white font-semibold mb-3">Full Filmography</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {[...validCredits]
                  .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
                  .map((film: Movie) => (
                    <FilmCard key={film.id} movie={film} showCharacter href={`/movie/${film.id}`} />
                  ))}
              </div>
              {validCredits.length === 0 && (
                <div className="text-center text-zinc-500 py-12">No films found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
