import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'
import { requireSession } from './_auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireSession(req, res)
  if (!session) return

  if (req.method === 'GET') {
    const rows = await sql`
      select n.id, n.type, n.title_name, n.read, n.created_at,
             u.username as from_username
      from notifications n
      left join users u on u.id = n.from_user_id
      where n.user_id = ${session.sub}
      order by n.created_at desc
      limit 50
    `
    const unread = await sql`
      select count(*)::int as count from notifications
      where user_id = ${session.sub} and read = false
    `
    res.status(200).json({ notifications: rows, unread: unread[0].count })
    return
  }

  if (req.method === 'PATCH') {
    const { id } = req.body ?? {}
    if (id) {
      await sql`update notifications set read = true where id = ${id} and user_id = ${session.sub}`
    } else {
      await sql`update notifications set read = true where user_id = ${session.sub} and read = false`
    }
    res.status(200).json({ ok: true })
    return
  }

  if (req.method === 'POST') {
    const { endpoint, keys } = req.body ?? {}
    if (
      typeof endpoint !== 'string' ||
      !endpoint ||
      typeof keys?.p256dh !== 'string' ||
      typeof keys?.auth !== 'string'
    ) {
      res.status(400).json({ error: 'invalid_input' })
      return
    }
    await sql`
      insert into push_subscriptions (user_id, endpoint, p256dh, auth)
      values (${session.sub}, ${endpoint}, ${keys.p256dh}, ${keys.auth})
      on conflict (endpoint) do update set
        user_id = ${session.sub}, p256dh = ${keys.p256dh}, auth = ${keys.auth}
    `
    res.status(200).json({ ok: true })
    return
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body ?? {}
    if (typeof endpoint !== 'string' || !endpoint) {
      res.status(400).json({ error: 'invalid_input' })
      return
    }
    await sql`delete from push_subscriptions where endpoint = ${endpoint} and user_id = ${session.sub}`
    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'method_not_allowed' })
}
