import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db.js'
import { notifyUser } from '../_push.js'

const TYPE_LABEL: Record<string, string> = {
  film: 'Le film',
  serie: 'La série',
  anime: "L'anime",
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  const rows = await sql`
    select id, title, type, owner_id, release_date, notified_month, notified_week, notified_tomorrow
    from titles
    where release_date is not null
      and release_date > current_date
      and (notified_month = false or notified_week = false or notified_tomorrow = false)
  `

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let sent = 0
  for (const row of rows as Array<{
    id: number
    title: string
    type: string
    owner_id: number
    release_date: string
    notified_month: boolean
    notified_week: boolean
    notified_tomorrow: boolean
  }>) {
    const releaseDate = new Date(row.release_date)
    releaseDate.setHours(0, 0, 0, 0)
    const daysUntil = Math.round((releaseDate.getTime() - today.getTime()) / 86400000)
    const label = TYPE_LABEL[row.type] ?? 'Le titre'

    if (!row.notified_tomorrow && daysUntil <= 1) {
      await notifyUser(row.owner_id, {
        title: 'Ça sort demain !',
        body: `${label} « ${row.title} » sort demain.`,
        url: '/',
      })
      await sql`
        update titles set notified_tomorrow = true, notified_week = true, notified_month = true
        where id = ${row.id}
      `
      sent++
    } else if (!row.notified_week && daysUntil <= 7) {
      await notifyUser(row.owner_id, {
        title: 'Ça sort dans une semaine',
        body: `${label} « ${row.title} » sort dans une semaine.`,
        url: '/',
      })
      await sql`update titles set notified_week = true, notified_month = true where id = ${row.id}`
      sent++
    } else if (!row.notified_month && daysUntil <= 30) {
      await notifyUser(row.owner_id, {
        title: 'Ça sort dans un mois',
        body: `${label} « ${row.title} » sort dans un mois.`,
        url: '/',
      })
      await sql`update titles set notified_month = true where id = ${row.id}`
      sent++
    }
  }

  res.status(200).json({ checked: rows.length, sent })
}
