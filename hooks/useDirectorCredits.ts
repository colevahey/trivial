'use client'

import useSWR from 'swr'
import type { Movie } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useDirectorCredits(directorId: number | null) {
  const { data, error, isLoading } = useSWR<{ films: Movie[] }>(
    directorId ? `/api/director/${directorId}/credits` : null,
    fetcher
  )

  return {
    films: data?.films ?? [],
    isLoading,
    error,
  }
}
