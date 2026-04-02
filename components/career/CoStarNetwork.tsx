'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as d3 from 'd3'
import { TMDB_IMAGE_BASE } from '@/lib/tmdb'
import type { Movie } from '@/lib/types'

interface CoStarNetworkProps {
  actorId: number
  actorName: string
  actorImage: string | null
  credits: Movie[]
}

interface CoStarData {
  id: number
  name: string
  profile_path: string | null
  sharedFilms: number
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: number
  name: string
  image: string | null
  isCenter: boolean
  sharedFilms: number
  r: number
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  weight: number
}

export function CoStarNetwork({ actorId, actorName, actorImage, credits }: CoStarNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [coStars, setCoStars] = useState<CoStarData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch co-star data
  useEffect(() => {
    async function fetchCoStars() {
      setIsLoading(true)
      const coStarMap = new Map<number, { name: string; profile_path: string | null; count: number }>()

      const topCredits = credits
        .filter(m => m.release_date && m.vote_average > 0)
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 10)

      await Promise.all(
        topCredits.map(async movie => {
          try {
            const res = await fetch(`/api/movie/${movie.id}/credits`)
            const data = await res.json()
            const cast = data.cast ?? []
            cast.slice(0, 12).forEach((c: { id: number; name: string; profile_path: string | null }) => {
              if (c.id === actorId) return
              const existing = coStarMap.get(c.id)
              if (existing) {
                existing.count++
              } else {
                coStarMap.set(c.id, { name: c.name, profile_path: c.profile_path, count: 1 })
              }
            })
          } catch {
            // ignore fetch errors
          }
        })
      )

      const sorted = Array.from(coStarMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 15)
        .map(([id, data]) => ({
          id,
          name: data.name,
          profile_path: data.profile_path,
          sharedFilms: data.count,
        }))

      setCoStars(sorted)
      setIsLoading(false)
    }

    if (credits.length > 0) {
      fetchCoStars()
    }
  }, [actorId, credits])

  // Build D3 visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || isLoading) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight || 400

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('width', width).attr('height', height)

    // Defs for clip paths and glow
    const defs = svg.append('defs')

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    const nodes: GraphNode[] = [
      {
        id: actorId,
        name: actorName,
        image: actorImage,
        isCenter: true,
        sharedFilms: 0,
        r: 44,
        x: width / 2,
        y: height / 2,
        fx: width / 2,
        fy: height / 2,
      },
      ...coStars.map(cs => ({
        id: cs.id,
        name: cs.name,
        image: cs.profile_path ? `${TMDB_IMAGE_BASE}${cs.profile_path}` : null,
        isCenter: false,
        sharedFilms: cs.sharedFilms,
        r: 24 + cs.sharedFilms * 3,
      })),
    ]

    const links: GraphLink[] = coStars.map(cs => ({
      source: actorId,
      target: cs.id,
      weight: cs.sharedFilms,
    }))

    // Create clip paths for each node
    nodes.forEach(node => {
      defs.append('clipPath')
        .attr('id', `clip-${node.id}`)
        .append('circle')
        .attr('r', node.r)
        .attr('cx', 0)
        .attr('cy', 0)
    })

    // Build simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => 100 + 20 * (1 / (d.weight || 1)))
        .strength(0.6)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => d.r + 12))

    // Draw links
    const linkGroup = svg.append('g')
    const linkEls = linkGroup.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#3f3f46')
      .attr('stroke-width', (d: GraphLink) => Math.min(1 + d.weight * 0.5, 4))
      .attr('stroke-opacity', 0.6)

    // Draw node groups
    const nodeGroup = svg.append('g')
    const nodeEls = nodeGroup.selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', d => d.isCenter ? 'default' : 'pointer')
      .on('click', (_event, d) => {
        if (!d.isCenter) {
          router.push(`/actor/${d.id}`)
        }
      })
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            if (!d.isCenter) {
              d.fx = null
              d.fy = null
            }
          })
      )

    // Circle backgrounds
    nodeEls.append('circle')
      .attr('r', d => d.r + 2)
      .attr('fill', d => d.isCenter ? '#92400e' : '#27272a')
      .attr('filter', d => d.isCenter ? 'url(#glow)' : 'none')

    // Images
    nodeEls.each(function(d) {
      const g = d3.select(this)
      if (d.image) {
        g.append('image')
          .attr('href', d.image)
          .attr('x', -d.r)
          .attr('y', -d.r)
          .attr('width', d.r * 2)
          .attr('height', d.r * 2)
          .attr('clip-path', `url(#clip-${d.id})`)
          .attr('preserveAspectRatio', 'xMidYMid slice')
      } else {
        g.append('circle')
          .attr('r', d.r)
          .attr('fill', d.isCenter ? '#78350f' : '#3f3f46')
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#a1a1aa')
          .attr('font-size', d.r * 0.6)
          .text(d.name.charAt(0))
      }
    })

    // Ring for center
    nodeEls.filter(d => d.isCenter)
      .append('circle')
      .attr('r', d => d.r + 3)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2)

    // Labels
    nodeEls.filter(d => !d.isCenter)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', d => d.r + 12)
      .attr('fill', '#a1a1aa')
      .attr('font-size', 9)
      .attr('pointer-events', 'none')
      .text(d => d.name.split(' ').slice(-1)[0])

    // Hover highlight
    nodeEls.filter(d => !d.isCenter)
      .on('mouseenter', function(_event, d) {
        d3.select(this).select('circle:first-child')
          .attr('fill', '#451a03')
        d3.select(this).select('text:last-child')
          .attr('fill', '#f59e0b')
      })
      .on('mouseleave', function(_event, d) {
        d3.select(this).select('circle:first-child')
          .attr('fill', d.isCenter ? '#92400e' : '#27272a')
        d3.select(this).select('text:last-child')
          .attr('fill', '#a1a1aa')
      })

    simulation.on('tick', () => {
      linkEls
        .attr('x1', d => (d.source as GraphNode).x ?? 0)
        .attr('y1', d => (d.source as GraphNode).y ?? 0)
        .attr('x2', d => (d.target as GraphNode).x ?? 0)
        .attr('y2', d => (d.target as GraphNode).y ?? 0)

      nodeEls.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth
      svg.attr('width', w)
      simulation.force('center', d3.forceCenter(w / 2, height / 2))
      simulation.alpha(0.3).restart()
    })
    ro.observe(container)

    return () => {
      simulation.stop()
      ro.disconnect()
    }
  }, [actorId, actorName, actorImage, coStars, isLoading, router])

  return (
    <div ref={containerRef} className="w-full h-96 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-zinc-500 text-sm">Building network...</span>
          </div>
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full" />
      {!isLoading && coStars.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
          No co-star data available
        </div>
      )}
    </div>
  )
}
