'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import * as d3 from 'd3'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import { ActorSearch } from '@/components/ui/ActorSearch'
import type { Actor, SearchResult } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────

interface CastMember {
  id: number
  name: string
  profile_path: string | null
}

interface WebNode {
  nodeId: string
  numId: number
  type: 'actor' | 'movie'
  name: string
  image: string | null
  isEndpoint: boolean
  cast?: CastMember[]   // stored on movie nodes
}

interface WebEdge {
  actorNodeId: string
  movieNodeId: string
}

interface SimNode extends d3.SimulationNodeDatum {
  nodeId: string
  type: 'actor' | 'movie'
  name: string
  image: string | null
  isEndpoint: boolean
  r: number
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {}

// ── Helpers ────────────────────────────────────────────────────────────────

function isConnected(nodes: WebNode[], edges: WebEdge[], aId: string, bId: string): boolean {
  const adj = new Map<string, string[]>()
  for (const n of nodes) adj.set(n.nodeId, [])
  for (const e of edges) {
    adj.get(e.actorNodeId)?.push(e.movieNodeId)
    adj.get(e.movieNodeId)?.push(e.actorNodeId)
  }
  const visited = new Set([aId])
  const queue = [aId]
  while (queue.length) {
    const cur = queue.shift()!
    if (cur === bId) return true
    for (const nb of adj.get(cur) ?? []) {
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb) }
    }
  }
  return false
}

// ── Component ──────────────────────────────────────────────────────────────

interface TriviaWebGameProps {
  startActor: Actor
  endActor: Actor
  optimalLength: number
  onRestart: () => void
}

