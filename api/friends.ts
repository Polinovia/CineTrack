import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'
import { requireSession } from './_auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireSession(req, res)
  if (!session) return

  if (req.method === 'GET') {
    const friends = await sql`
      select
        f.id as friendship_id,
        f.status,
        f.requester_id,
        case
          when f.requester_id = ${session.sub} then a.id
          else r.id
        end as friend_id,
        case
          when f.requester_id = ${session.sub} then a.username
          else r.username
        end as friend_username
      from friendships f
      join users r on r.id = f.requester_id
      join users a on a.id = f.addressee_id
      where (f.requester_id = ${session.sub} or f.addressee_id = ${session.sub})
        and f.status in ('pending', 'accepted')
      order by f.created_at desc
    `
    res.status(200).json(friends)
    return
  }

  if (req.method === 'POST') {
    const { username } = req.body ?? {}
    if (typeof username !== 'string' || !username.trim()) {
      res.status(400).json({ error: 'invalid_input' })
      return
    }

    const target = await sql`select id, username from users where lower(username) = lower(${username.trim()})`
    if (target.length === 0) {
      res.status(404).json({ error: 'user_not_found' })
      return
    }
    if (target[0].id === session.sub) {
      res.status(400).json({ error: 'cannot_add_self' })
      return
    }

    const existing = await sql`
      select id, status from friendships
      where (requester_id = ${session.sub} and addressee_id = ${target[0].id})
        or (requester_id = ${target[0].id} and addressee_id = ${session.sub})
    `
    if (existing.length > 0) {
      res.status(409).json({ error: 'already_exists', status: existing[0].status })
      return
    }

    const rows = await sql`
      insert into friendships (requester_id, addressee_id)
      values (${session.sub}, ${target[0].id})
      returning id, status
    `
    await sql`
      insert into notifications (user_id, type, from_user_id)
      values (${target[0].id}, 'friend_request', ${session.sub})
    `
    res.status(201).json({ friendship_id: rows[0].id, status: rows[0].status, friend_username: target[0].username, friend_id: target[0].id })
    return
  }

  if (req.method === 'PATCH') {
    const { friendship_id, action } = req.body ?? {}
    if (!Number.isInteger(friendship_id) || !['accept', 'reject'].includes(action)) {
      res.status(400).json({ error: 'invalid_input' })
      return
    }

    if (action === 'accept') {
      const rows = await sql`
        update friendships set status = 'accepted'
        where id = ${friendship_id} and addressee_id = ${session.sub} and status = 'pending'
        returning id, status, requester_id
      `
      if (rows.length === 0) {
        res.status(404).json({ error: 'not_found' })
        return
      }
      await sql`
        insert into notifications (user_id, type, from_user_id)
        values (${rows[0].requester_id}, 'friend_accepted', ${session.sub})
      `
      res.status(200).json(rows[0])
      return
    }

    const rows = await sql`
      delete from friendships
      where id = ${friendship_id}
        and (requester_id = ${session.sub} or addressee_id = ${session.sub})
      returning id
    `
    if (rows.length === 0) {
      res.status(404).json({ error: 'not_found' })
      return
    }
    res.status(200).json({ ok: true })
    return
  }

  if (req.method === 'DELETE') {
    const { friendship_id } = req.body ?? {}
    if (!Number.isInteger(friendship_id)) {
      res.status(400).json({ error: 'invalid_input' })
      return
    }
    await sql`
      delete from friendships
      where id = ${friendship_id}
        and (requester_id = ${session.sub} or addressee_id = ${session.sub})
    `
    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'method_not_allowed' })
}
