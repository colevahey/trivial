'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TriviaWebGame } from '@/components/trivia/TriviaWebGame'
import { ActorSearch } from '@/components/ui/ActorSearch'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import type { Actor, PathNode, SearchResult } from '@/lib/types'

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
  1204,     // Julia Roberts
  10993,    // Cate Blanchett
  2037,     // Morgan Freeman
  18269,    // Chris Evans
  74568,    // Chris Hemsworth
  1333,     // Russell Crowe
  12835,    // Christian Bale
  8784,     // Daniel Craig
  1357644,  // Timothée Chalamet
  5292,     // Hugh Jackman
  2231,     // Samuel L. Jackson
  6384,     // Keanu Reeves
  524,      // Natalie Portman
  1461,     // George Clooney
  85,       // Johnny Depp
  2227,     // Nicole Kidman
  4173,     // Anthony Hopkins
  131,      // Jake Gyllenhaal
  72129,    // Jennifer Lawrence
  6885,     // Charlize Theron
  73421,    // Joaquin Phoenix
  18918,    // Dwayne Johnson
  30614,    // Ryan Gosling
  54693,    // Emma Stone
  1813,     // Anne Hathaway
  10859,    // Ryan Reynolds
  71580,    // Benedict Cumberbatch
  1023139,  // Adam Driver
  505710,   // Zendaya
  1373737,  // Florence Pugh
]

// ── Seeded RNG (mulberry32) ───────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function getDailySeed(): number {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (Math.imul(31, hash) + dateStr.charCodeAt(i)) | 0
  }
  return hash
}

function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

// ── Types ─────────────────────────────────────────────────────────────────────

type PageState = 'loading' | 'setup' | 'playing' | 'error'
type GameMode = 'daily' | 'custom'

interface GameConfig {
  startActor: Actor
  targetActor: Actor
  optimalLength: number
}

// ── Pair finders ──────────────────────────────────────────────────────────────

