'use client'

import useSWR from 'swr'
import type { Movie } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useActorCredits(actorId: number | null) {
  const { data, error, isLoading } = useSWR<{ cast: Movie[] }>(
    actorId ? `/api/actor/${actorId}/credits` : null,
    fetcher
  )

  return {
    credits: data?.cast ?? [],
    isLoading,
    error,
  }
}
