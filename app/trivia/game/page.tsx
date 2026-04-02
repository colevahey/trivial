'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TriviaWebGame } from '@/components/trivia/TriviaWebGame'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import type { Actor, PathNode } from '@/lib/types'

const SEED_ACTOR_IDS = [
  287,      // Brad Pitt
  6193,     // Leonardo DiCaprio
  1245,     // Scarlett Johansson
  3223,     // Robert Downey Jr.
  2524,     // Tom Hanks
  1283,     // Meryl Streep
  1327,     // Denzel Washington
  500,      // Tom Cruise
  2888,     // Will Smith
  16828,    // Matt Damon
  1461,     // Julia Roberts
  10993,    // Cate Blanchett
  2037,     // Morgan Freeman
  18269,    // Chris Evans
  74568,    // Chris Hemsworth
  1333,     // Russell Crowe
  12835,    // Christian Bale
  8784,     // Daniel Craig
  1357644,  // Timothée Chalamet
  5292,     // Hugh Jackman
]

type PageState = 'loading' | 'setup' | 'playing' | 'error'

interface GameConfig {
  startActor: Actor
  targetActor: Actor
  optimalLength: number
}

async function findValidPair(
  excludeIds: number[] = []
): Promise<GameConfig | null> {
  const pool = SEED_ACTOR_IDS.filter(id => !excludeIds.includes(id))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)

  for (let i = 0; i < shuffled.length - 1; i++) {
    const fromId = shuffled[i]
    const toId   = shuffled[i + 1]
    if (!fromId || !toId) continue

    try {
      const pathRes = await fetch('/api/six-degrees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId, toId }),
      })
      const pathData = await pathRes.json()
      if (!pathData.path?.length) continue

      const path: PathNode[] = pathData.path
      const optimalLength = Math.floor((path.length - 1) / 2)
      if (optimalLength < 2 || optimalLength > 4) continue

      const [fromRes, toRes] = await Promise.all([
        fetch(`/api/actor/${fromId}`),
        fetch(`/api/actor/${toId}`),
      ])
      if (!fromRes.ok || !toRes.ok) continue

      const [startActor, targetActor]: [Actor, Actor] = await Promise.all([
        fromRes.json(),
        toRes.json(),
      ])
      if (!startActor.id || !targetActor.id) continue

      return { startActor, targetActor, optimalLength }
    } catch {
      continue
    }
  }
  return null
}

async function findActorForSlot(
  keepId: number,
  attempts = 6
): Promise<{ actor: Actor; optimalLength: number } | null> {
  const pool = SEED_ACTOR_IDS.filter(id => id !== keepId)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)

  for (let i = 0; i < Math.min(attempts, shuffled.length); i++) {
    const newId = shuffled[i]
    try {
      const pathRes = await fetch('/api/six-degrees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: keepId, toId: newId }),
      })
      const pathData = await pathRes.json()
      if (!pathData.path?.length) continue

      const optimalLength = Math.floor((pathData.path.length - 1) / 2)
      if (optimalLength < 2 || optimalLength > 4) continue

      const actorRes = await fetch(`/api/actor/${newId}`)
      if (!actorRes.ok) continue
      const actor: Actor = await actorRes.json()
      if (!actor.id) continue

      return { actor, optimalLength }
    } catch {
      continue
    }
  }
  return null
}

export default function TriviaGamePage() {
  const [pageState, setPageState]     = useState<PageState>('loading')
  const [gameConfig, setGameConfig]   = useState<GameConfig | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [gameKey, setGameKey]         = useState(0)
  const [shufflingSlot, setShufflingSlot] = useState<'start' | 'end' | null>(null)

  const initGame = useCallback(async () => {
    setPageState('loading')
    setErrorMessage('')
    setGameConfig(null)

    const config = await findValidPair()
    if (config) {
      setGameConfig(config)
      setPageState('setup')
    } else {
      setErrorMessage('Could not find a valid actor pair. Please try again.')
      setPageState('error')
    }
  }, [])

  useEffect(() => { initGame() }, [initGame])

  async function handleShuffleSlot(slot: 'start' | 'end') {
    if (!gameConfig || shufflingSlot) return
    setShufflingSlot(slot)

    const keepId = slot === 'start' ? gameConfig.targetActor.id : gameConfig.startActor.id
    const result = await findActorForSlot(keepId)

    if (result) {
      setGameConfig(prev => prev ? {
        startActor:   slot === 'start' ? result.actor : prev.startActor,
        targetActor:  slot === 'end'   ? result.actor : prev.targetActor,
        optimalLength: result.optimalLength,
      } : prev)
    }
    setShufflingSlot(null)
  }

  function handlePlay() {
    setGameKey(k => k + 1)
    setPageState('playing')
  }

  function handleRestart() {
    setPageState('loading')
    initGame()
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <div className="text-white font-bold text-xl mb-2">Setting up your game…</div>
            <div className="text-zinc-500 text-sm">Finding two actors with a verified connection</div>
          </div>
        </div>
      </div>
    )
  }

  if (pageState === 'error') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Setup Failed</h2>
        <p className="text-zinc-500 mb-6 text-sm">{errorMessage || 'Could not initialize game.'}</p>
        <div className="flex gap-4 justify-center">
          <button onClick={initGame} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-xl transition-colors">
            Try Again
          </button>
          <Link href="/trivia" className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors">
            Back
          </Link>
        </div>
      </div>
    )
  }

  if (!gameConfig) return null

  // ── Setup ─────────────────────────────────────────────────────────────────

  if (pageState === 'setup') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/trivia" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Trivia
          </Link>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-white mb-2">Connect the dots</h2>
          <p className="text-zinc-500 text-sm">Build a web of movies and actors linking these two stars. Shuffle either one if you want a different challenge.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {(['start', 'end'] as const).map(slot => {
            const actor = slot === 'start' ? gameConfig.startActor : gameConfig.targetActor
            const isShuffling = shufflingSlot === slot
            return (
              <div key={slot} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center gap-3">
                <div className="text-zinc-500 text-xs uppercase tracking-wider">{slot === 'start' ? 'Start' : 'Goal'}</div>
                <div className={`w-20 h-20 rounded-full overflow-hidden bg-zinc-800 ring-2 ${slot === 'start' ? 'ring-amber-400' : 'ring-amber-500/60'}`}>
                  {actor.profile_path
                    ? <Image src={`${TMDB_IMAGE_BASE}${actor.profile_path}`} alt={actor.name} width={80} height={80} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-zinc-400 text-2xl font-bold">{actor.name[0]}</div>}
                </div>
                <div className="text-white font-semibold text-center text-sm leading-snug">{actor.name}</div>
                <button
                  onClick={() => handleShuffleSlot(slot)}
                  disabled={!!shufflingSlot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isShuffling
                    ? <span className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                    : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>}
                  Shuffle
                </button>
              </div>
            )
          })}
        </div>

        <div className="text-center text-zinc-600 text-xs mb-6">
          Optimal path: {gameConfig.optimalLength} hop{gameConfig.optimalLength !== 1 ? 's' : ''}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handlePlay}
            disabled={!!shufflingSlot}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-xl text-lg transition-colors disabled:opacity-40"
          >
            Let&apos;s Play
          </button>
        </div>
      </div>
    )
  }

  // ── Playing ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/trivia" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Trivia
        </Link>
        <button onClick={handleRestart} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          New Game
        </button>
      </div>

      <TriviaWebGame
        key={gameKey}
        startActor={gameConfig.startActor}
        endActor={gameConfig.targetActor}
        optimalLength={gameConfig.optimalLength}
        onRestart={handleRestart}
      />
    </div>
  )
}
