'use client'

import { useEffect, useState, use } from 'react'
import { useParams } from 'next/navigation'
import { ActorTriviaGame, type ActorTriviaData } from '@/components/trivia/ActorTriviaGame'

export default function ActorTriviaGamePage({
  searchParams,
}: {
  searchParams: Promise<{ daily?: string }>
}) {
  const params = useParams()
  const id = params.id as string
  const resolvedSearchParams = use(searchParams)
  const isDaily = resolvedSearchParams.daily === 'true'
  const [data, setData] = useState<ActorTriviaData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/actor/${id}/trivia`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(true)
        else setData(d)
      })
      .catch(() => setError(true))
  }, [id])

  if (error) {
    return (
      <div className="w-full px-4 py-16 text-center">
        <div className="text-zinc-400 text-lg mb-4">Failed to load actor data.</div>
        <a href="/trivia/actor" className="text-amber-400 hover:text-amber-300 text-sm">
          ← Back to actor search
        </a>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full px-4 sm:px-6 py-8 space-y-4">
        {/* Header skeleton */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-zinc-800 rounded animate-pulse w-20" />
              <div className="h-5 bg-zinc-800 rounded animate-pulse w-40" />
              <div className="h-3 bg-zinc-800 rounded animate-pulse w-28" />
            </div>
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="h-3 bg-zinc-800 rounded animate-pulse w-24" />
            <div className="h-4 bg-zinc-800 rounded animate-pulse w-3/4" />
            <div className="h-10 bg-zinc-800 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return <ActorTriviaGame data={data} isDaily={isDaily} />
}
