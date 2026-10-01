import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../lib/api'
import Logo from './Logo'
import './LoginForm.css'

type Props = {
  onLoggedIn: (username: string) => void
}

export default function LoginForm({ onLoggedIn }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, register: isRegister || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        if (res.status === 429) {
          const until = data?.locked_until ? new Date(data.locked_until) : null
          const minutes = until ? Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000)) : 15
          setError(`Trop de tentatives. Réessayez dans ${minutes} min.`)
        } else if (data?.error === 'password_too_short') {
          setError(`Mot de passe : au moins ${data.min_length ?? 8} caractères.`)
        } else if (data?.error === 'username_taken') {
          setError('Ce pseudo est déjà pris.')
        } else if (data?.error === 'invalid_username') {
          setError('Pseudo : entre 2 et 20 caractères.')
        } else {
          setError('Pseudo ou mot de passe incorrect.')
        }
        return
      }
      const data = await res.json()
      onLoggedIn(data.username)
    } catch {
      setError("Impossible de se connecter, réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <Logo size={32} />
      <span className="eyebrow">My Watchlist</span>
      <h1>{isRegister ? 'Créer un compte' : 'Se connecter'}</h1>
      <label>
        Pseudo
        <input
          type="text"
          autoComplete="username"
          placeholder="Ton pseudo"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <label>
        Mot de passe
        <input
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={isRegister ? 8 : 4}
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? '…' : isRegister ? 'Créer mon compte' : 'Entrer'}
      </button>
      <button type="button" className="switch-mode" onClick={() => setIsRegister((v) => !v)}>
        {isRegister ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
      </button>
    </form>
  )
}
