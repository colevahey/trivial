'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Movie } from '@/lib/types'

const STORAGE_KEY = 'trivial_watchlist'

function readStorage(): Movie[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Movie[]>([])

  useEffect(() => {
    setWatchlist(readStorage())

    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setWatchlist(readStorage())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = useCallback((movie: Movie) => {
    setWatchlist(prev => {
      const next = prev.some(m => m.id === movie.id)
        ? prev.filter(m => m.id !== movie.id)
        : [...prev, movie]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const remove = useCallback((movieId: number) => {
    setWatchlist(prev => {
      const next = prev.filter(m => m.id !== movieId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setWatchlist([])
  }, [])

  const isInWatchlist = useCallback((movieId: number) => {
    return watchlist.some(m => m.id === movieId)
  }, [watchlist])

  return { watchlist, toggle, remove, clear, isInWatchlist }
}
