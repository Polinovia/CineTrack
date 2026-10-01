import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from './lib/api'
import { useI18n } from './lib/i18n'
import { isSubscribedToPush, pushSupported, subscribeToPush, unsubscribeFromPush } from './lib/push'
import LoginForm from './components/LoginForm'
import TitleList from './components/TitleList'
import FriendList from './components/FriendList'
import NotificationList from './components/NotificationList'
import Logo from './components/Logo'
import LoadingScreen from './components/LoadingScreen'
import './App.css'

function App() {
  const { lang, setLang, t } = useI18n()
  const [username, setUsername] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [pushOn, setPushOn] = useState(false)
  const [view, setView] = useState<'list' | 'friends' | 'notifications'>('list')
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUsername(data?.username ?? null))
      .finally(() => setChecking(false))
  }, [])

  const fetchUnread = useCallback(() => {
    if (!username) return
    apiFetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.unread ?? 0))
      .catch(() => {})
  }, [username])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  useEffect(() => {
    if (!username || !pushSupported()) return
    isSubscribedToPush().then(setPushOn)
  }, [username])

  async function togglePush() {
    if (pushOn) {
      await unsubscribeFromPush()
      setPushOn(false)
    } else {
      const ok = await subscribeToPush()
      setPushOn(ok)
      if (!ok) alert(t('nav.pushDenied'))
    }
  }

  async function handleLogout() {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    setUsername(null)
    setView('list')
    setMenuOpen(false)
  }

  if (checking) return <LoadingScreen />

  if (!username) {
    return <LoginForm onLoggedIn={setUsername} />
  }

  return (
    <>
      <header className="topbar">
        <span className="brand">
          <Logo size={20} />
          CineTrack
        </span>
        <div className="topbar-right">
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
          <button
            className="notif-bell"
            onClick={() => { setView('notifications'); setUnreadCount(0) }}
            aria-label={t('nav.notifications')}
          >
            🔔
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
        <div className="user-menu-wrap">
          <button className="user-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
            {username} <span className="user-chevron">{menuOpen ? '▲' : '▼'}</span>
          </button>
          {menuOpen && (
            <>
              <div className="user-menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="user-menu">
                <button className={view === 'list' ? 'menu-active' : ''} onClick={() => { setView('list'); setMenuOpen(false) }}>
                  📋 {t('nav.myList')}
                </button>
                <button className={view === 'friends' ? 'menu-active' : ''} onClick={() => { setView('friends'); setMenuOpen(false) }}>
                  👥 {t('nav.friends')}
                </button>
                <hr className="menu-divider" />
                <button onClick={() => { setLang(lang === 'fr' ? 'en' : 'fr'); setMenuOpen(false) }}>
                  🌐 {lang === 'fr' ? 'English' : 'Français'}
                </button>
                {pushSupported() && (
                  <button onClick={() => { togglePush(); setMenuOpen(false) }}>
                    {pushOn ? '🔕 Notifications off' : '🔔 Notifications'}
                  </button>
                )}
                <hr className="menu-divider" />
                <button className="menu-logout" onClick={handleLogout}>
                  {t('nav.logout')}
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </header>

      {view === 'list' && <TitleList myUsername={username} />}
      {view === 'friends' && <FriendList />}
      {view === 'notifications' && <NotificationList onBack={() => setView('list')} />}
    </>
  )
}

export default App
