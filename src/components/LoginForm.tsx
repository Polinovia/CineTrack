import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../lib/api'
import { useI18n } from '../lib/i18n'
import Logo from './Logo'
import './LoginForm.css'

type Props = {
  onLoggedIn: (username: string) => void
}

export default function LoginForm({ onLoggedIn }: Props) {
  const { lang, setLang, t } = useI18n()
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
          setError(`${t('login.error.locked')} ${minutes} min.`)
        } else if (data?.error === 'password_too_short') {
          setError(`${t('login.password')}: min ${data.min_length ?? 8} ${lang === 'fr' ? 'caractères' : 'characters'}.`)
        } else if (data?.error === 'username_taken') {
          setError(t('login.error.usernameTaken'))
        } else if (data?.error === 'invalid_username') {
          setError(t('login.error.invalidUsername'))
        } else {
          setError(t('login.error.invalid'))
        }
        return
      }
      const data = await res.json()
      onLoggedIn(data.username)
    } catch {
      setError(t('login.error.network'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <button type="button" className="lang-toggle login-lang" onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}>
        {lang === 'fr' ? 'EN' : 'FR'}
      </button>
      <Logo size={32} />
      <span className="eyebrow">CineTrack</span>
      <h1>{isRegister ? t('login.createAccount') : t('login.signIn')}</h1>
      <label>
        {t('login.username')}
        <input
          type="text"
          autoComplete="username"
          placeholder={t('login.usernamePlaceholder')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <label>
        {t('login.password')}
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
        {loading ? '…' : isRegister ? t('login.submitRegister') : t('login.submitLogin')}
      </button>
      <button type="button" className="switch-mode" onClick={() => setIsRegister((v) => !v)}>
        {isRegister ? t('login.switchToLogin') : t('login.switchToRegister')}
      </button>
    </form>
  )
}
