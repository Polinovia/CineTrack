import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readSession } from '../_auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = readSession(req)
  if (!session) {
    res.status(401).json({ error: 'not_authenticated' })
    return
  }
  res.status(200).json({ username: session.username })
}
