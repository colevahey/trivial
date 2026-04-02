'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import { FilmPicker } from './FilmPicker'
import { ActorPicker } from './ActorPicker'
import type { Actor, Movie, Credit, PathNode, GameState } from '@/lib/types'

type Step = 'selecting-film' | 'selecting-actor'

interface TriviaGameProps {
  startActor: Actor
  targetActor: Actor
  optimalLength: number
  onRestart: () => void
}

export function TriviaGame({ startActor, targetActor, optimalLength, onRestart }: TriviaGameProps) {
  const [step, setStep] = useState<Step>('selecting-film')
  const [currentActor, setCurrentActor] = useState<Actor>(startActor)
  const [selectedFilm, setSelectedFilm] = useState<Movie | null>(null)
  const [path, setPath] = useState<PathNode[]>([
    {
      type: 'actor',
      id: startActor.id,
      name: startActor.name,
      image: startActor.profile_path ? `${TMDB_IMAGE_BASE}${startActor.profile_path}` : null,
    },
  ])
  const [status, setStatus] = useState<GameState['status']>('playing')
  const [score, setScore] = useState(0)
  const [actorFilms, setActorFilms] = useState<Movie[]>([])
  const [filmCast, setFilmCast] = useState<Credit[]>([])
  const [isLoadingFilms, setIsLoadingFilms] = useState(false)
  const [isLoadingCast, setIsLoadingCast] = useState(false)
  const [steps, setSteps] = useState(0)

  const loadFilms = useCallback(async (actor: Actor) => {
    setIsLoadingFilms(true)
    try {
      const res = await fetch(`/api/actor/${actor.id}/credits`)
      const data = await res.json()
      setActorFilms(data.cast ?? [])
    } catch {
      setActorFilms([])
    } finally {
      setIsLoadingFilms(false)
    }
  }, [])

  useEffect(() => {
    loadFilms(startActor)
  }, [startActor, loadFilms])

  async function handleFilmSelect(film: Movie) {
    setSelectedFilm(film)
    setStep('selecting-actor')
    setIsLoadingCast(true)
    try {
      const res = await fetch(`/api/movie/${film.id}/credits`)
      const data = await res.json()
      setFilmCast(data.cast ?? [])
    } catch {
      setFilmCast([])
    } finally {
      setIsLoadingCast(false)
    }
  }

  async function handleActorSelect(actor: Credit) {
    const newSteps = steps + 1
    setSteps(newSteps)

    const filmNode: PathNode = {
      type: 'movie',
      id: selectedFilm!.id,
      name: selectedFilm!.title,
      image: selectedFilm?.poster_path ? `${TMDB_IMAGE_BASE}${selectedFilm.poster_path}` : null,
    }

    const actorNode: PathNode = {
      type: 'actor',
      id: actor.id,
      name: actor.name,
      image: actor.profile_path ? `${TMDB_IMAGE_BASE}${actor.profile_path}` : null,
    }

    const newPath = [...path, filmNode, actorNode]
    setPath(newPath)

    if (actor.id === targetActor.id) {
      const finalScore = Math.max(0, 1000 - (newSteps - optimalLength) * 100)
      setScore(finalScore)
      setStatus('won')
      return
    }

    // Fetch actor details for next step
    try {
      const res = await fetch(`/api/actor/${actor.id}`)
      const actorDetail: Actor = await res.json()
      setCurrentActor(actorDetail)
      setSelectedFilm(null)
      setFilmCast([])
      setStep('selecting-film')
      await loadFilms(actorDetail)
    } catch {
      // fallback with partial data
      const partialActor: Actor = {
        id: actor.id,
        name: actor.name,
        profile_path: actor.profile_path,
        biography: '',
        birthday: null,
        known_for_department: 'Acting',
        popularity: 0,
      }
      setCurrentActor(partialActor)
      setSelectedFilm(null)
      setFilmCast([])
      setStep('selecting-film')
      await loadFilms(partialActor)
    }
  }

  function handleGiveUp() {
    setStatus('gave-up')
    setScore(0)
  }

  function handleBack() {
    if (step === 'selecting-actor') {
      setStep('selecting-film')
      setSelectedFilm(null)
      setFilmCast([])
    }
  }

  const actorSteps = path.filter(n => n.type === 'actor').length - 1

  if (status === 'won') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="text-6xl mb-4">🎬</div>
        <h2 className="text-3xl font-bold text-amber-400 mb-2">You made it!</h2>
        <p className="text-zinc-400 mb-8">
          Connected {startActor.name} to {targetActor.name} in {actorSteps} {actorSteps === 1 ? 'step' : 'steps'}
          {optimalLength > 0 && ` (optimal: ${optimalLength})`}
        </p>

        <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-8 mb-8">
          <div className="text-zinc-400 text-sm uppercase tracking-widest mb-2">Your Score</div>
          <div className="text-7xl font-black text-amber-400 mb-4">{score}</div>
          {actorSteps === optimalLength && (
            <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 px-4 py-2 rounded-full text-sm font-semibold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Perfect path!
            </div>
          )}
        </div>

        {/* Path summary */}
        <div className="bg-zinc-900 rounded-xl p-4 mb-8 text-left">
          <div className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Your path</div>
          <div className="space-y-2">
            {path.map((node, i) => (
              <div key={i} className="flex items-center gap-3">
                {node.type === 'actor' ? (
                  <>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                      {node.image ? (
                        <Image src={node.image} alt={node.name} width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">{node.name[0]}</div>
                      )}
                    </div>
                    <span className="text-white text-sm font-medium">{node.name}</span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded overflow-hidden bg-zinc-800 flex-shrink-0 ml-4">
                      {node.image ? (
                        <Image src={node.image} alt={node.name} width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" /></svg>
                        </div>
                      )}
                    </div>
                    <span className="text-zinc-400 text-sm italic">{node.name}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-xl transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    )
  }

  if (status === 'gave-up') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="text-5xl mb-4">🎭</div>
        <h2 className="text-3xl font-bold text-zinc-400 mb-2">Better luck next time</h2>
        <p className="text-zinc-500 mb-8">
          You were trying to connect {startActor.name} to {targetActor.name}
        </p>
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header: start → target + progress */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-amber-400">
              {startActor.profile_path ? (
                <Image src={`${TMDB_IMAGE_BASE}${startActor.profile_path}`} alt={startActor.name} width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-lg font-bold">{startActor.name[0]}</div>
              )}
            </div>
            <div>
              <div className="text-zinc-400 text-xs">From</div>
              <div className="text-white font-semibold text-sm">{startActor.name}</div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-amber-400 font-bold text-xl">{actorSteps}</div>
            <div className="text-zinc-500 text-xs">steps</div>
            <div className="text-zinc-600 text-xs">opt: {optimalLength}</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-zinc-400 text-xs">Target</div>
              <div className="text-amber-400 font-semibold text-sm">{targetActor.name}</div>
            </div>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-amber-500/50">
              {targetActor.profile_path ? (
                <Image src={`${TMDB_IMAGE_BASE}${targetActor.profile_path}`} alt={targetActor.name} width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-lg font-bold">{targetActor.name[0]}</div>
              )}
            </div>
          </div>
        </div>

        {/* Breadcrumb path */}
        {path.length > 1 && (
          <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-1 overflow-x-auto pb-1">
            {path.map((node, i) => (
              <div key={i} className="flex items-center gap-1 flex-shrink-0">
                <span className={`text-xs ${node.type === 'actor' ? 'text-white' : 'text-zinc-500 italic'}`}>
                  {node.name.split(' ')[0]}
                </span>
                {i < path.length - 1 && (
                  <svg className="w-3 h-3 text-zinc-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
            <div className="flex items-center gap-1 flex-shrink-0">
              <svg className="w-3 h-3 text-zinc-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-amber-400/60 text-xs font-semibold">{targetActor.name.split(' ')[0]}</span>
            </div>
          </div>
        )}
      </div>

      {/* Current step */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
        {step === 'selecting-film' ? (
          <FilmPicker
            actor={currentActor}
            films={actorFilms}
            onSelect={handleFilmSelect}
            isLoading={isLoadingFilms}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to films
              </button>
            </div>
            <ActorPicker
              film={selectedFilm!}
              cast={filmCast}
              onSelect={handleActorSelect}
              isLoading={isLoadingCast}
              targetId={targetActor.id}
            />
          </>
        )}
      </div>

      {/* Give up button */}
      <div className="flex justify-center">
        <button
          onClick={handleGiveUp}
          className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
        >
          Give up
        </button>
      </div>
    </div>
  )
}
