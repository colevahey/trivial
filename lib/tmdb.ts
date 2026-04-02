const TMDB_BASE = 'https://api.themoviedb.org/3'
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

function getApiKey() {
  const key = process.env.TMDB_API_KEY
  if (!key) throw new Error('TMDB_API_KEY is not set')
  return key
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${getApiKey()}`, {
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

export interface TMDBCrewCredit {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  revenue: number
  genre_ids: number[]
  overview: string
  job: string
  department: string
}

export interface TMDBMovieDetail {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  revenue: number
  budget: number
  runtime: number | null
  tagline: string
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

export interface TMDBCrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

export interface TMDBMultiResult {
  id: number
  media_type: 'person' | 'movie' | 'tv'
  name?: string
  title?: string
  profile_path?: string | null
  poster_path?: string | null
  known_for_department?: string
  popularity: number
  release_date?: string
}

export async function searchPersons(query: string): Promise<TMDBSearchPersonResult[]> {
  const data = await tmdbFetch<{ results: TMDBSearchPersonResult[] }>(
    `/search/person?query=${encodeURIComponent(query)}&include_adult=false`
  )
  return data.results
}

export async function searchMulti(query: string) {
  const data = await tmdbFetch<{ results: TMDBMultiResult[] }>(
    `/search/multi?query=${encodeURIComponent(query)}&include_adult=false`
  )
  return data.results
    .filter(r => r.media_type === 'person' || r.media_type === 'movie')
    .map(r => ({
      id: r.id,
      name: r.media_type === 'movie' ? (r.title ?? '') : (r.name ?? ''),
      profile_path: r.media_type === 'movie' ? (r.poster_path ?? null) : (r.profile_path ?? null),
      known_for_department: r.media_type === 'movie' ? 'Movie' : (r.known_for_department ?? 'Acting'),
      popularity: r.popularity,
      mediaType: r.media_type as 'person' | 'movie',
      year: r.release_date ? r.release_date.substring(0, 4) : undefined,
    }))
}

export async function getPersonDetail(id: number): Promise<TMDBPersonDetail> {
  return tmdbFetch<TMDBPersonDetail>(`/person/${id}`)
}

export async function getPersonMovieCredits(id: number): Promise<TMDBMovieCredit[]> {
  const data = await tmdbFetch<{ cast: TMDBMovieCredit[] }>(`/person/${id}/movie_credits`)
  return data.cast
}

export async function getPersonDirectingCredits(id: number): Promise<TMDBCrewCredit[]> {
  const data = await tmdbFetch<{ crew: TMDBCrewCredit[] }>(`/person/${id}/movie_credits`)
  return data.crew.filter(c => c.job === 'Director')
}

export async function getMovieDetail(id: number): Promise<TMDBMovieDetail> {
  return tmdbFetch<TMDBMovieDetail>(`/movie/${id}`)
}

export async function getMovieCredits(id: number): Promise<{ cast: TMDBCastMember[]; crew: TMDBCrewMember[] }> {
  return tmdbFetch<{ cast: TMDBCastMember[]; crew: TMDBCrewMember[] }>(`/movie/${id}/credits`)
}

export async function getMovieDirector(id: number): Promise<{ name: string; id: number } | null> {
  const { crew } = await getMovieCredits(id)
  const director = crew.find(c => c.job === 'Director')
  return director ? { name: director.name, id: director.id } : null
}
