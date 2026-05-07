import { NextResponse } from 'next/server'
import { findPath } from '@/lib/six-degrees'
import { getPersonDetail } from '@/lib/tmdb'
import { SEED_ACTOR_IDS, getDailySeed, mulberry32, seededShuffle } from '@/lib/daily-seed'
import type { Actor } from '@/lib/types'

interface DailyPathResult {
  startActor: Actor
  targetActor: Actor
  optimalLength: number
}

// In-memory cache: one entry per calendar day
const cache = new Map<string, DailyPathResult>()

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export async function GET() {
  const key = todayKey()

  const cached = cache.get(key)
  if (cached) return NextResponse.json(cached)

  // Evict yesterday's entry
  for (const k of cache.keys()) {
    if (k !== key) cache.delete(k)
  }

  const rand = mulberry32(getDailySeed())
  const shuffled = seededShuffle([...SEED_ACTOR_IDS], rand)

  for (let i = 0; i < shuffled.length - 1; i++) {
    const fromId = shuffled[i]
    const toId = shuffled[i + 1]
    if (!fromId || !toId) continue

    try {
      const path = await findPath(fromId, toId)
      if (!path.length) continue

      const optimalLength = Math.floor((path.length - 1) / 2)
      if (optimalLength < 2 || optimalLength > 5) continue

      const [startActor, targetActor] = await Promise.all([
        getPersonDetail(fromId),
        getPersonDetail(toId),
      ])

      const result: DailyPathResult = { startActor, targetActor, optimalLength }
      cache.set(key, result)
      return NextResponse.json(result)
    } catch {
      continue
    }
  }

  return NextResponse.json({ error: 'No valid pair found today' }, { status: 500 })
}
