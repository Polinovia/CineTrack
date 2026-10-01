import { useI18n } from '../lib/i18n'
import { pushSupported } from '../lib/push'
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
        <button className="settings-logout" onClick={onLogout}>
          {t('nav.logout')}
        </button>
      </div>
    </div>
  )
}
