'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { PathNode } from '@/lib/types'

interface PathVisualizerProps {
  path: PathNode[]
}

export function PathVisualizer({ path }: PathVisualizerProps) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    let i = 0
    const interval = setInterval(() => {
      i++
      setVisibleCount(i)
      if (i >= path.length) clearInterval(interval)
    }, 300)
    return () => clearInterval(interval)
  }, [path])

  const degrees = Math.floor((path.length - 1) / 2)

  return (
    <div className="w-full min-h-[200px]">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 text-amber-400 px-4 py-1.5 rounded-full text-sm font-semibold">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {degrees} {degrees === 1 ? 'degree' : 'degrees'} of separation
        </span>
      </div>

      <div className="overflow-x-auto py-4 -mx-2 px-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex items-center gap-0 min-w-max mx-auto justify-center py-3">
          {path.map((node, index) => (
            <div key={`${node.type}-${node.id}-${index}`} className="flex items-center">
              {/* Node */}
              <div
                className={`flex flex-col items-center transition-all duration-500 py-2 ${
                  index < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {node.type === 'actor' ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ${
                      index === 0 || index === path.length - 1
                        ? 'ring-amber-400 shadow-lg shadow-amber-900/50'
                        : 'ring-zinc-600'
                    } bg-zinc-800`}>
                      {node.image ? (
                        <Image
                          src={node.image}
                          alt={node.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <svg className="w-7 h-7 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="text-center w-[64px] sm:w-[96px]">
                      <div className={`text-[10px] sm:text-xs font-semibold leading-tight ${
                        index === 0 || index === path.length - 1 ? 'text-amber-400' : 'text-white'
                      }`}>
                        {node.name}
                      </div>
                      {(index === 0 || index === path.length - 1) && (
                        <div className="text-zinc-500 text-[9px] sm:text-[10px] mt-0.5">
                          {index === 0 ? 'Start' : 'End'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-9 h-14 sm:w-14 sm:h-20 rounded-lg overflow-hidden ring-1 ring-zinc-700 bg-zinc-800">
                      {node.image ? (
                        <Image
                          src={node.image}
                          alt={node.name}
                          width={56}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="text-center w-[48px] sm:w-[72px]">
                      <div className="text-[9px] sm:text-[10px] text-zinc-400 leading-tight line-clamp-2">{node.name}</div>
                      {node.character && (
                        <div className="text-zinc-600 text-[8px] sm:text-[9px] italic mt-0.5 line-clamp-1">as {node.character}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Connector arrow */}
              {index < path.length - 1 && (
                <div
                  className={`flex items-center px-0.5 sm:px-1 transition-all duration-500 ${
                    index + 1 < visibleCount ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ transitionDelay: `${(index + 0.5) * 100}ms` }}
                >
                  <div className="flex items-center gap-0.5 text-zinc-600">
                    <div className="w-2 sm:w-4 h-px bg-zinc-700" />
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
