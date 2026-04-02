import { NextRequest, NextResponse } from 'next/server'
import { getPersonDetail } from '@/lib/tmdb'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const personId = parseInt(id, 10)
  if (isNaN(personId)) {
    return NextResponse.json({ error: 'Invalid director ID' }, { status: 400 })
  }

  try {
    const person = await getPersonDetail(personId)
    return NextResponse.json(person)
  } catch (error) {
    console.error('Director detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch director' }, { status: 500 })
  }
}
