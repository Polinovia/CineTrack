import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useI18n } from '../lib/i18n'
import {
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
  const { lang, t, typeLabel, statusLabel } = useI18n()
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

  const listOfLabel = lang === 'fr' ? `Liste de ${friend.friend_username}` : `${friend.friend_username}'s list`

  return (
    <div className="title-list">
      <div className="friend-header">
        <button className="back-btn" onClick={onBack}>{t('friendList.back')}</button>
        <h2>{listOfLabel}</h2>
      </div>

      <input
        type="search"
        className="search-input"
        placeholder={t('friendList.search')}
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
              {value === 'tous' ? t('filter.all') : value === 'cartoon' ? 'Cartoon' : typeLabel(value)}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="loading-text">{t('friendList.loading')}</p>}
      {!loading && visible.length === 0 && <p className="empty">{t('friendList.empty')}</p>}

      {!loading && (
        <ul className="titles">
          {visible.map((title) => {
            const ownerRating = title.ratings.find((r) => r.username === friend.friend_username)
            return (
              <li key={title.id}>
                <div className="title-row">
                  <span className="poster">
                    {title.poster_url ? (
                      <img src={title.poster_url} alt="" loading="lazy" />
                    ) : (
                      <span className="poster-fallback">🎬</span>
                    )}
                  </span>
                  <span className="title-name">
                    <span className="title-text">
                      <span className={`type-badge type-${title.type}`}>{typeLabel(title.type)}</span>
                      {title.tmdb_rating !== null && (
                        <span className="tmdb-rating">★ {Number(title.tmdb_rating).toFixed(1)}</span>
                      )}
                      {isUpcoming(title) && <span className="upcoming-badge">{t('titles.upcoming')}</span>}
                      {title.title}
                    </span>
                    {title.description && <span className="description">{title.description}</span>}
                    {title.genres && <span className="genres">{title.genres}</span>}
                    {ownerRating && (
                      <span className="rating-summary">
                        {statusLabel(ownerRating.status)}
                        {ownerRating.score !== null && ` · ${ownerRating.score}/10`}
                        {ownerRating.comment && ` — ${ownerRating.comment}`}
                      </span>
                    )}
                  </span>
                  <span className="row-actions">
                    <button
                      className="copy-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCopy(title)
                      }}
                    >
                      {t('friends.addToList')}
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
