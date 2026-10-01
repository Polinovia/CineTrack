import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db.js'
import { requireSession } from '../_auth.js'
import { TITLE_STATUSES, TITLE_TYPES } from '../_constants.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireSession(req, res)
  if (!session) return

  const id = Number(req.query.id)
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'invalid_id' })
    return
  }

  if (req.method === 'PATCH') {
    const owner = await sql`select owner_id from titles where id = ${id}`
    if (owner.length === 0) {
      res.status(404).json({ error: 'not_found' })
      return
    }
    if (owner[0].owner_id !== session.sub) {
      res.status(403).json({ error: 'not_owner' })
      return
    }

    const { title, type, status, now_watching, season_count, metadata_override } = req.body ?? {}

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      res.status(400).json({ error: 'invalid_input' })
      return
    }
    if (type !== undefined && !TITLE_TYPES.includes(type)) {
      res.status(400).json({ error: 'invalid_input' })
      return
    }
    if (status !== undefined && !TITLE_STATUSES.includes(status)) {
      res.status(400).json({ error: 'invalid_input' })
      return
    }
    if (now_watching !== undefined && typeof now_watching !== 'boolean') {
      res.status(400).json({ error: 'invalid_input' })
      return
    }
    if (season_count !== undefined && season_count !== null && (!Number.isInteger(season_count) || season_count < 1)) {
      res.status(400).json({ error: 'invalid_input' })
      return
    }
    if (metadata_override !== undefined && typeof metadata_override !== 'boolean') {
      res.status(400).json({ error: 'invalid_input' })
      return
    }

    if (now_watching === true) {
      await sql`update titles set now_watching = false where owner_id = ${session.sub} and id != ${id} and now_watching = true`
    }

    const rows = await sql`
      update titles set
        title = coalesce(${title ?? null}, title),
        type = coalesce(${type ?? null}, type),
        status = coalesce(${status ?? null}, status),
        now_watching = coalesce(${now_watching ?? null}, now_watching),
        season_count = coalesce(${season_count ?? null}, season_count)
      where id = ${id}
      returning id, title, type, status, now_watching, season_count, created_at
    `
    if (rows.length === 0) {
      res.status(404).json({ error: 'not_found' })
      return
    }

    res.status(200).json(rows[0])
    return
  }

  if (req.method === 'DELETE') {
    const rows = await sql`delete from titles where id = ${id} and owner_id = ${session.sub} returning id`
    if (rows.length === 0) {
      res.status(404).json({ error: 'not_found' })
      return
    }
    res.status(204).end()
    return
  }

  res.status(405).json({ error: 'method_not_allowed' })
}
