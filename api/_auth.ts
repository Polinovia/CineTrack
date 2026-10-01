import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'session'
const SESSION_DAYS = 90

export type SessionPayload = {
  sub: number
  username: string
}

export function issueSession(res: VercelResponse, payload: SessionPayload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: `${SESSION_DAYS}d`,
  })
  const maxAge = SESSION_DAYS * 24 * 60 * 60
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`,
  )
}

export function clearSession(res: VercelResponse) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`,
  )
}

export function readSession(req: VercelRequest): SessionPayload | null {
  const raw = req.headers.cookie
  if (!raw) return null

  const match = raw
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
  if (!match) return null

  const token = match.slice(COOKIE_NAME.length + 1)
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as unknown as SessionPayload
  } catch {
    return null
  }
}

export function requireSession(req: VercelRequest, res: VercelResponse): SessionPayload | null {
  const session = readSession(req)
  if (!session) {
    res.status(401).json({ error: 'not_authenticated' })
    return null
  }
  return session
}
