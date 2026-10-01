import type { Title } from '../types'
import './TitleShelf.css'

type Props = {
  label: string
  titles: Title[]
  onOpen: (id: number) => void
  getSubtitle?: (t: Title) => string
}

export default function TitleShelf({ label, titles, onOpen, getSubtitle }: Props) {
  if (titles.length === 0) return null

  return (
    <div className="shelf">
      <span className="shelf-label">{label}</span>
      <div className="shelf-row">
        {titles.map((t) => (
          <div key={t.id} className="shelf-card">
            <button className="shelf-card-open" onClick={() => onOpen(t.id)}>
              <span className="shelf-poster">
                {t.poster_url ? <img src={t.poster_url} alt="" loading="lazy" /> : '🎬'}
              </span>
              <span className="shelf-title">{t.title}</span>
              {getSubtitle && <span className="shelf-subtitle">{getSubtitle(t)}</span>}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
