'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import type { Credit } from '@/lib/types'

interface ActorPickerProps {
  film: { id: number; title: string; poster_path?: string | null }
  cast: Credit[]
  onSelect: (actor: Credit) => void
  isLoading?: boolean
  targetId?: number
}

export function ActorPicker({ film, cast, onSelect, isLoading = false, targetId }: ActorPickerProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [filter, setFilter] = useState('')

  const filtered = filter
    ? cast.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
    : cast

  function handleSelect(actor: Credit) {
    setSelected(actor.id)
    setTimeout(() => onSelect(actor), 200)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm">Loading cast...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-zinc-400 text-sm">Step 2 — Pick a co-star from</div>
          <div className="text-white font-bold text-lg">{film.title}</div>
        </div>
        <div className="text-zinc-500 text-sm">{filtered.length} actors</div>
      </div>

      <input
        type="text"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter cast..."
        className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map(actor => (
          <button
            key={actor.id}
            onClick={() => handleSelect(actor)}
            className={`group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 text-left ${
              selected === actor.id
                ? 'bg-amber-400/10 border-amber-400 scale-[1.02]'
                : actor.id === targetId
                ? 'bg-emerald-900/20 border-emerald-500/30 hover:border-emerald-500'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'
            }`}
          >
            <div className={`w-16 h-16 rounded-full overflow-hidden bg-zinc-800 ring-2 flex-shrink-0 ${
              actor.id === targetId ? 'ring-emerald-500' : 'ring-zinc-700 group-hover:ring-zinc-500'
            }`}>
              {actor.profile_path ? (
                <Image
                  src={`${TMDB_IMAGE_BASE}${actor.profile_path}`}
                  alt={actor.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="text-center w-full">
              <div className={`text-xs font-semibold leading-tight ${
                actor.id === targetId ? 'text-emerald-400' : 'text-white'
              }`}>
                {actor.name}
              </div>
              {actor.character && (
                <div className="text-zinc-500 text-[10px] mt-0.5 italic line-clamp-1">
                  {actor.character}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-zinc-500 py-8">No cast members match your filter</div>
      )}
    </div>
  )
}
