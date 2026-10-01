import { STATUS_LABELS, type Title } from '../types'
import './FeatureCard.css'

type Props = {
  title: Title | null
  myUsername: string
  onOpen: (id: number) => void
}

export default function NowWatchingCard({ title, myUsername, onOpen }: Props) {
  if (!title) {
    return (
      <div className="feature-card empty">
        <span className="feature-empty-text">Épingle un titre depuis sa fiche pour le voir ici</span>
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
        <span className="feature-label">En ce moment</span>
        <span className="feature-title">{title.title}</span>
        {myRating && (
          <span className="feature-viewers">
            {STATUS_LABELS[myRating.status]}
            {myRating.score !== null && ` · ${myRating.score}/10`}
          </span>
        )}
      </span>
    </button>
  )
}
