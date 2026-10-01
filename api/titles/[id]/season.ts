import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../_db.js'
import { requireSession } from '../../_auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireSession(req, res)
  if (!session) return

  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const titleId = Number(req.query.id)
  if (!Number.isInteger(titleId)) {
    res.status(400).json({ error: 'invalid_id' })
    return
  }

  const owner = await sql`select owner_id from titles where id = ${titleId}`
  if (owner.length === 0) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  if (owner[0].owner_id !== session.sub) {
    res.status(403).json({ error: 'not_owner' })
    return
  }

  const { season_number, watched } = req.body ?? {}
  if (!Number.isInteger(season_number) || season_number < 1 || typeof watched !== 'boolean') {
    res.status(400).json({ error: 'invalid_input' })
    return
  }

  if (watched) {
    await sql`
      insert into season_progress (title_id, user_id, season_number)
      values (${titleId}, ${session.sub}, ${season_number})
      on conflict (title_id, user_id, season_number) do nothing
    `
  } else {
    await sql`
      delete from season_progress
      where title_id = ${titleId} and user_id = ${session.sub} and season_number = ${season_number}
    `
  }

  const seasonRows = await sql`
    select u.username, array_agg(sp.season_number order by sp.season_number) as seasons
    from season_progress sp
    join users u on u.id = sp.user_id
    where sp.title_id = ${titleId}
    group by u.username
  `
  res.status(200).json({ ok: true, seasons_watched: seasonRows })
}
