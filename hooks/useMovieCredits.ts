'use client'

import useSWR from 'swr'
import type { Credit } from '@/lib/types'

interface CrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useMovieCredits(movieId: number | null) {
  const { data, error, isLoading } = useSWR<{ cast: Credit[]; crew: CrewMember[] }>(
    movieId ? `/api/movie/${movieId}/credits` : null,
    fetcher
  )

  return {
    cast: data?.cast ?? [],
    crew: data?.crew ?? [],
    isLoading,
    error,
  }
}
