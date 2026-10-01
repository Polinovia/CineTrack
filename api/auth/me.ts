import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { sql } from '../_db.js'
import { readSession } from '../_auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = readSession(req)
  if (!session) {
    res.status(401).json({ error: 'not_authenticated' })
    return
  }

  if (req.method === 'GET') {
    res.status(200).json({ username: session.username })
    return
  }

  if (req.method === 'PATCH') {
    const { current_password, new_password } = req.body ?? {}
    if (typeof current_password !== 'string' || typeof new_password !== 'string') {
      res.status(400).json({ error: 'invalid_input' })
      return
    }
    if (new_password.length < 8) {
      res.status(400).json({ error: 'password_too_short', min_length: 8 })
      return
    }

    const rows = await sql`select password_hash from users where id = ${session.sub}`
    if (rows.length === 0 || !rows[0].password_hash) {
      res.status(404).json({ error: 'not_found' })
      return
    }

    const ok = await bcrypt.compare(current_password, rows[0].password_hash as string)
    if (!ok) {
      res.status(401).json({ error: 'wrong_password' })
      return
    }

    const hash = await bcrypt.hash(new_password, 10)
    await sql`update users set password_hash = ${hash} where id = ${session.sub}`
    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'method_not_allowed' })
}
