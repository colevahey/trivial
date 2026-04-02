import { NextRequest, NextResponse } from 'next/server'
import { getPersonMovieCredits, getMovieDetail, getMovieDirector } from '@/lib/tmdb'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const actorId = parseInt(id, 10)
  if (isNaN(actorId)) {
    return NextResponse.json({ error: 'Invalid actor ID' }, { status: 400 })
  }

  try {
    const credits = await getPersonMovieCredits(actorId)

    // Enrich top 25 films (by popularity) with revenue + director.
    const top25 = [...credits]
      .sort((a, b) => (b as unknown as { popularity: number }).popularity - (a as unknown as { popularity: number }).popularity)
      .slice(0, 25)

    const [detailResults, directorResults] = await Promise.all([
      Promise.allSettled(top25.map(m => getMovieDetail(m.id))),
      Promise.allSettled(top25.map(m => getMovieDirector(m.id))),
    ])

    const revenueMap = new Map<number, number>()
    detailResults.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.revenue > 0) {
        revenueMap.set(top25[i].id, result.value.revenue)
      }
    })

    const directorMap = new Map<number, { name: string; id: number }>()
    directorResults.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        directorMap.set(top25[i].id, result.value)
      }
    })

    const enriched = credits.map(m => ({
      ...m,
      revenue: revenueMap.get(m.id) ?? 0,
      director: directorMap.get(m.id)?.name,
      directorId: directorMap.get(m.id)?.id,
    }))

    return NextResponse.json({ cast: enriched })
  } catch (error) {
    console.error('Actor credits error:', error)
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
  }
}
