import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import {
  STATUS_LABELS,
  TYPE_LABELS,
  isUpcoming,
  type Friend,
  type Title,
  type TitleType,
} from '../types'
import './TitleList.css'

type TypeFilter = 'tous' | TitleType | 'cartoon'

function isCartoon(t: Title) {
  return t.type === 'film' && !!t.genres?.toLowerCase().includes('animation')
}

type Props = {
  friend: Friend
  onBack: () => void
  onCopy: (t: Title) => void
}

export default function FriendTitleList({ friend, onBack, onCopy }: Props) {
  const [titles, setTitles] = useState<Title[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TypeFilter>('tous')
  const [query, setQuery] = useState('')

  useEffect(() => {
    apiFetch(`/api/titles?user_id=${friend.friend_id}`)
      .then((res) => res.json())
      .then(setTitles)
      .finally(() => setLoading(false))
  }, [friend.friend_id])

  const visible = useMemo(() => {
    const byType =
      filter === 'tous'
        ? titles
        : filter === 'cartoon'
          ? titles.filter(isCartoon)
          : titles.filter((t) => t.type === filter)
    const q = query.trim().toLowerCase()
    return q ? byType.filter((t) => t.title.toLowerCase().includes(q)) : byType
  }, [titles, filter, query])

  return (
    <div className="title-list">
      <div className="friend-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h2>Liste de {friend.friend_username}</h2>
      </div>

      <input
        type="search"
        className="search-input"
        placeholder="Rechercher…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="filters-row">
        <div className="filters">
          {(['tous', 'film', 'serie', 'anime', 'cartoon'] as TypeFilter[]).map((value) => (
            <button
              key={value}
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
            >
              {value === 'tous' ? 'Tous' : value === 'cartoon' ? 'Cartoon' : TYPE_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="loading-text">Chargement…</p>}
      {!loading && visible.length === 0 && <p className="empty">Aucun titre.</p>}

      {!loading && (
        <ul className="titles">
          {visible.map((t) => {
            const ownerRating = t.ratings.find((r) => r.username === friend.friend_username)
            return (
              <li key={t.id}>
                <div className="title-row">
                  <span className="poster">
                    {t.poster_url ? (
                      <img src={t.poster_url} alt="" loading="lazy" />
                    ) : (
                      <span className="poster-fallback">🎬</span>
                    )}
                  </span>
                  <span className="title-name">
                    <span className="title-text">
                      <span className={`type-badge type-${t.type}`}>{TYPE_LABELS[t.type]}</span>
                      {t.tmdb_rating !== null && (
                        <span className="tmdb-rating">★ {Number(t.tmdb_rating).toFixed(1)}</span>
                      )}
                      {isUpcoming(t) && <span className="upcoming-badge">À venir</span>}
                      {t.title}
                    </span>
                    {t.description && <span className="description">{t.description}</span>}
                    {t.genres && <span className="genres">{t.genres}</span>}
                    {ownerRating && (
                      <span className="rating-summary">
                        {STATUS_LABELS[ownerRating.status]}
                        {ownerRating.score !== null && ` · ${ownerRating.score}/10`}
                        {ownerRating.comment && ` — ${ownerRating.comment}`}
                      </span>
                    )}
                  </span>
                  <span className="row-actions">
                    <button
                      className="copy-btn"
                      title="Ajouter à ma liste"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCopy(t)
                      }}
                    >
                      + Ma liste
                    </button>
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
