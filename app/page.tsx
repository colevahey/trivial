'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ActorSearch } from '@/components/ui/ActorSearch'
import { ActorCard } from '@/components/ui/ActorCard'
import type { Actor, SearchResult } from '@/lib/types'

const FEATURED_IDS = [287, 6193, 1245, 3223, 2524, 1283, 1327, 500]

export default function HomePage() {
  const router = useRouter()
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([])
  const [featuredActors, setFeaturedActors] = useState<Actor[]>([])

  useEffect(() => {
    Promise.allSettled(FEATURED_IDS.map(id => fetch(`/api/actor/${id}`).then(r => r.json())))
      .then(results => {
        setFeaturedActors(
          results.flatMap(r => (r.status === 'fulfilled' && r.value?.id ? [r.value as Actor] : []))
        )
      })
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
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800/60">
        {/* Background film strip decoration */}
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

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
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
            Explore actor careers through interactive charts, discover hidden connections between Hollywood stars, and challenge yourself with trivia.
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

      {/* Daily Challenge banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <a href="/trivia/game" className="block w-full bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/60 rounded-2xl p-5 text-center transition-colors group">
          <div className="text-amber-400 text-sm font-medium mb-1">🎬 Daily Challenge</div>
          <div className="text-white text-lg font-bold group-hover:text-amber-100 transition-colors">Play Today's Trivia</div>
          <div className="text-zinc-400 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </a>
      </div>

      {/* Feature cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {[
            {
              href: '/actor/287',
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              ),
              title: 'Career Mapper',
              description: 'Interactive timeline, genre breakdown, box office charts, and co-star network for any actor.',
              cta: 'Explore a career',
            },
            {
              href: '/six-degrees',
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              ),
              title: 'Six Degrees',
              description: 'Find the shortest path between any two actors through their shared films.',
              cta: 'Find a connection',
            },
            {
              href: '/trivia',
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              title: 'Six Degrees Trivia',
              description: 'Manually build the connection path yourself. Race to the target with the fewest steps.',
              cta: 'Play now',
            },
          ].map(card => (
            <a
              key={card.href}
              href={card.href}
              className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-amber-500/30 hover:bg-zinc-900/80 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-transparent transition-all duration-300" />
              <div className="relative">
                <div className="text-amber-400 mb-4 opacity-80 group-hover:opacity-100 transition-opacity">{card.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{card.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-4">{card.description}</p>
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

        {/* Featured actors */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Featured Actors</h2>
            <span className="text-zinc-500 text-sm">Click to explore their career</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {featuredActors.length === 0
              ? FEATURED_IDS.map(id => (
                  <div key={id} className="aspect-[2/3] bg-zinc-900 rounded-xl animate-pulse" />
                ))
              : featuredActors.map(actor => (
                  <ActorCard
                    key={actor.id}
                    actor={actor}
                    href={`/actor/${actor.id}`}
                  />
                ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
