'use client'

import { useState } from 'react'
import { FilmCard } from '@/components/ui/FilmCard'
import type { Movie } from '@/lib/types'

interface FilmPickerProps {
  actor: { id: number; name: string }
  films: Movie[]
  onSelect: (film: Movie) => void
  isLoading?: boolean
}

export function FilmPicker({ actor, films, onSelect, isLoading = false }: FilmPickerProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [filter, setFilter] = useState('')

  const sorted = films
    .filter(m => m.release_date && m.vote_average > 0 && !m.genre_ids?.includes(99) && !m.genre_ids?.includes(10770))
    .sort((a, b) => b.vote_average - a.vote_average)

  const filtered = filter
    ? sorted.filter(m => m.title.toLowerCase().includes(filter.toLowerCase()))
    : sorted

  function handleSelect(film: Movie) {
    setSelected(film.id)
    setTimeout(() => onSelect(film), 200)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm">Loading films...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-zinc-400 text-sm">Step 1 — Pick a film starring</div>
          <div className="text-white font-bold text-lg">{actor.name}</div>
        </div>
        <div className="text-zinc-500 text-sm">{filtered.length} films</div>
      </div>

      <input
        type="text"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter films..."
        className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
        {filtered.map(film => (
          <FilmCard
            key={film.id}
            movie={film}
            onClick={() => handleSelect(film)}
            selected={selected === film.id}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-zinc-500 py-8">No films match your filter</div>
      )}
    </div>
  )
}
