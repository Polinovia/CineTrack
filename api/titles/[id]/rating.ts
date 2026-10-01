import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../_db.js'
import { requireSession } from '../../_auth.js'
import { TITLE_STATUSES } from '../../_constants.js'

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

  const { status, score, comment } = req.body ?? {}
  const hasScore = score !== undefined
  const hasComment = comment !== undefined

  if (status !== undefined && !TITLE_STATUSES.includes(status)) {
    res.status(400).json({ error: 'invalid_input' })
    return
  }
  if (hasScore && score !== null && (!Number.isInteger(score) || score < 1 || score > 10)) {
    res.status(400).json({ error: 'invalid_input' })
    return
  }
  if (hasComment && comment !== null && typeof comment !== 'string') {
    res.status(400).json({ error: 'invalid_input' })
    return
  }

  const rows = await sql`
    insert into ratings (title_id, user_id, status, score, comment)
    values (${titleId}, ${session.sub}, ${status ?? 'a_voir'}, ${hasScore ? score : null}, ${hasComment ? comment : null})
    on conflict (title_id, user_id) do update set
      status = coalesce(${status ?? null}, ratings.status),
      score = case when ${hasScore} then ${hasScore ? score : null} else ratings.score end,
      comment = case when ${hasComment} then ${hasComment ? comment : null} else ratings.comment end,
      rated_at = now()
    returning status, score, comment
  `
  res.status(200).json({ username: session.username, ...rows[0] })
}