export function TriviaWebGame({ startActor, endActor, optimalLength, onRestart }: TriviaWebGameProps) {
  const startNodeId = `actor-${startActor.id}`
  const endNodeId   = `actor-${endActor.id}`

  const [nodes, setNodes] = useState<WebNode[]>([
    {
      nodeId: startNodeId, numId: startActor.id, type: 'actor',
      name: startActor.name,
      image: startActor.profile_path ? `${TMDB_IMAGE_BASE}${startActor.profile_path}` : null,
      isEndpoint: true,
    },
    {
      nodeId: endNodeId, numId: endActor.id, type: 'actor',
      name: endActor.name,
      image: endActor.profile_path ? `${TMDB_IMAGE_BASE}${endActor.profile_path}` : null,
      isEndpoint: true,
    },
  ])
  const [edges, setEdges]   = useState<WebEdge[]>([])
  const [status, setStatus] = useState<'playing' | 'won'>('playing')
  const [addedCount, setAddedCount] = useState(0)
  const [toast, setToast]   = useState<{ message: string; ok: boolean } | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const svgRef       = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const simRef       = useRef<d3.Simulation<SimNode, SimLink> | null>(null)

  function flash(message: string, ok: boolean) {
    setToast({ message, ok })
    setTimeout(() => setToast(null), 2500)
  }

  async function handleSelect(result: SearchResult) {
    if (isAdding || status !== 'playing') return

    const isMovie  = result.mediaType === 'movie'
    const nodeId   = isMovie ? `movie-${result.id}` : `actor-${result.id}`

    if (nodes.some(n => n.nodeId === nodeId)) {
      flash('Already in your web', false)
      return
    }

    if (isMovie) {
      setIsAdding(true)
      try {
        const res  = await fetch(`/api/movie/${result.id}/credits`)
        const data = await res.json()
        const cast: CastMember[] = (data.cast ?? []).slice(0, 60)

        const actorNodes    = nodes.filter(n => n.type === 'actor')
        const matchingActors = actorNodes.filter(a => cast.some(c => c.id === a.numId))

        if (matchingActors.length === 0) {
          flash('Not connected to your web', false)
          return
        }

        const newNode: WebNode = {
          nodeId, numId: result.id, type: 'movie',
          name: result.name, image: result.profile_path,
          isEndpoint: false, cast,
        }
        const newEdges = matchingActors.map(a => ({ actorNodeId: a.nodeId, movieNodeId: nodeId }))

        const nextNodes = [...nodes, newNode]
        const nextEdges = [...edges, ...newEdges]
        setNodes(nextNodes)
        setEdges(nextEdges)
        setAddedCount(c => c + 1)
        flash(`Added "${result.name}"`, true)

        if (isConnected(nextNodes, nextEdges, startNodeId, endNodeId)) setStatus('won')
      } finally {
        setIsAdding(false)
      }
    } else {
      const movieNodes     = nodes.filter(n => n.type === 'movie')
      const matchingMovies = movieNodes.filter(m => m.cast?.some(c => c.id === result.id))

      if (matchingMovies.length === 0) {
        flash('Not connected to your web', false)
        return
      }

      const newNode: WebNode = {
        nodeId, numId: result.id, type: 'actor',
        name: result.name, image: result.profile_path,
        isEndpoint: false,
      }
      const newEdges = matchingMovies.map(m => ({ actorNodeId: nodeId, movieNodeId: m.nodeId }))

      const nextNodes = [...nodes, newNode]
      const nextEdges = [...edges, ...newEdges]
      setNodes(nextNodes)
      setEdges(nextEdges)
      setAddedCount(c => c + 1)
      flash(`Added "${result.name}"`, true)

      if (isConnected(nextNodes, nextEdges, startNodeId, endNodeId)) setStatus('won')
    }
  }

  // ── D3 graph ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const container = containerRef.current
    const width  = container.clientWidth  || 600
    const height = container.clientHeight || 380

    simRef.current?.stop()

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'ep-glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur')
    const merge = filter.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    const simNodes: SimNode[] = nodes.map(n => {
      const saved  = positionsRef.current.get(n.nodeId)
      const isStart = n.nodeId === startNodeId
      const isEnd   = n.nodeId === endNodeId
      const r = n.isEndpoint ? 30 : n.type === 'actor' ? 20 : 15

      const defaultX = isStart ? width * 0.15 : isEnd ? width * 0.85
        : width / 2 + (Math.random() - 0.5) * 80
      const defaultY = height / 2 + (Math.random() - 0.5) * 40

      return {
        nodeId: n.nodeId, type: n.type, name: n.name,
        image: n.image, isEndpoint: n.isEndpoint, r,
        x: saved?.x ?? defaultX,
        y: saved?.y ?? defaultY,
        fx: isStart ? width * 0.15 : isEnd ? width * 0.85 : undefined,
        fy: (isStart || isEnd) ? height / 2 : undefined,
      }
    })

    const simLinks: SimLink[] = edges.map(e => ({
      source: e.actorNodeId,
      target: e.movieNodeId,
    }))

    simNodes.forEach(n => {
      const safeId = n.nodeId.replace(/-/g, '_')
      defs.append('clipPath').attr('id', `clip_${safeId}`)
        .append('circle').attr('r', n.r)
    })

    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks)
        .id(d => d.nodeId).distance(85).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-220))
      .force('collision', d3.forceCollide<SimNode>().radius(d => d.r + 14))
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(height / 2).strength(0.04))
      .alpha(nodes.length <= 2 ? 1 : 0.4)

    simRef.current = simulation

    const linkEls = svg.append('g')
      .selectAll('line').data(simLinks).enter()
      .append('line')
      .attr('stroke', '#3f3f46').attr('stroke-width', 1.5).attr('stroke-opacity', 0.7)

    const nodeEls = svg.append('g')
      .selectAll<SVGGElement, SimNode>('g').data(simNodes).enter()
      .append('g')

    // Bg circle
    nodeEls.append('circle')
      .attr('r', d => d.r + 2)
      .attr('fill', d => d.isEndpoint ? '#92400e' : d.type === 'movie' ? '#1c1c1f' : '#27272a')
      .attr('filter', d => d.isEndpoint ? 'url(#ep-glow)' : 'none')

    // Image or fallback
    nodeEls.each(function(d) {
      const g      = d3.select(this)
      const safeId = d.nodeId.replace(/-/g, '_')
      if (d.image) {
        g.append('image')
          .attr('href', d.image)
          .attr('x', -d.r).attr('y', -d.r)
          .attr('width', d.r * 2).attr('height', d.r * 2)
          .attr('clip-path', `url(#clip_${safeId})`)
          .attr('preserveAspectRatio', 'xMidYMid slice')
      } else {
        g.append('circle').attr('r', d.r)
          .attr('fill', d.isEndpoint ? '#78350f' : d.type === 'movie' ? '#27272a' : '#3f3f46')
        g.append('text')
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('fill', '#71717a').attr('font-size', d.r * 0.55)
          .text(d.name.charAt(0).toUpperCase())
      }
    })

    // Endpoint amber ring
    nodeEls.filter(d => d.isEndpoint)
      .append('circle').attr('r', d => d.r + 3)
      .attr('fill', 'none').attr('stroke', '#f59e0b').attr('stroke-width', 2.5)

    // Movie dashed ring
    nodeEls.filter(d => !d.isEndpoint && d.type === 'movie')
      .append('circle').attr('r', d => d.r + 2)
      .attr('fill', 'none').attr('stroke', '#52525b')
      .attr('stroke-width', 1).attr('stroke-dasharray', '3,2')

    // Labels
    nodeEls.append('text')
      .attr('text-anchor', 'middle').attr('pointer-events', 'none')
      .attr('fill', d => d.isEndpoint ? '#fbbf24' : '#a1a1aa')
      .attr('font-size', d => d.isEndpoint ? 9 : 8)
      .attr('font-weight', d => d.isEndpoint ? 'bold' : 'normal')
      .each(function(d) {
        const el    = d3.select(this)
        const words = d.name.split(' ')
        const yOff  = d.r + 12
        if (words.length > 1 && d.name.length > 10) {
          const mid = Math.ceil(words.length / 2)
          el.append('tspan').attr('x', 0).attr('dy', yOff).text(words.slice(0, mid).join(' '))
          el.append('tspan').attr('x', 0).attr('dy', 10).text(words.slice(mid).join(' '))
        } else {
          el.append('tspan').attr('x', 0).attr('dy', yOff).text(d.name)
        }
      })

    simulation.on('tick', () => {
      simNodes.forEach(n => {
        if (n.x != null && n.y != null) positionsRef.current.set(n.nodeId, { x: n.x, y: n.y })
      })
      linkEls
        .attr('x1', d => (d.source as SimNode).x ?? 0)
        .attr('y1', d => (d.source as SimNode).y ?? 0)
        .attr('x2', d => (d.target as SimNode).x ?? 0)
        .attr('y2', d => (d.target as SimNode).y ?? 0)
      nodeEls.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth
      svg.attr('width', w)
      simulation.force('x', d3.forceX(w / 2).strength(0.04))
      simulation.alpha(0.3).restart()
    })
    ro.observe(container)

    return () => { simulation.stop(); ro.disconnect() }
  }, [nodes, edges, startNodeId, endNodeId])

  // ── Win screen ────────────────────────────────────────────────────────────

  const optimalNodes = 2 * optimalLength - 1
  const score = Math.max(0, 1000 - Math.max(0, addedCount - optimalNodes) * 100)

  if (status === 'won') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="text-6xl mb-4">🎬</div>
        <h2 className="text-3xl font-bold text-amber-400 mb-2">Connected!</h2>
        <p className="text-zinc-400 mb-2">
          You bridged <span className="text-white font-semibold">{startActor.name}</span> and{' '}
          <span className="text-white font-semibold">{endActor.name}</span>
        </p>
        <p className="text-zinc-500 text-sm mb-8">
          {addedCount} node{addedCount !== 1 ? 's' : ''} added · optimal: {optimalNodes}
        </p>
        <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-8 mb-8">
          <div className="text-zinc-400 text-sm uppercase tracking-widest mb-2">Score</div>
          <div className="text-7xl font-black text-amber-400 mb-4">{score}</div>
          {addedCount <= optimalNodes && (
            <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 px-4 py-2 rounded-full text-sm font-semibold">
              Perfect path!
            </div>
          )}
        </div>
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-xl transition-colors"
        >
          Play Again
        </button>
      </div>
    )
  }

  // ── Playing ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Endpoint header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-amber-400 flex-shrink-0">
              {startActor.profile_path
                ? <Image src={`${TMDB_IMAGE_BASE}${startActor.profile_path}`} alt={startActor.name} width={48} height={48} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">{startActor.name[0]}</div>}
            </div>
            <div className="min-w-0">
              <div className="text-zinc-500 text-xs">Start</div>
              <div className="text-white font-semibold text-sm truncate">{startActor.name}</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className="text-zinc-600 text-xs uppercase tracking-widest">connect</div>
            <div className="text-zinc-600 text-lg">⟶</div>
            <div className="text-amber-400 text-xs font-medium">{addedCount} added</div>
          </div>

          <div className="flex items-center gap-3 min-w-0">
            <div className="text-right min-w-0">
              <div className="text-zinc-500 text-xs">Goal</div>
              <div className="text-amber-400 font-semibold text-sm truncate">{endActor.name}</div>
            </div>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-amber-500/60 flex-shrink-0">
              {endActor.profile_path
                ? <Image src={`${TMDB_IMAGE_BASE}${endActor.profile_path}`} alt={endActor.name} width={48} height={48} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">{endActor.name[0]}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Web graph + search */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl">
        <div ref={containerRef} className="w-full h-[380px] relative rounded-t-2xl overflow-hidden">
          <svg ref={svgRef} className="w-full h-full" />

          {toast && (
            <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium pointer-events-none transition-all ${
              toast.ok
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-600'
                : 'bg-red-950 text-red-300 border border-red-800'
            }`}>
              {toast.message}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 space-y-2">
          <ActorSearch
            onSelect={handleSelect}
            placeholder="Add a movie or actor…"
            className="w-full"
          />
          {isAdding && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
              <div className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin" />
              Checking connection…
            </div>
          )}
          {!isAdding && nodes.length === 2 && (
            <p className="text-zinc-600 text-xs">
              Start with a film starring <span className="text-zinc-400">{startActor.name}</span> or <span className="text-zinc-400">{endActor.name}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
