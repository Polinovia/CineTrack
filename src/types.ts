export type TitleType = 'film' | 'serie' | 'anime'
export type TitleStatus = 'a_voir' | 'en_cours' | 'vu'

export type Rating = {
  username: string
  status: TitleStatus
  score: number | null
  comment: string | null
  rated_at: string
}

export type SeasonWatch = {
  username: string
  seasons: number[]
}

export type Title = {
  id: number
  title: string
  type: TitleType
  status: TitleStatus
  now_watching: boolean
  poster_url: string | null
  description: string | null
  genres: string | null
  tmdb_rating: number | null
  season_count: number | null
  episode_count: number | null
  release_date: string | null
  trailer_url: string | null
  created_at: string
  owner: string
  ratings: Rating[]
  seasons_watched: SeasonWatch[]
}

export type Friend = {
  friendship_id: number
  status: 'pending' | 'accepted'
  requester_id: number
  friend_id: number
  friend_username: string
}

export const TYPE_LABELS: Record<TitleType, string> = {
  film: 'Film',
  serie: 'Série',
  anime: 'Anime',
}

export const STATUS_LABELS: Record<TitleStatus, string> = {
  a_voir: 'À voir',
  en_cours: 'En cours',
  vu: 'Vu',
}

export const STATUS_ORDER: TitleStatus[] = ['a_voir', 'en_cours', 'vu']

export function isUpcoming(t: Pick<Title, 'release_date'>): boolean {
  return !!t.release_date && new Date(t.release_date) > new Date()
}
