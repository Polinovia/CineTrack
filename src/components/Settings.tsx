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
}

export default function Settings({ username, pushOn, onTogglePush, onBack, onLogout }: Props) {
  const { lang, setLang, t } = useI18n()
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

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back" onClick={onBack}>{t('settings.back')}</button>
        <h2>{t('settings.title')}</h2>
      </div>

      <div className="settings-section">
        <h3>{t('settings.account')}</h3>
        <div className="settings-row">
          <span className="settings-label">{t('settings.loggedAs')}</span>
          <span className="settings-value">{username}</span>
        </div>
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
