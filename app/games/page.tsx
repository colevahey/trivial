'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SEED_ACTOR_IDS, getDailySeed, mulberry32, getDailyDateLabel } from '@/lib/daily-seed'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import type { Actor } from '@/lib/types'

export default function GamesPage() {
  const [dailyQuizActor, setDailyQuizActor] = useState<Actor | null>(null)
  const [dailyPath, setDailyPath] = useState<{ startActor: Actor; targetActor: Actor } | null>(null)
  const dateLabel = getDailyDateLabel()

  useEffect(() => {
    const rand = mulberry32(getDailySeed())
    const id = SEED_ACTOR_IDS[Math.floor(rand() * SEED_ACTOR_IDS.length)]
    fetch(`/api/actor/${id}`).then(r => r.json()).then(setDailyQuizActor).catch(() => {})

    fetch('/api/daily-path').then(r => r.json()).then(d => {
      if (d.startActor?.id) setDailyPath(d)
    }).catch(() => {})
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white mb-2">Games</h1>
        <p className="text-zinc-500 text-sm">Two ways to test your movie knowledge. New challenges every day.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* ── Movie Path Game ─────────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="bg-amber-500/10 border-b border-amber-500/25 px-5 py-3 flex items-center gap-2">
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Daily Challenge</span>
            <span className="text-zinc-600 text-xs">·</span>
            <span className="text-zinc-500 text-xs">{dateLabel}</span>
            {dailyPath && (
              <span className="ml-auto text-amber-300/80 text-xs font-medium truncate max-w-[160px]">
                {dailyPath.startActor.name} → {dailyPath.targetActor.name}
              </span>
            )}
          </div>

          <div className="p-6 flex flex-col flex-1">
            <div className="w-11 h-11 bg-zinc-800 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>

            <h2 className="text-xl font-black text-white mb-2">Movie Path Game</h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-5 flex-1">
              Connect two actors through shared films in the fewest steps. Pick a movie, then a co-star, and keep going until you reach the target.
            </p>

            <ul className="space-y-1.5 mb-6">
              {[
                'Two actors, one connection to find',
                'Pick films → pick co-stars → repeat',
                'Score based on steps vs. optimal path',
              ].map(rule => (
                <li key={rule} className="flex items-start gap-2 text-xs text-zinc-500">
                  <span className="w-1 h-1 rounded-full bg-amber-400/50 mt-1.5 flex-shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>

            <Link
              href="/trivia/game"
              className="flex items-center justify-center px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold text-sm rounded-xl transition-colors mb-2"
            >
              Play Today's Game
            </Link>
            <Link href="/trivia" className="flex items-center justify-center px-4 py-1.5 text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
              How to play →
            </Link>
          </div>
        </div>

        {/* ── Career Quiz ─────────────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="bg-amber-500/10 border-b border-amber-500/25 px-5 py-3 flex items-center gap-2">
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Daily Challenge</span>
            <span className="text-zinc-600 text-xs">·</span>
            <span className="text-zinc-500 text-xs">{dateLabel}</span>
            {dailyQuizActor && (
              <div className="ml-auto flex items-center gap-1.5">
                {dailyQuizActor.profile_path && (
                  <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-amber-400/30 flex-shrink-0">
                    <Image
                      src={`${TMDB_IMAGE_BASE}${dailyQuizActor.profile_path}`}
                      alt={dailyQuizActor.name}
                      width={24} height={24}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span className="text-amber-300/80 text-xs font-medium truncate max-w-[120px]">{dailyQuizActor.name}</span>
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col flex-1">
            <div className="w-11 h-11 bg-zinc-800 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h2 className="text-xl font-black text-white mb-2">Career Quiz</h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-5 flex-1">
              How well do you know an actor's career? Answer 5 questions about their films, ratings, and box office — scored by accuracy.
            </p>

            <ul className="space-y-1.5 mb-6">
              {[
                'New featured actor every day',
                'Guess top films, debut year, ratings',
                'Score based on how close you get',
              ].map(rule => (
                <li key={rule} className="flex items-start gap-2 text-xs text-zinc-500">
                  <span className="w-1 h-1 rounded-full bg-amber-400/50 mt-1.5 flex-shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>

            {dailyQuizActor ? (
              <Link
                href={`/trivia/actor/${dailyQuizActor.id}?daily=true`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold text-sm rounded-xl transition-colors mb-2"
              >
                <span className="truncate">Quiz: {dailyQuizActor.name}</span>
              </Link>
            ) : (
              <div className="flex items-center justify-center px-4 py-2.5 bg-amber-500/20 text-amber-500/40 font-bold text-sm rounded-xl mb-2">
                Loading…
              </div>
            )}
            <Link href="/trivia/actor" className="flex items-center justify-center px-4 py-1.5 text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
              Choose a different actor →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
