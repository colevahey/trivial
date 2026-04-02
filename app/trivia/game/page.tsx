'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TriviaGame } from '@/components/trivia/TriviaGame'
import type { Actor, PathNode } from '@/lib/types'

// Popular actor IDs used as seed pool for trivia pairs
const SEED_ACTOR_IDS = [
  287,    // Brad Pitt
  6193,   // Leonardo DiCaprio
  1245,   // Scarlett Johansson
  3223,   // Robert Downey Jr.
  2524,   // Tom Hanks
  1283,   // Meryl Streep
  1327,   // Denzel Washington
  500,    // Tom Cruise
  2888,   // Will Smith
  16828,  // Matt Damon
  1461,   // Julia Roberts
  10993,  // Cate Blanchett
  2037,   // Morgan Freeman
  18269,  // Chris Evans
  74568,  // Chris Hemsworth
  1333,   // Russell Crowe
  12835,  // Christian Bale
  8784,   // Daniel Craig
  1357644, // Timothée Chalamet
  5292,   // Hugh Jackman
]

type LoadingState = 'idle' | 'loading' | 'ready' | 'error'

interface GameConfig {
  startActor: Actor
  targetActor: Actor
  optimalLength: number
}

export default function TriviaGamePage() {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [gameKey, setGameKey] = useState(0)

  const initGame = useCallback(async () => {
    setLoadingState('loading')
    setErrorMessage('')
    setGameConfig(null)

    // Try multiple random pairs until we find one with a valid path
    const shuffled = [...SEED_ACTOR_IDS].sort(() => Math.random() - 0.5)

    for (let attempt = 0; attempt < 8; attempt++) {
      const fromId = shuffled[attempt * 2]
      const toId = shuffled[attempt * 2 + 1]

      if (!fromId || !toId) continue

      try {
        // First find the path to get optimal length
        const pathRes = await fetch('/api/six-degrees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromId, toId }),
        })
        const pathData = await pathRes.json()

        if (!pathData.path || pathData.path.length === 0) continue

        const path: PathNode[] = pathData.path
        // Optimal = number of actor→actor transitions
        const optimalLength = Math.floor((path.length - 1) / 2)

        if (optimalLength < 2 || optimalLength > 4) continue

        // Fetch actor details in parallel
        const [fromRes, toRes] = await Promise.all([
          fetch(`/api/actor/${fromId}`),
          fetch(`/api/actor/${toId}`),
        ])

        if (!fromRes.ok || !toRes.ok) continue

        const [startActor, targetActor] = await Promise.all([
          fromRes.json() as Promise<Actor>,
          toRes.json() as Promise<Actor>,
        ])

        if (!startActor.id || !targetActor.id) continue

        setGameConfig({ startActor, targetActor, optimalLength })
        setLoadingState('ready')
        return
      } catch {
        // Try next pair
        continue
      }
    }

    setErrorMessage('Could not find a valid actor pair. Please try again.')
    setLoadingState('error')
  }, [])

  useEffect(() => {
    initGame()
  }, [initGame])

  function handleRestart() {
    setGameKey(k => k + 1)
    initGame()
  }

  if (loadingState === 'idle' || loadingState === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <div className="text-white font-bold text-xl mb-2">Setting up your game...</div>
            <div className="text-zinc-500 text-sm">Finding two actors with a verified connection</div>
          </div>
        </div>
      </div>
    )
  }

  if (loadingState === 'error') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Setup Failed</h2>
        <p className="text-zinc-500 mb-6 text-sm">{errorMessage || 'Could not initialize game. Check your TMDB API key.'}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={initGame}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-xl transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/trivia"
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            Back
          </Link>
        </div>
      </div>
    )
  }

  if (!gameConfig) return null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Nav breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/trivia"
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Trivia
        </Link>
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          New Game
        </button>
      </div>

      <TriviaGame
        key={gameKey}
        startActor={gameConfig.startActor}
        targetActor={gameConfig.targetActor}
        optimalLength={gameConfig.optimalLength}
        onRestart={handleRestart}
      />
    </div>
  )
}
