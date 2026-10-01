import type { Title } from '../types'
import { useI18n } from '../lib/i18n'
import './FeatureCard.css'

type Props = {
  title: Title | null
  myUsername: string
  onOpen: (id: number) => void
}

export default function NowWatchingCard({ title, myUsername, onOpen }: Props) {
  const { t, statusLabel } = useI18n()

  if (!title) {
    return (
      <div className="feature-card empty">
        <span className="feature-empty-text">{t('now.empty')}</span>
      </div>
    )
  }

  const myRating = title.ratings.find((r) => r.username === myUsername)

  return (
    <button className="feature-card" onClick={() => onOpen(title.id)}>
      <span className="feature-poster">
        {title.poster_url ? <img src={title.poster_url} alt="" loading="lazy" /> : '🎬'}
      </span>
      <span className="feature-body">
        <span className="feature-label">{t('now.label')}</span>
        <span className="feature-title">{title.title}</span>
        {myRating && (
          <span className="feature-viewers">
            {statusLabel(myRating.status)}
            {myRating.score !== null && ` · ${myRating.score}/10`}
          </span>
        )}
      </span>
    </button>
  )
}
