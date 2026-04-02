import { NextRequest, NextResponse } from 'next/server'
import { getPersonDirectingCredits, getMovieDetail } from '@/lib/tmdb'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const directorId = parseInt(id, 10)
  if (isNaN(directorId)) {
    return NextResponse.json({ error: 'Invalid director ID' }, { status: 400 })
  }

  try {
    const credits = await getPersonDirectingCredits(directorId)

    // Enrich all directed films with revenue (directors have far fewer films than actors).
    const detailResults = await Promise.allSettled(
      credits.map(m => getMovieDetail(m.id))
    )

    const enriched = credits.map((m, i) => {
      const detail = detailResults[i]
      return {
        ...m,
        revenue: detail.status === 'fulfilled' ? detail.value.revenue : 0,
        budget: detail.status === 'fulfilled' ? detail.value.budget : 0,
        runtime: detail.status === 'fulfilled' ? detail.value.runtime : null,
        tagline: detail.status === 'fulfilled' ? detail.value.tagline : '',
        genres: detail.status === 'fulfilled' ? detail.value.genres : [],
      }
    })

    return NextResponse.json({ films: enriched })
  } catch (error) {
    console.error('Director credits error:', error)
    return NextResponse.json({ error: 'Failed to fetch directing credits' }, { status: 500 })
  }
}
