import webpush from 'web-push'
import { sql } from './_db.js'

let configured = false

function ensureConfigured() {
  if (configured) return
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) return
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

type PushPayload = {
  title: string
  body: string
  url?: string
}

type SubRow = { id: number; endpoint: string; p256dh: string; auth: string }

async function sendToSubscriptions(rows: SubRow[], payload: PushPayload) {
  ensureConfigured()
  if (!configured) return

  const body = JSON.stringify(payload)

  await Promise.all(
    rows.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        )
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await sql`delete from push_subscriptions where id = ${sub.id}`
        }
      }
    }),
  )
}

export async function notifyUser(userId: number, payload: PushPayload) {
  const rows = await sql`select id, endpoint, p256dh, auth from push_subscriptions where user_id = ${userId}`
  await sendToSubscriptions(rows as SubRow[], payload)
  return rows.length
}
