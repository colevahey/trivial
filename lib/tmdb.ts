const TMDB_BASE = 'https://api.themoviedb.org/3'
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

function getHeaders() {
  const key = process.env.TMDB_API_KEY
  if (!key) throw new Error('TMDB_API_KEY is not set')
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${TMDB_BASE}${path}`, {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  })
  if (!res.ok) {
    throw new Error(`TMDB fetch failed: ${res.status} ${res.statusText} for ${path}`)
  }
  return res.json() as Promise<T>
}

export interface TMDBSearchPersonResult {
  id: number
  name: string
  profile_path: string | null
  known_for_department: string
  popularity: number
  known_for: { title?: string; name?: string }[]
}

export interface TMDBPersonDetail {
  id: number
  name: string
  profile_path: string | null
  biography: string
  birthday: string | null
  known_for_department: string
  popularity: number
}

export interface TMDBMovieCredit {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  revenue: number
  genre_ids: number[]
  character: string
  overview: string
}

export interface TMDBMovieDetail {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  revenue: number
  genre_ids: number[]
  genres: { id: number; name: string }[]
  overview: string
}

export interface TMDBCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export async function searchPersons(query: string): Promise<TMDBSearchPersonResult[]> {
  const data = await tmdbFetch<{ results: TMDBSearchPersonResult[] }>(
    `/search/person?query=${encodeURIComponent(query)}&include_adult=false`
  )
  return data.results
}

export async function getPersonDetail(id: number): Promise<TMDBPersonDetail> {
  return tmdbFetch<TMDBPersonDetail>(`/person/${id}`)
}

export async function getPersonMovieCredits(id: number): Promise<TMDBMovieCredit[]> {
  const data = await tmdbFetch<{ cast: TMDBMovieCredit[] }>(`/person/${id}/movie_credits`)
  return data.cast
}

export async function getMovieDetail(id: number): Promise<TMDBMovieDetail> {
  return tmdbFetch<TMDBMovieDetail>(`/movie/${id}`)
}

export async function getMovieCredits(id: number): Promise<TMDBCastMember[]> {
  const data = await tmdbFetch<{ cast: TMDBCastMember[] }>(`/movie/${id}/credits`)
  return data.cast
}
