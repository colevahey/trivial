import { NextRequest, NextResponse } from 'next/server'
import { getPersonDetail, getPersonMovieCredits, getMovieDetail } from '@/lib/tmdb'

const EXCLUDED_GENRES = [99, 10770] // Documentary, TV Movie

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const actorId = parseInt(id, 10)
  if (isNaN(actorId)) return NextResponse.json({ error: 'Invalid actor ID' }, { status: 400 })

  try {
    const [actor, rawCredits] = await Promise.all([
      getPersonDetail(actorId),
      getPersonMovieCredits(actorId),
    ])

    const credits = rawCredits.filter(m =>
      m.release_date &&
      m.vote_average > 0 &&
      !EXCLUDED_GENRES.some(g => m.genre_ids.includes(g))
    )

    // Enrich top 30 by rating for revenue data
    const toEnrich = [...credits]
      .sort((a, b) => b.vote_average - a.vote_average)
      .slice(0, 30)

    const detailResults = await Promise.allSettled(toEnrich.map(m => getMovieDetail(m.id)))
    const revenueMap = new Map<number, number>()
    detailResults.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.revenue > 0) {
        revenueMap.set(toEnrich[i].id, result.value.revenue)
      }
    })

    const enriched = credits
      .map(m => ({
        id: m.id,
        title: m.title,
        year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : 0,
        vote_average: m.vote_average,
        revenue: revenueMap.get(m.id) ?? 0,
      }))
      .filter(m => m.year > 0)

    const byRevenue = enriched.filter(m => m.revenue > 0).sort((a, b) => b.revenue - a.revenue)
    const byRating = [...enriched].sort((a, b) => b.vote_average - a.vote_average)
    const byDate = [...enriched].sort((a, b) => a.year - b.year)
    const totalRevenue = byRevenue.reduce((sum, m) => sum + m.revenue, 0)
    const criticalCount = enriched.filter(m => m.vote_average >= 7.0).length

    return NextResponse.json({
      actor: { id: actor.id, name: actor.name, profile_path: actor.profile_path },
      films: enriched,
      filmCount: enriched.length,
      highestGrossing: byRevenue.slice(0, 5),
      highestRated: byRating.slice(0, 5),
      firstFilm: byDate[0] ?? null,
      totalRevenue,
      criticalCount,
      revenueFilmCount: byRevenue.length,
    })
  } catch (error) {
    console.error('Actor trivia error:', error)
    return NextResponse.json({ error: 'Failed to fetch trivia data' }, { status: 500 })
  }
}
