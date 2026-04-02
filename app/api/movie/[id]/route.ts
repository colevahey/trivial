import { NextRequest, NextResponse } from 'next/server'
import { getMovieDetail } from '@/lib/tmdb'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const movieId = parseInt(id, 10)
  if (isNaN(movieId)) {
    return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 })
  }

  try {
    const movie = await getMovieDetail(movieId)
    return NextResponse.json(movie)
  } catch (error) {
    console.error('Movie detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch movie' }, { status: 500 })
  }
}
