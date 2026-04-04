import { getPersonMovieCredits, getMovieCredits, TMDB_IMAGE_BASE } from './tmdb'
import type { PathNode } from './types'

interface BFSNode {
  actorId: number
  path: PathNode[]
}

async function getActorMovieIds(actorId: number, movieCache: Map<number, number[]>): Promise<number[]> {
  if (movieCache.has(actorId)) return movieCache.get(actorId)!
  const credits = await getPersonMovieCredits(actorId)
  const ids = credits
    .filter(m => m.release_date && m.vote_average > 0)
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 20)
    .map(m => m.id)
  movieCache.set(actorId, ids)
  return ids
}

async function getMovieActorIds(
  movieId: number,
  castCache: Map<number, { id: number; name: string; profile_path: string | null }[]>
): Promise<{ id: number; name: string; profile_path: string | null }[]> {
  if (castCache.has(movieId)) return castCache.get(movieId)!
  const { cast } = await getMovieCredits(movieId)
  const limited = cast.slice(0, 15).map(c => ({
    id: c.id,
    name: c.name,
    profile_path: c.profile_path,
  }))
  castCache.set(movieId, limited)
  return limited
}

async function getActorName(actorId: number): Promise<{ name: string; profile_path: string | null }> {
  try {
    const { getPersonDetail } = await import('./tmdb')
    const detail = await getPersonDetail(actorId)
    return { name: detail.name, profile_path: detail.profile_path }
  } catch {
    return { name: 'Unknown', profile_path: null }
  }
}

async function getMovieTitle(movieId: number): Promise<{ title: string; poster_path: string | null }> {
  try {
    const { getMovieDetail } = await import('./tmdb')
    const detail = await getMovieDetail(movieId)
    return { title: detail.title, poster_path: detail.poster_path }
  } catch {
    return { title: 'Unknown', poster_path: null }
  }
}

export async function findPath(fromActorId: number, toActorId: number): Promise<PathNode[]> {
  if (fromActorId === toActorId) {
    const info = await getActorName(fromActorId)
    return [
      {
        type: 'actor',
        id: fromActorId,
        name: info.name,
        image: info.profile_path ? `${TMDB_IMAGE_BASE}${info.profile_path}` : null,
      },
    ]
  }

  const movieCache = new Map<number, number[]>()
  const castCache = new Map<number, { id: number; name: string; profile_path: string | null }[]>()

  // Track visited actors and their paths from each side
  const forwardVisited = new Map<number, PathNode[]>()
  const backwardVisited = new Map<number, PathNode[]>()

  const fromInfo = await getActorName(fromActorId)
  const toInfo = await getActorName(toActorId)

  const fromNode: PathNode = {
    type: 'actor',
    id: fromActorId,
    name: fromInfo.name,
    image: fromInfo.profile_path ? `${TMDB_IMAGE_BASE}${fromInfo.profile_path}` : null,
  }

  const toNode: PathNode = {
    type: 'actor',
    id: toActorId,
    name: toInfo.name,
    image: toInfo.profile_path ? `${TMDB_IMAGE_BASE}${toInfo.profile_path}` : null,
  }

  forwardVisited.set(fromActorId, [fromNode])
  backwardVisited.set(toActorId, [toNode])

  const forwardQueue: BFSNode[] = [{ actorId: fromActorId, path: [fromNode] }]
  const backwardQueue: BFSNode[] = [{ actorId: toActorId, path: [toNode] }]

  const MAX_DEPTH = 4

  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    // Process forward frontier
    const forwardFrontier = [...forwardQueue]
    forwardQueue.length = 0

    for (const node of forwardFrontier) {
      if (node.path.length > depth + 1) continue
      const movieIds = await getActorMovieIds(node.actorId, movieCache)

      for (const movieId of movieIds) {
        const movieInfo = await getMovieTitle(movieId)
        const movieNode: PathNode = {
          type: 'movie',
          id: movieId,
          name: movieInfo.title,
          image: movieInfo.poster_path ? `${TMDB_IMAGE_BASE}${movieInfo.poster_path}` : null,
        }

        const cast = await getMovieActorIds(movieId, castCache)

        for (const actor of cast) {
          if (forwardVisited.has(actor.id)) continue

          const newPath: PathNode[] = [
            ...node.path,
            movieNode,
            {
              type: 'actor',
              id: actor.id,
              name: actor.name,
              image: actor.profile_path ? `${TMDB_IMAGE_BASE}${actor.profile_path}` : null,
            },
          ]

          forwardVisited.set(actor.id, newPath)
          forwardQueue.push({ actorId: actor.id, path: newPath })

          // Check for intersection with backward visited
          if (backwardVisited.has(actor.id)) {
            const backPath = backwardVisited.get(actor.id)!
            return [...newPath, ...backPath.slice(0, -1).reverse()]
          }

          if (actor.id === toActorId) {
            return newPath
          }
        }
      }
    }

    // Process backward frontier
    const backwardFrontier = [...backwardQueue]
    backwardQueue.length = 0

    for (const node of backwardFrontier) {
      if (node.path.length > depth + 1) continue
      const movieIds = await getActorMovieIds(node.actorId, movieCache)

      for (const movieId of movieIds) {
        const movieInfo = await getMovieTitle(movieId)
        const movieNode: PathNode = {
          type: 'movie',
          id: movieId,
          name: movieInfo.title,
          image: movieInfo.poster_path ? `${TMDB_IMAGE_BASE}${movieInfo.poster_path}` : null,
        }

        const cast = await getMovieActorIds(movieId, castCache)

        for (const actor of cast) {
          if (backwardVisited.has(actor.id)) continue

          const newPath: PathNode[] = [
            ...node.path,
            movieNode,
            {
              type: 'actor',
              id: actor.id,
              name: actor.name,
              image: actor.profile_path ? `${TMDB_IMAGE_BASE}${actor.profile_path}` : null,
            },
          ]

          backwardVisited.set(actor.id, newPath)
          backwardQueue.push({ actorId: actor.id, path: newPath })

          // Check for intersection with forward visited
          if (forwardVisited.has(actor.id)) {
            const fwdPath = forwardVisited.get(actor.id)!
            return [...fwdPath, ...newPath.slice(0, -1).reverse()]
          }

          if (actor.id === fromActorId) {
            return newPath.reverse()
          }
        }
      }
    }
  }

  return []
}
