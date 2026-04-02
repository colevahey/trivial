'use client'

import useSWR from 'swr'
import type { Movie } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useMovieDetail(movieId: number | null) {
  const { data, error, isLoading } = useSWR<Movie>(
    movieId ? `/api/movie/${movieId}` : null,
    fetcher
  )

  return {
    movie: data ?? null,
    isLoading,
    error,
  }
}
