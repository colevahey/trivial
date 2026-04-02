import { NextRequest, NextResponse } from 'next/server'
import { getMovieCredits } from '@/lib/tmdb'

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
    const { cast, crew } = await getMovieCredits(movieId)
    return NextResponse.json({ cast, crew })
  } catch (error) {
    console.error('Movie credits error:', error)
    return NextResponse.json({ error: 'Failed to fetch movie credits' }, { status: 500 })
  }
}
