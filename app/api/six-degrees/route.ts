import { NextRequest, NextResponse } from 'next/server'
import { findPath } from '@/lib/six-degrees'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromId, toId } = body

    if (!fromId || !toId || typeof fromId !== 'number' || typeof toId !== 'number') {
      return NextResponse.json({ error: 'fromId and toId must be numbers' }, { status: 400 })
    }

    const path = await findPath(fromId, toId)

    if (path.length === 0) {
      return NextResponse.json({ error: 'No path found within 4 hops', path: [] }, { status: 200 })
    }

    return NextResponse.json({ path })
  } catch (error) {
    console.error('Six degrees error:', error)
    return NextResponse.json({ error: 'Failed to find path' }, { status: 500 })
  }
}
