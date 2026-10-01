import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db.js'
import { requireSession } from '../_auth.js'
import { TITLE_TYPES } from '../_constants.js'
import { enrichById, enrichTitle } from '../_enrich.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireSession(req, res)
  if (!session) return

  if (req.method === 'GET') {
    const ownerId = req.query.user_id ? Number(req.query.user_id) : session.sub
    const isOwn = ownerId === session.sub

    if (!isOwn) {
      const friendship = await sql`
        select id from friendships
        where status = 'accepted'
          and ((requester_id = ${session.sub} and addressee_id = ${ownerId})
            or (requester_id = ${ownerId} and addressee_id = ${session.sub}))
      `
      if (friendship.length === 0) {
        res.status(403).json({ error: 'not_friends' })
        return
      }
    }

    const rows = await sql`
      select
        t.id, t.title, t.type, t.status, t.now_watching,
        t.poster_url, t.description, t.genres, t.tmdb_rating::float8 as tmdb_rating,
        t.season_count, t.episode_count, t.release_date, t.trailer_url, t.created_at,
        u.username as owner,
        coalesce(
          json_agg(
            json_build_object('username', ru.username, 'score', r.score, 'comment', r.comment, 'status', r.status, 'rated_at', r.rated_at)
            order by ru.username
          ) filter (where r.id is not null),
          '[]'
        ) as ratings
      from titles t
      join users u on u.id = t.owner_id
      left join ratings r on r.title_id = t.id
      left join users ru on ru.id = r.user_id
      where t.owner_id = ${ownerId}
      group by t.id, u.username
      order by t.created_at desc
    `

    const seasonRows = await sql`
      select sp.title_id, u.username, array_agg(sp.season_number order by sp.season_number) as seasons
      from season_progress sp
      join users u on u.id = sp.user_id
      where sp.title_id in (select id from titles where owner_id = ${ownerId})
      group by sp.title_id, u.username
    `
    const seasonsByTitle = new Map<number, Array<{ username: string; seasons: number[] }>>()
    for (const row of seasonRows as Array<{ title_id: number; username: string; seasons: number[] }>) {
      const list = seasonsByTitle.get(row.title_id) ?? []
      list.push({ username: row.username, seasons: row.seasons })
      seasonsByTitle.set(row.title_id, list)
    }

    res.status(200).json(
      rows.map((r) => ({ ...r, seasons_watched: seasonsByTitle.get(r.id as number) ?? [] })),
    )
    return
  }

  if (req.method === 'POST') {
    const { title, type, tmdb_id } = req.body ?? {}
    if (typeof title !== 'string' || !title.trim() || !TITLE_TYPES.includes(type)) {
      res.status(400).json({ error: 'invalid_input' })
      return
    }
    const cleanTitle = title.trim()
    const enrichment =
      typeof tmdb_id === 'number' ? await enrichById(tmdb_id, type) : await enrichTitle(cleanTitle, type)
    const rows = await sql`
      insert into titles (
        title, type, owner_id, poster_url, description, genres, tmdb_rating, season_count, episode_count,
        release_date, trailer_url
      )
      values (
        ${cleanTitle}, ${type}, ${session.sub}, ${enrichment.poster_url}, ${enrichment.description},
        ${enrichment.genres}, ${enrichment.tmdb_rating}, ${enrichment.season_count}, ${enrichment.episode_count},
        ${enrichment.release_date}, ${enrichment.trailer_url}
      )
      returning id, title, type, status, now_watching,
        poster_url, description, genres, tmdb_rating::float8 as tmdb_rating,
        season_count, episode_count, release_date, trailer_url, created_at
    `
    res.status(201).json({ ...rows[0], owner: session.username, ratings: [], seasons_watched: [] })
    return
  }

  res.status(405).json({ error: 'method_not_allowed' })
}
