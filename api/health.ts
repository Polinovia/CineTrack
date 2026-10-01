import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const [{ now }] = await sql`select now()`
    res.status(200).json({ ok: true, db_time: now })
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message })
  }
}
