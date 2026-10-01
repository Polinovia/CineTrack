import { useEffect, useState } from 'react'
import { apiFetch } from './lib/api'
import { isSubscribedToPush, pushSupported, subscribeToPush, unsubscribeFromPush } from './lib/push'
import LoginForm from './components/LoginForm'
import TitleList from './components/TitleList'
import FriendList from './components/FriendList'
import Logo from './components/Logo'
import LoadingScreen from './components/LoadingScreen'
import './App.css'

function App() {
  const [username, setUsername] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [pushOn, setPushOn] = useState(false)
  const [view, setView] = useState<'list' | 'friends'>('list')

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUsername(data?.username ?? null))
      .finally(() => setChecking(false))
  }, [])

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
      if (!ok) alert('Notifications refusées ou indisponibles sur cet appareil.')
    }
  }

  async function handleLogout() {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    setUsername(null)
    setView('list')
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
          My Watchlist
        </span>
        <div className="who">
          {pushSupported() && (
            <button
              className={`push-toggle ${pushOn ? 'active' : ''}`}
              onClick={togglePush}
              title={pushOn ? 'Désactiver les notifications' : 'Activer les notifications'}
            >
              {pushOn ? '🔔' : '🔕'}
            </button>
          )}
          <nav className="nav-tabs">
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
              Ma liste
            </button>
            <button className={view === 'friends' ? 'active' : ''} onClick={() => setView('friends')}>
              Amis
            </button>
          </nav>
          <span className="username">{username}</span>
          <button className="logout" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </header>
      {view === 'list' && <TitleList myUsername={username} />}
      {view === 'friends' && <FriendList />}
    </>
  )
}

export default App
