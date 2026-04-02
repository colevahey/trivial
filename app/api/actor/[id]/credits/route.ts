import { NextRequest, NextResponse } from 'next/server'
import { getPersonMovieCredits } from '@/lib/tmdb'

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
    return NextResponse.json({ cast: credits })
  } catch (error) {
    console.error('Actor credits error:', error)
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 })
  }
}
