'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ActorSelector } from '@/components/six-degrees/ActorSelector'
import { PathVisualizer } from '@/components/six-degrees/PathVisualizer'
import type { PathNode, SearchResult } from '@/lib/types'

function SixDegreesContent() {
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from')

  const [actorA, setActorA] = useState<SearchResult | null>(null)
  const [actorB, setActorB] = useState<SearchResult | null>(null)
  const [paths, setPaths] = useState<PathNode[][] | null>(null)
  const [pathIndex, setPathIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromActorLoaded, setFromActorLoaded] = useState(false)

  // Load actor from URL param
  useEffect(() => {
    if (fromParam && !fromActorLoaded) {
      setFromActorLoaded(true)
      fetch(`/api/actor/${fromParam}`)
        .then(r => r.json())
        .then(actor => {
          if (actor.id) {
            setActorA({
              id: actor.id,
              name: actor.name,
              profile_path: actor.profile_path,
              known_for_department: actor.known_for_department,
              popularity: actor.popularity,
            })
          }
        })
        .catch(() => {})
    }
  }, [fromParam, fromActorLoaded])

  async function handleFind() {
    if (!actorA || !actorB) return
    setIsSearching(true)
    setPaths(null)
    setPathIndex(0)
    setError(null)

    try {
      const res = await fetch('/api/six-degrees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: actorA.id, toId: actorB.id, maxPaths: 8 }),
      })
      const data = await res.json()

      if (data.error && !data.paths) {
        setError(data.error)
      } else if (!data.paths || data.paths.length === 0) {
        setError(`No path found between ${actorA.name} and ${actorB.name} within 4 hops.`)
      } else {
        setPaths(data.paths)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Six Degrees of Separation
        </div>
        <h1 className="text-4xl font-black text-white mb-3">Connect Two Actors</h1>
        <p className="text-zinc-400 max-w-lg mx-auto">
          Find the shortest path between any two actors through their shared films. Most Hollywood actors are connected within 6 degrees.
        </p>
      </div>

      {/* Selector panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ActorSelector
            label="Actor A"
            selected={actorA}
            onSelect={a => { setActorA(a); setPaths(null); setError(null) }}
            onClear={() => { setActorA(null); setPaths(null); setError(null) }}
          />

          <ActorSelector
            label="Actor B"
            selected={actorB}
            onSelect={b => { setActorB(b); setPaths(null); setError(null) }}
            onClear={() => { setActorB(null); setPaths(null); setError(null) }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 pt-6 border-t border-zinc-800">
          <button
            onClick={handleFind}
            disabled={!actorA || !actorB || isSearching}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 font-bold rounded-xl transition-colors"
          >
            {isSearching ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin" />
                Finding path...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Connection
              </>
            )}
          </button>

          {(actorA || actorB) && (
            <button
              onClick={() => { setActorA(null); setActorB(null); setPaths(null); setError(null) }}
              className="sm:ml-auto text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 text-red-400 text-sm mb-8">
          {error}
        </div>
      )}

      {paths && paths.length > 0 && (
        <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setPathIndex(i => Math.max(0, i - 1))}
              disabled={pathIndex === 0}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Connection</span>
              {paths.length > 1 && (
                <span className="text-zinc-600 text-xs">{pathIndex + 1} of {paths.length}</span>
              )}
            </div>
            <button
              onClick={() => setPathIndex(i => Math.min(paths.length - 1, i + 1))}
              disabled={pathIndex === paths.length - 1}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <PathVisualizer path={paths[pathIndex]!} />
        </div>
      )}

      {/* How it works */}
      {!paths && !isSearching && (
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Pick two actors', desc: 'Search for any two actors from TMDB\'s database of thousands of performers.' },
            { step: '2', title: 'Find the path', desc: 'Our bidirectional BFS algorithm searches from both ends simultaneously to find the shortest connection.' },
            { step: '3', title: 'Follow the chain', desc: 'See the animated path of actor → film → actor → film → actor connecting the two.' },
          ].map(item => (
            <div key={item.step} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="w-8 h-8 bg-amber-400/10 border border-amber-400/20 rounded-full flex items-center justify-center text-amber-400 font-bold text-sm mb-3">
                {item.step}
              </div>
              <div className="text-white font-semibold text-sm mb-1">{item.title}</div>
              <div className="text-zinc-500 text-xs leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SixDegreesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SixDegreesContent />
    </Suspense>
  )
}
