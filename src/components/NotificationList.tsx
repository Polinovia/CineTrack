import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { IconUser, IconHandshake, IconFilm, IconBell } from './Icons'
import './NotificationList.css'

type Notification = {
  id: number
  type: string
  from_username: string | null
  title_name: string | null
  read: boolean
  created_at: string
}

export default function NotificationList({ onBack }: { onBack: () => void }) {
  const { t } = useI18n()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => setItems(data.notifications ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function markAllRead() {
    await apiFetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({}) })
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function markRead(id: number) {
    await apiFetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ id }) })
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const unread = items.filter((n) => !n.read)
  const read = items.filter((n) => n.read)

  function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '< 1 min'
    if (mins < 60) return `${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}j`
  }

  function renderMessage(n: Notification) {
    const name = n.from_username ?? '?'
    if (n.type === 'friend_request') {
      return <><strong>{name}</strong> {t('notif.friendRequest')}</>
    }
    if (n.type === 'friend_accepted') {
      return <><strong>{name}</strong> {t('notif.friendAccepted')}</>
    }
    if (n.type === 'title_added') {
      return <><strong>{name}</strong> {t('notif.titleAdded')} <em>« {n.title_name} »</em> {t('notif.toTheirList')}</>
    }
    return <>{name}</>
  }

  function iconFor(type: string) {
    if (type === 'friend_request') return <IconUser size={20} />
    if (type === 'friend_accepted') return <IconHandshake size={20} />
    if (type === 'title_added') return <IconFilm size={20} />
    return <IconBell size={20} />
  }

  return (
    <div className="notif-page">
      <div className="notif-header">
        <button className="notif-back" onClick={onBack}>{t('notif.back')}</button>
        <h2>{t('notif.title')}</h2>
        {unread.length > 0 && (
          <button className="notif-mark-all" onClick={markAllRead}>
            {t('notif.markAllRead')}
          </button>
        )}
      </div>

      {loading && <p className="notif-loading">{t('friendList.loading')}</p>}

      {!loading && items.length === 0 && (
        <p className="notif-empty">{t('notif.empty')}</p>
      )}

      {unread.length > 0 && (
        <div className="notif-section">
          <h3 className="notif-section-title">{t('notif.new')}</h3>
          {unread.map((n) => (
            <div key={n.id} className="notif-item notif-unread" onClick={() => markRead(n.id)}>
              <span className="notif-icon">{iconFor(n.type)}</span>
              <div className="notif-body">
                <p className="notif-msg">{renderMessage(n)}</p>
                <span className="notif-time">{formatTime(n.created_at)}</span>
              </div>
              <span className="notif-dot" />
            </div>
          ))}
        </div>
      )}

      {read.length > 0 && (
        <div className="notif-section">
          <h3 className="notif-section-title">{t('notif.earlier')}</h3>
          {read.map((n) => (
            <div key={n.id} className="notif-item">
              <span className="notif-icon">{iconFor(n.type)}</span>
              <div className="notif-body">
                <p className="notif-msg">{renderMessage(n)}</p>
                <span className="notif-time">{formatTime(n.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
