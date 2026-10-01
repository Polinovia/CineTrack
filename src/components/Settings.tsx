import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { pushSupported } from '../lib/push'
import { IconEye, IconEyeOff } from './Icons'
import './Settings.css'

type Props = {
  username: string
  pushOn: boolean
  onTogglePush: () => void
  onBack: () => void
  onLogout: () => void
  onUsernameChanged: (name: string) => void
}

export default function Settings({ username, pushOn, onTogglePush, onBack, onLogout, onUsernameChanged }: Props) {
  const { lang, setLang, t } = useI18n()
  const [newUsername, setNewUsername] = useState(username)
  const [usernameMsg, setUsernameMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setPwdMsg(null)
    setPwdLoading(true)
    try {
      const res = await apiFetch('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      })
      if (res.ok) {
        setPwdMsg({ type: 'ok', text: t('settings.pwdSuccess') })
        setCurrentPwd('')
        setNewPwd('')
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.error === 'wrong_password') {
          setPwdMsg({ type: 'err', text: t('settings.pwdWrong') })
        } else if (data.error === 'password_too_short') {
          setPwdMsg({ type: 'err', text: `${t('settings.pwdMin')} ${data.min_length ?? 8} ${lang === 'fr' ? 'caractères' : 'characters'}` })
        } else {
          setPwdMsg({ type: 'err', text: t('friends.error') })
        }
      }
    } catch {
      setPwdMsg({ type: 'err', text: t('friends.error') })
    } finally {
      setPwdLoading(false)
    }
  }

  async function handleChangeUsername(e: FormEvent) {
    e.preventDefault()
    if (newUsername.trim() === username) return
    setUsernameMsg(null)
    setUsernameLoading(true)
    try {
      const res = await apiFetch('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ new_username: newUsername.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        onUsernameChanged(data.username)
        setUsernameMsg({ type: 'ok', text: t('settings.usernameSuccess') })
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.error === 'username_taken') {
          setUsernameMsg({ type: 'err', text: t('login.error.usernameTaken') })
        } else if (data.error === 'invalid_username') {
          setUsernameMsg({ type: 'err', text: t('login.error.invalidUsername') })
        } else {
          setUsernameMsg({ type: 'err', text: t('friends.error') })
        }
      }
    } catch {
      setUsernameMsg({ type: 'err', text: t('friends.error') })
    } finally {
      setUsernameLoading(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back" onClick={onBack}>{t('settings.back')}</button>
        <h2>{t('settings.title')}</h2>
      </div>

      <div className="settings-section">
        <h3>{t('settings.account')}</h3>
        <form className="settings-username-form" onSubmit={handleChangeUsername}>
          <label>
            {t('settings.username')}
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              minLength={2}
              maxLength={20}
              required
            />
          </label>
          {usernameMsg && (
            <p className={usernameMsg.type === 'ok' ? 'settings-pwd-ok' : 'settings-pwd-err'}>{usernameMsg.text}</p>
          )}
          {newUsername.trim() !== username && (
            <button type="submit" className="settings-pwd-submit" disabled={usernameLoading || !newUsername.trim()}>
              {usernameLoading ? '…' : t('settings.saveUsername')}
            </button>
          )}
        </form>
      </div>

      <div className="settings-section">
        <h3>{t('settings.language')}</h3>
        <div className="settings-row">
          <button
            className={`settings-lang-btn ${lang === 'fr' ? 'active' : ''}`}
            onClick={() => setLang('fr')}
          >
            Français
          </button>
          <button
            className={`settings-lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
          >
            English
          </button>
        </div>
      </div>

      {pushSupported() && (
        <div className="settings-section">
          <h3>{t('settings.pushNotifications')}</h3>
          <div className="settings-row">
            <span className="settings-label">
              {pushOn ? t('settings.pushOn') : t('settings.pushOff')}
            </span>
            <button className="settings-toggle" onClick={onTogglePush}>
              <span className={`settings-toggle-track ${pushOn ? 'on' : ''}`}>
                <span className="settings-toggle-thumb" />
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="settings-section">
        <h3>{t('settings.changePassword')}</h3>
        <form className="settings-pwd-form" onSubmit={handleChangePassword}>
          <label>
            {t('settings.currentPwd')}
            <div className="password-wrap">
              <input
                type={showCurrentPwd ? 'text' : 'password'}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" className="password-eye" onClick={() => setShowCurrentPwd((v) => !v)} tabIndex={-1}>
                {showCurrentPwd ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
          </label>
          <label>
            {t('settings.newPwd')}
            <div className="password-wrap">
              <input
                type={showNewPwd ? 'text' : 'password'}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button type="button" className="password-eye" onClick={() => setShowNewPwd((v) => !v)} tabIndex={-1}>
                {showNewPwd ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
          </label>
          {pwdMsg && (
            <p className={pwdMsg.type === 'ok' ? 'settings-pwd-ok' : 'settings-pwd-err'}>{pwdMsg.text}</p>
          )}
          <button type="submit" className="settings-pwd-submit" disabled={pwdLoading || !currentPwd || !newPwd}>
            {pwdLoading ? '…' : t('settings.changePwdBtn')}
          </button>
        </form>
      </div>

      <div className="settings-section">
        <button className="settings-logout" onClick={onLogout}>
          {t('nav.logout')}
        </button>
      </div>
    </div>
  )
}
