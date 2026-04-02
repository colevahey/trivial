'use client'

import Image from 'next/image'
import Link from 'next/link'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import type { Actor, SearchResult } from '@/lib/types'

type ActorCardProps = {
  actor: Actor | SearchResult
  href?: string
  onClick?: () => void
  selected?: boolean
  compact?: boolean
}

export function ActorCard({ actor, href, onClick, selected, compact = false }: ActorCardProps) {
  const content = (
    <div
      className={`group relative bg-zinc-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
        selected ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-900/30' : 'hover:ring-1 hover:ring-zinc-600'
      } ${compact ? 'flex items-center gap-3 p-3' : 'flex flex-col h-full'}`}
    >
      {compact ? (
        <>
          <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-zinc-800">
            {actor.profile_path ? (
              <Image
                src={`${TMDB_IMAGE_BASE}${actor.profile_path}`}
                alt={actor.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <div className="text-white font-medium text-sm">{actor.name}</div>
            {'known_for_department' in actor && (
              <div className="text-zinc-400 text-xs">{actor.known_for_department}</div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="aspect-[2/3] relative bg-zinc-800 overflow-hidden">
            {actor.profile_path ? (
              <Image
                src={`${TMDB_IMAGE_BASE}${actor.profile_path}`}
                alt={actor.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="p-3">
            <div className="text-white font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{actor.name}</div>
            {'known_for_department' in actor && (
              <div className="text-zinc-400 text-xs mt-1 truncate h-4">{actor.known_for_department}</div>
            )}
          </div>
          {selected && (
            <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-1">
              <svg className="w-3 h-3 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  if (onClick) {
    return <div onClick={onClick}>{content}</div>
  }
  return content
}
