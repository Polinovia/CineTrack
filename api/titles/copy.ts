import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db.js'
import { requireSession } from '../_auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireSession(req, res)
  if (!session) return

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const { title_id } = req.body ?? {}
  if (!Number.isInteger(title_id)) {
    res.status(400).json({ error: 'invalid_input' })
    return
  }

  const source = await sql`
    select t.*, u.id as source_owner_id
    from titles t
    join users u on u.id = t.owner_id
    where t.id = ${title_id}
  `
  if (source.length === 0) {
    res.status(404).json({ error: 'not_found' })
    return
  }

  const s = source[0]

  if (s.source_owner_id === session.sub) {
    res.status(400).json({ error: 'already_yours' })
    return
  }

  const friendship = await sql`
    select id from friendships
    where status = 'accepted'
      and ((requester_id = ${session.sub} and addressee_id = ${s.source_owner_id})
        or (requester_id = ${s.source_owner_id} and addressee_id = ${session.sub}))
  `
  if (friendship.length === 0) {
    res.status(403).json({ error: 'not_friends' })
    return
  }

  const rows = await sql`
    insert into titles (title, type, owner_id, poster_url, description, genres, tmdb_rating, season_count, episode_count, release_date, trailer_url)
    values (${s.title}, ${s.type}, ${session.sub}, ${s.poster_url}, ${s.description}, ${s.genres}, ${s.tmdb_rating}, ${s.season_count}, ${s.episode_count}, ${s.release_date}, ${s.trailer_url})
    returning id, title, type, status, now_watching,
      poster_url, description, genres, tmdb_rating::float8 as tmdb_rating,
      season_count, episode_count, release_date, trailer_url, created_at
  `

  res.status(201).json({ ...rows[0], owner: session.username, ratings: [], seasons_watched: [] })
}
