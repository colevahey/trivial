import { NextRequest, NextResponse } from 'next/server'
import { getPersonDetail } from '@/lib/tmdb'

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
    const actor = await getPersonDetail(actorId)
    return NextResponse.json(actor)
  } catch (error) {
    console.error('Actor detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch actor' }, { status: 500 })
  }
}
