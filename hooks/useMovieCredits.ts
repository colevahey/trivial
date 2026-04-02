'use client'

import useSWR from 'swr'
import type { Credit } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useMovieCredits(movieId: number | null) {
  const { data, error, isLoading } = useSWR<{ cast: Credit[] }>(
    movieId ? `/api/movie/${movieId}/credits` : null,
    fetcher
  )

  return {
    cast: data?.cast ?? [],
    isLoading,
    error,
  }
}
