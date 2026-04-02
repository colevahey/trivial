export interface Actor {
  id: number
  name: string
  profile_path: string | null
  biography: string
  birthday: string | null
  known_for_department: string
  popularity: number
}

export interface Movie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  revenue: number
  budget?: number
  runtime?: number | null
  tagline?: string
  director?: string
  directorId?: number
  genre_ids: number[]
  genres?: Genre[]
  overview: string
  character?: string
}

export interface Genre {
  id: number
  name: string
}

export interface Credit {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export interface PathNode {
  type: 'actor' | 'movie'
  id: number
  name: string
  image: string | null
  character?: string
}

export interface GameState {
  targetActor: Actor
  currentActor: Actor
  path: PathNode[]
  optimalLength: number
  status: 'playing' | 'won' | 'gave-up'
  score: number
}

export interface SearchResult {
  id: number
  name: string
  profile_path: string | null
  known_for_department: string
  popularity: number
  mediaType?: 'person' | 'movie'
  year?: string
}

export interface CoStarNode {
  id: number
  name: string
  profile_path: string | null
  sharedFilms: number
  films: string[]
}
