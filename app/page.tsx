'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ActorSearch } from '@/components/ui/ActorSearch'
import { ActorCard } from '@/components/ui/ActorCard'
import { SEED_ACTOR_IDS, getDailySeed, mulberry32, getDailyDateLabel } from '@/lib/daily-seed'
import type { Actor, SearchResult } from '@/lib/types'

const FEATURED_IDS = [287, 6193, 1245, 3223, 2524, 1283, 1327, 500]

export default function HomePage() {
  const router = useRouter()
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([])
  const [featuredActors, setFeaturedActors] = useState<Actor[]>([])
  const [dailyActor, setDailyActor] = useState<Actor | null>(null)
  const dateLabel = getDailyDateLabel()

  useEffect(() => {
    // Featured actors
    Promise.allSettled(FEATURED_IDS.map(id => fetch(`/api/actor/${id}`).then(r => r.json())))
      .then(results => {
        setFeaturedActors(
          results.flatMap(r => (r.status === 'fulfilled' && r.value?.id ? [r.value as Actor] : []))
        )
      })

    // Daily Career Quiz actor
    const rand = mulberry32(getDailySeed())
    const id = SEED_ACTOR_IDS[Math.floor(rand() * SEED_ACTOR_IDS.length)]
    fetch(`/api/actor/${id}`).then(r => r.json()).then(setDailyActor).catch(() => {})
  }, [])

  function handleSelect(result: SearchResult) {
    setRecentSearches(prev => {
      const without = prev.filter(a => a.id !== result.id)
      return [result, ...without].slice(0, 4)
    })
    if (result.mediaType === 'movie') {
      router.push(`/movie/${result.id}`)
    } else {
      const route = result.known_for_department === 'Directing' ? 'director' : 'actor'
      router.push(`/${route}/${result.id}`)
    }
  }

  return (
    <div className="flex-1 flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800/60">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-20 top-0 bottom-0 w-64 opacity-[0.03]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex gap-1 mb-1">
                <div className="w-4 h-8 bg-white rounded-sm" />
                <div className="flex-1 h-8 bg-white rounded-sm" />
                <div className="w-4 h-8 bg-white rounded-sm" />
              </div>
            ))}
          </div>
          <div className="absolute -left-20 top-0 bottom-0 w-64 opacity-[0.03]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex gap-1 mb-1">
                <div className="w-4 h-8 bg-white rounded-sm" />
                <div className="flex-1 h-8 bg-white rounded-sm" />
                <div className="w-4 h-8 bg-white rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Powered by TMDB
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-tight tracking-tight">
            Map the <span className="text-amber-400">Cinematic</span> Universe
          </h1>

          <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Explore actor careers, discover hidden connections, and challenge yourself with daily games.
          </p>

          <div className="max-w-lg mx-auto">
            <ActorSearch
              onSelect={handleSelect}
              placeholder="Search actors, directors, or films..."
              className="w-full"
            />
          </div>

          {recentSearches.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="text-zinc-600 text-xs pt-1">Recent:</span>
              {recentSearches.map(a => (
                <button
                  key={a.id}
                  onClick={() => router.push(`/${a.known_for_department === 'Directing' ? 'director' : 'actor'}/${a.id}`)}
                  className="text-xs text-zinc-400 hover:text-amber-400 bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-full transition-colors"
                >
                  {a.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* ── Daily Games ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Today's Challenges</h2>
            <span className="text-zinc-700 text-xs">{dateLabel}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Movie Path Game daily */}
            <a
              href="/trivia/game"
              className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 rounded-2xl p-4 transition-colors group"
            >
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm group-hover:text-amber-100 transition-colors">Movie Path Game</div>
                <div className="text-zinc-500 text-xs mt-0.5">Connect two actors in fewest steps</div>
              </div>
              <svg className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>

            {/* Career Quiz daily */}
            <a
              href={dailyActor ? `/trivia/actor/${dailyActor.id}?daily=true` : '/trivia/actor'}
              className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 rounded-2xl p-4 transition-colors group"
            >
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm group-hover:text-amber-100 transition-colors">Career Quiz</div>
                <div className="text-zinc-500 text-xs mt-0.5 truncate">
                  {dailyActor ? `Today: ${dailyActor.name}` : 'Loading…'}
                </div>
              </div>
              <svg className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Explore group */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Explore</div>
              {[
                {
                  href: '/actor/287',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  ),
                  title: 'Career Mapper',
                  description: 'Interactive timeline, genre radar, box office charts, and co-star network for any actor.',
                  cta: 'Explore a career',
                },
                {
                  href: '/six-degrees',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  ),
                  title: 'Six Degrees',
                  description: 'Find the shortest path between any two actors through their shared films.',
                  cta: 'Find a connection',
                },
              ].map(card => (
                <a
                  key={card.href}
                  href={card.href}
                  className="group flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all duration-200 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 group-hover:from-amber-500/5 to-transparent transition-all duration-300" />
                  <div className="relative">
                    <div className="text-amber-400 mb-3 opacity-80 group-hover:opacity-100 transition-opacity">{card.icon}</div>
                    <h3 className="text-white font-bold text-base mb-1.5">{card.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-3">{card.description}</p>
                    <div className="text-amber-400 text-sm font-medium flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      {card.cta}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Play group */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Play</div>
              {[
                {
                  href: '/trivia/game',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Movie Path Game',
                  description: 'Manually build the connection path between two actors. Race to the target in the fewest steps.',
                  cta: 'Play now',
                },
                {
                  href: '/trivia/actor',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Career Quiz',
                  description: "How well do you know an actor's career? Guess films, ratings, and box office — scored by accuracy.",
                  cta: 'Take a quiz',
                },
              ].map(card => (
                <a
                  key={card.href}
                  href={card.href}
                  className="group flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all duration-200 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 group-hover:from-amber-500/5 to-transparent transition-all duration-300" />
                  <div className="relative">
                    <div className="text-amber-400 mb-3 opacity-80 group-hover:opacity-100 transition-opacity">{card.icon}</div>
                    <h3 className="text-white font-bold text-base mb-1.5">{card.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-3">{card.description}</p>
                    <div className="text-amber-400 text-sm font-medium flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      {card.cta}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>

          </div>
        </section>

        {/* ── Featured Actors ───────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Featured Actors</h2>
            <span className="text-zinc-600 text-xs">Click to explore their career</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {featuredActors.length === 0
              ? FEATURED_IDS.map(id => (
                  <div key={id} className="aspect-[2/3] bg-zinc-900 rounded-xl animate-pulse" />
                ))
              : featuredActors.map(actor => (
                  <ActorCard key={actor.id} actor={actor} href={`/actor/${actor.id}`} />
                ))
            }
          </div>
        </section>

      </div>
    </div>
  )
}
