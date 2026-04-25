'use client'

import { useRouter } from 'next/navigation'
import { ActorSearch } from './ActorSearch'
import type { SearchResult } from '@/lib/types'

export function NavSearch() {
  const router = useRouter()

  function handleSelect(result: SearchResult) {
    if (result.mediaType === 'movie') {
      router.push(`/movie/${result.id}`)
    } else {
      const route = result.known_for_department === 'Directing' ? 'director' : 'actor'
      router.push(`/${route}/${result.id}`)
    }
  }

  return (
    <ActorSearch
      onSelect={handleSelect}
      placeholder="Search actors, directors, films..."
      compact
    />
  )
}
