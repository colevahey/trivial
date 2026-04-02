'use client'

import Image from 'next/image'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import { ActorSearch } from '@/components/ui/ActorSearch'
import type { SearchResult } from '@/lib/types'

interface ActorSelectorProps {
  label: string
  selected: SearchResult | null
  onSelect: (actor: SearchResult) => void
  onClear: () => void
}

export function ActorSelector({ label, selected, onSelect, onClear }: ActorSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{label}</div>

      {selected ? (
        <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-4 flex items-center gap-4 relative">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 ring-2 ring-amber-500/50">
            {selected.profile_path ? (
              <Image
                src={`${TMDB_IMAGE_BASE}${selected.profile_path}`}
                alt={selected.name}
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
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-lg truncate">{selected.name}</div>
            <div className="text-amber-400 text-sm">{selected.known_for_department}</div>
          </div>
          <button
            onClick={onClear}
            className="absolute top-3 right-3 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <ActorSearch
          onSelect={onSelect}
          placeholder={`Search ${label.toLowerCase()}...`}
        />
      )}
    </div>
  )
}