async function findDailyPair(): Promise<GameConfig | null> {
  const rand = mulberry32(getDailySeed())
  const shuffled = seededShuffle([...SEED_ACTOR_IDS], rand)

  for (let i = 0; i < shuffled.length - 1; i++) {
    const fromId = shuffled[i]
    const toId = shuffled[i + 1]
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TriviaGamePage() {
  const [pageState, setPageState]     = useState<PageState>('loading')
  const [gameConfig, setGameConfig]   = useState<GameConfig | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [gameKey, setGameKey]         = useState(0)
  const [gameMode, setGameMode]       = useState<GameMode>('daily')
  const [shufflingSlot, setShufflingSlot] = useState<'start' | 'end' | null>(null)
  const [shufflingBoth, setShufflingBoth] = useState(false)
  const [searchingSlot, setSearchingSlot] = useState<'start' | 'end' | null>(null)
  const [slotError, setSlotError] = useState<{ slot: 'start' | 'end'; msg: string } | null>(null)

  const initGame = useCallback(async () => {
    setPageState('loading')
    setErrorMessage('')
    setGameConfig(null)
    setGameMode('daily')

    const config = await findDailyPair()
    if (config) {
      setGameConfig(config)
      setPageState('setup')
    } else {
      setErrorMessage('Could not find a valid actor pair. Please try again.')
      setPageState('error')
    }
  }, [])

  useEffect(() => { initGame() }, [initGame])

  async function handleShuffleBoth() {
    if (shufflingSlot || shufflingBoth) return
    setShufflingBoth(true)
    setGameMode('custom')
    const config = await findValidPair()
    if (config) setGameConfig(config)
    setShufflingBoth(false)
  }

  async function handleShuffleSlot(slot: 'start' | 'end') {
    if (!gameConfig || shufflingSlot || shufflingBoth) return
    setShufflingSlot(slot)
    setGameMode('custom')

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

  async function handleSelectActor(slot: 'start' | 'end', result: SearchResult) {
    if (!gameConfig || shufflingSlot || shufflingBoth) return
    setSlotError(null)
    setSearchingSlot(null)
    setShufflingSlot(slot)
    setGameMode('custom')

    const otherId = slot === 'start' ? gameConfig.targetActor.id : gameConfig.startActor.id
    const newId = result.id

    try {
      const pathRes = await fetch('/api/six-degrees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: newId, toId: otherId }),
      })
      const pathData = await pathRes.json()
      const path: PathNode[] = pathData.path ?? []
      const optimalLength = Math.floor((path.length - 1) / 2)

      if (!path.length || optimalLength < 2 || optimalLength > 4) {
        setSlotError({ slot, msg: `No valid 2–4 hop path found. Try a different actor.` })
        setGameMode(prev => prev)  // restore previous mode
      } else {
        const actor: Actor = {
          id: result.id, name: result.name,
          profile_path: result.profile_path ?? null,
          biography: '', birthday: null,
          known_for_department: result.known_for_department ?? '',
          popularity: result.popularity ?? 0,
        }
        setGameConfig(prev => prev ? {
          startActor:    slot === 'start' ? actor : prev.startActor,
          targetActor:   slot === 'end'   ? actor : prev.targetActor,
          optimalLength,
        } : prev)
      }
    } catch {
      setSlotError({ slot, msg: 'Something went wrong. Try again.' })
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

  const dailyDateLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

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
    const anyShuffling = !!shufflingSlot || shufflingBoth
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link href="/trivia" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Trivia
          </Link>
        </div>

        <div className="text-center mb-10">
          {gameMode === 'daily' ? (
            <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              🎬 Daily Challenge · {dailyDateLabel}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 mb-4">
              <div className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                Custom Game
              </div>
              <button
                onClick={initGame}
                className="text-zinc-500 hover:text-amber-400 text-xs transition-colors"
              >
                Return to daily challenge
              </button>
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Connect the dots</h2>
          <p className="text-zinc-500 text-sm">Build a web of movies and actors linking these two stars. Shuffle either one if you want a different challenge.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6">
          {(['start', 'end'] as const).map(slot => {
            const actor = slot === 'start' ? gameConfig.startActor : gameConfig.targetActor
            const isShuffling = shufflingSlot === slot
            return (
              <div key={slot} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-8 flex flex-col items-center gap-3 sm:gap-4">
                <div className="text-zinc-500 text-xs uppercase tracking-wider">{slot === 'start' ? 'Start' : 'Goal'}</div>
                <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-zinc-800 ring-2 ${slot === 'start' ? 'ring-amber-400' : 'ring-amber-500/60'}`}>
                  {actor.profile_path
                    ? <Image src={`${TMDB_IMAGE_BASE}${actor.profile_path}`} alt={actor.name} width={128} height={128} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-zinc-400 text-3xl font-bold">{actor.name[0]}</div>}
                </div>
                <div className="text-white font-semibold text-center text-sm sm:text-base leading-snug">{actor.name}</div>

                <div className="flex items-center gap-2 w-full justify-center">
                  <button
                    onClick={() => handleShuffleSlot(slot)}
                    disabled={anyShuffling}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isShuffling
                      ? <span className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                      : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>}
                    Shuffle
                  </button>
                  <button
                    onClick={() => { setSearchingSlot(s => s === slot ? null : slot); setSlotError(null) }}
                    disabled={anyShuffling}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Choose
                  </button>
                </div>

                {searchingSlot === slot && (
                  <div className="w-full">
                    <ActorSearch
                      onSelect={r => handleSelectActor(slot, r)}
                      placeholder="Search for an actor…"
                      personOnly
                      className="w-full"
                    />
                    {slotError?.slot === slot && (
                      <p className="text-red-400 text-xs mt-1.5 text-center">{slotError.msg}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleShuffleBoth}
            disabled={anyShuffling}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {shufflingBoth
              ? <span className="w-4 h-4 border border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>}
            Shuffle Both
          </button>
          <button
            onClick={handlePlay}
            disabled={anyShuffling}
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
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
        isDaily={gameMode === 'daily'}
      />
    </div>
  )
}
