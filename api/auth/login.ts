import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { sql } from '../_db.js'
import { issueSession } from '../_auth.js'

const LOCK_THRESHOLD = 5
const LOCK_MINUTES = 15
const MIN_PASSWORD_LENGTH = 8

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const { username, password, register } = req.body ?? {}
  if (typeof username !== 'string' || typeof password !== 'string' || password.length < 1) {
    res.status(400).json({ error: 'invalid_input' })
    return
  }

  if (register) {
    if (username.trim().length < 2 || username.trim().length > 20) {
      res.status(400).json({ error: 'invalid_username' })
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: 'password_too_short', min_length: MIN_PASSWORD_LENGTH })
      return
    }
    const existing = await sql`select id from users where lower(username) = lower(${username.trim()})`
    if (existing.length > 0) {
      res.status(409).json({ error: 'username_taken' })
      return
    }
    const hash = await bcrypt.hash(password, 10)
    const rows = await sql`
      insert into users (username, password_hash)
      values (${username.trim()}, ${hash})
      returning id, username
    `
    issueSession(res, { sub: rows[0].id as number, username: rows[0].username as string })
    res.status(201).json({ username: rows[0].username })
    return
  }

  const rows = await sql`
    select id, username, password_hash, failed_attempts, locked_until
    from users where lower(username) = lower(${username})
  `
  const user = rows[0] as
    | {
        id: number
        username: string
        password_hash: string | null
        failed_attempts: number
        locked_until: string | null
      }
    | undefined

  if (!user || !user.password_hash) {
    res.status(401).json({ error: 'invalid_credentials' })
    return
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    res.status(429).json({ error: 'locked', locked_until: user.locked_until })
    return
  }

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    const attempts = user.failed_attempts + 1
    if (attempts >= LOCK_THRESHOLD) {
      const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
      await sql`
        update users set failed_attempts = 0, locked_until = ${lockedUntil.toISOString()}
        where id = ${user.id}
      `
      res.status(429).json({ error: 'locked', locked_until: lockedUntil.toISOString() })
      return
    }
    await sql`update users set failed_attempts = ${attempts} where id = ${user.id}`
    res.status(401).json({ error: 'invalid_credentials' })
    return
  }

  await sql`update users set failed_attempts = 0, locked_until = null where id = ${user.id}`
  issueSession(res, { sub: user.id, username: user.username })
  res.status(200).json({ username: user.username })
}
