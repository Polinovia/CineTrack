import type { TitleType } from './_constants.js'

export type Enrichment = {
  poster_url: string | null
  description: string | null
  genres: string | null
  tmdb_rating: number | null
  season_count: number | null
  episode_count: number | null
  release_date: string | null
  trailer_url: string | null
}

const EMPTY: Enrichment = {
  poster_url: null,
  description: null,
  genres: null,
  tmdb_rating: null,
  season_count: null,
  episode_count: null,
  release_date: null,
  trailer_url: null,
}

function trim(text: string | null | undefined, max = 700): string | null {
  if (!text) return null
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return null
  if (clean.length <= max) return clean
  return clean.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

function bareTitle(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, '').trim() || title
}

function significantWords(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3)
}

function isRelevant(candidate: string, bt: string): boolean {
  const words = significantWords(bt)
  if (words.length === 0) return true
  const lower = candidate.toLowerCase()
  return words.every((w) => lower.includes(w))
}

type TmdbDetail = {
  genres?: Array<{ name: string }>
  vote_average?: number
  poster_path?: string | null
  overview?: string
  number_of_seasons?: number
  number_of_episodes?: number
  belongs_to_collection?: { id: number } | null
  release_date?: string
  first_air_date?: string
  videos?: { results?: Array<{ type: string; site: string; key: string; official?: boolean }> }
}

function pickTrailer(d: TmdbDetail): string | null {
  const vids = d.videos?.results ?? []
  const trailer =
    vids.find((v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official) ??
    vids.find((v) => v.type === 'Trailer' && v.site === 'YouTube')
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
}

async function collectionSize(collectionId: number, apiKey: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/collection/${collectionId}?api_key=${apiKey}`)
    if (!res.ok) return null
    const data = (await res.json()) as { parts?: unknown[] }
    return data.parts?.length ?? null
  } catch {
    return null
  }
}

async function detailToEnrichment(d: TmdbDetail, type: TitleType, apiKey: string): Promise<Enrichment> {
  const filmCount =
    type === 'film' && d.belongs_to_collection ? await collectionSize(d.belongs_to_collection.id, apiKey) : null

  return {
    poster_url: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
    description: trim(d.overview),
    genres: d.genres?.length ? d.genres.slice(0, 3).map((g) => g.name).join(', ') : null,
    tmdb_rating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
    season_count: type === 'film' ? filmCount : (d.number_of_seasons ?? null),
    episode_count: type === 'film' ? null : (d.number_of_episodes ?? null),
    release_date: (type === 'film' ? d.release_date : d.first_air_date) || null,
    trailer_url: pickTrailer(d),
  }
}

export async function enrichById(tmdbId: number, type: TitleType): Promise<Enrichment> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) return EMPTY
  const endpoint = type === 'film' ? 'movie' : 'tv'
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${apiKey}&language=fr-FR&append_to_response=videos`,
    )
    if (!res.ok) return EMPTY
    return await detailToEnrichment((await res.json()) as TmdbDetail, type, apiKey)
  } catch {
    return EMPTY
  }
}

async function tmdbEnrich(title: string, type: TitleType, apiKey: string): Promise<Enrichment | null> {
  const endpoint = type === 'film' ? 'movie' : 'tv'
  const bt = bareTitle(title)

  for (const query of [title, bt]) {
    const searchUrl = `https://api.themoviedb.org/3/search/${endpoint}?query=${encodeURIComponent(query)}&api_key=${apiKey}&language=fr-FR`
    const searchRes = await fetch(searchUrl)
    if (!searchRes.ok) continue
    const searchData = (await searchRes.json()) as { results?: Array<Record<string, unknown>> }
    const hit = searchData.results?.find((r) =>
      isRelevant(((r.title ?? r.name) as string) ?? '', bt),
    )
    if (!hit) continue

    const detailUrl = `https://api.themoviedb.org/3/${endpoint}/${hit.id}?api_key=${apiKey}&language=fr-FR&append_to_response=videos`
    const detailRes = await fetch(detailUrl)
    if (!detailRes.ok) continue
    return await detailToEnrichment((await detailRes.json()) as TmdbDetail, type, apiKey)
  }
  return null
}

export async function enrichTitle(title: string, type: TitleType): Promise<Enrichment> {
  try {
    const apiKey = process.env.TMDB_API_KEY
    if (apiKey) {
      const result = await tmdbEnrich(title, type, apiKey)
      if (result && (result.poster_url || result.description)) return result
    }
    return EMPTY
  } catch {
    return EMPTY
  }
}
