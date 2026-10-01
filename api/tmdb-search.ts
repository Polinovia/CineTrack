import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from './_auth.js'
import { TITLE_TYPES, type TitleType } from './_constants.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireSession(req, res)
  if (!session) return

  const q = req.query.q
  const type = req.query.type
  if (typeof q !== 'string' || !q.trim() || typeof type !== 'string' || !TITLE_TYPES.includes(type as TitleType)) {
    res.status(400).json({ error: 'invalid_input' })
    return
  }

  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    res.status(200).json([])
    return
  }

  const endpoint = type === 'film' ? 'movie' : 'tv'
  const url = `https://api.themoviedb.org/3/search/${endpoint}?query=${encodeURIComponent(q.trim())}&api_key=${apiKey}&language=fr-FR`
  const tmdbRes = await fetch(url)
  if (!tmdbRes.ok) {
    res.status(200).json([])
    return
  }

  const data = (await tmdbRes.json()) as { results?: Array<Record<string, unknown>> }
  const results = (data.results ?? []).slice(0, 6).map((r) => {
    const date = (r.release_date ?? r.first_air_date) as string | undefined
    return {
      tmdb_id: r.id as number,
      title: (r.title ?? r.name) as string,
      year: date ? date.slice(0, 4) : null,
      poster_url: r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path as string}` : null,
    }
  })
  res.status(200).json(results)
}
