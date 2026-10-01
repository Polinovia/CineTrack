import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { IconFilm } from './Icons'
import {
  STATUS_ORDER,
  isUpcoming,
  type Title,
  type TitleStatus,
} from '../types'
import Modal from './Modal'
import './TitleDetailModal.css'

const COMMENT_MAX_LENGTH = 300

type Props = {
  title: Title
  myUsername: string
  onClose: () => void
  onChange: (updated: Title) => void
}

export default function TitleDetailModal({ title, myUsername, onClose, onChange }: Props) {
  const { lang, t, typeLabel, statusLabel } = useI18n()
  const myRating = title.ratings.find((r) => r.username === myUsername)

  const [status, setStatus] = useState<TitleStatus>(myRating?.status ?? 'a_voir')
  const [score, setScore] = useState(myRating?.score ?? 8)
  const [comment, setComment] = useState(myRating?.comment ?? '')
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [editingSeasonCount, setEditingSeasonCount] = useState(false)
  const [seasonCountInput, setSeasonCountInput] = useState(String(title.season_count ?? ''))

  function applyMyRating(patch: { status?: TitleStatus; score?: number | null; comment?: string | null }) {
    const ratings = [
      ...title.ratings.filter((r) => r.username !== myUsername),
      {
        username: myUsername,
        status: patch.status ?? myRating?.status ?? 'a_voir',
        score: 'score' in patch ? patch.score! : (myRating?.score ?? null),
        comment: 'comment' in patch ? patch.comment! : (myRating?.comment ?? null),
        rated_at: new Date().toISOString(),
      },
    ]
    onChange({ ...title, ratings })
  }

  async function handleStatusChange(next: TitleStatus) {
    setStatus(next)
    applyMyRating({ status: next })
    await apiFetch(`/api/titles/${title.id}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ status: next }),
    })
  }

  async function handleSaveRating(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const trimmedComment = comment.trim() || null
      const res = await apiFetch(`/api/titles/${title.id}/rating`, {
        method: 'PUT',
        body: JSON.stringify({ status, score, comment: trimmedComment }),
      })
      if (res.ok) {
        applyMyRating({ status, score, comment: trimmedComment })
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleNowWatching() {
    const next = !title.now_watching
    onChange({ ...title, now_watching: next })
    await apiFetch(`/api/titles/${title.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ now_watching: next }),
    })
  }

  const isFilm = title.type === 'film'
  const unitLabel = isFilm ? t('detail.filmsWatched') : t('detail.seasonsWatched')
  const unitPrefix = isFilm ? 'F' : 'S'

  const mySeasons = title.seasons_watched.find((s) => s.username === myUsername)?.seasons ?? []

  async function toggleSeason(n: number) {
    const watched = !mySeasons.includes(n)
    const nextSeasons = watched ? [...mySeasons, n] : mySeasons.filter((s) => s !== n)
    const optimistic = [
      ...title.seasons_watched.filter((s) => s.username !== myUsername),
      { username: myUsername, seasons: nextSeasons },
    ]
    onChange({ ...title, seasons_watched: optimistic })
    const res = await apiFetch(`/api/titles/${title.id}/season`, {
      method: 'PUT',
      body: JSON.stringify({ season_number: n, watched }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.seasons_watched) {
        onChange({ ...title, seasons_watched: data.seasons_watched })
      }
    }
  }

  async function saveSeasonCount(e: FormEvent) {
    e.preventDefault()
    const n = Number(seasonCountInput)
    if (!Number.isInteger(n) || n < 1) return
    onChange({ ...title, season_count: n })
    setEditingSeasonCount(false)
    await apiFetch(`/api/titles/${title.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ season_count: n, metadata_override: true }),
    })
  }

  async function markAllSeasonsWatched() {
    if (title.season_count === null) return
    const missing = Array.from({ length: title.season_count }, (_, i) => i + 1).filter(
      (n) => !mySeasons.includes(n),
    )
    if (missing.length === 0) return
    const nextSeasons = [...mySeasons, ...missing]
    const seasons_watched = [
      ...title.seasons_watched.filter((s) => s.username !== myUsername),
      { username: myUsername, seasons: nextSeasons },
    ]
    onChange({ ...title, seasons_watched })
    await Promise.all(
      missing.map((n) =>
        apiFetch(`/api/titles/${title.id}/season`, {
          method: 'PUT',
          body: JSON.stringify({ season_number: n, watched: true }),
        }),
      ),
    )
  }

  function sagaOrSeasonText() {
    if (title.season_count === null) return null
    const n = title.season_count
    const s = n > 1 ? 's' : ''
    if (isFilm) {
      return lang === 'fr' ? `${n} film${s} dans la saga` : `${n} film${s} in the saga`
    }
    return lang === 'fr' ? `${n} saison${s}` : `${n} season${s}`
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="detail">
       <div className="detail-grid">
        <span className="detail-poster">
          {title.poster_url ? (
            <img src={title.poster_url} alt="" />
          ) : (
            <span className="detail-poster-fallback"><IconFilm size={28} /></span>
          )}
        </span>
        <div className="detail-body">
          <div className="detail-heading">
            <div className="detail-badges">
              <span className={`type-badge type-${title.type}`}>{typeLabel(title.type)}</span>
              {title.tmdb_rating !== null && (
                <span className="tmdb-rating">★ {Number(title.tmdb_rating).toFixed(1)}</span>
              )}
              {isUpcoming(title) && <span className="upcoming-badge">{t('titles.upcoming')}</span>}
            </div>
            <h2>{title.title}</h2>
            {title.genres && <span className="genres">{title.genres}</span>}
            {title.season_count !== null && (
              <span className="meta-line">
                {sagaOrSeasonText()}
                {title.episode_count !== null && ` · ${title.episode_count} ${lang === 'fr' ? 'épisodes' : 'episodes'}`}
              </span>
            )}
          </div>

        <div className="detail-rest">
        {title.trailer_url && (
          <a
            className="trailer-link"
            href={title.trailer_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('detail.trailer')}
          </a>
        )}
        {title.description && <p className="detail-description">{title.description}</p>}

        <div className="quick-actions">
          <button
            type="button"
            className={`now-watching-toggle ${title.now_watching ? 'active' : ''}`}
            onClick={toggleNowWatching}
          >
            {title.now_watching ? `📌 ${t('detail.nowWatchingOn')}` : `📌 ${t('detail.nowWatchingOff')}`}
          </button>
        </div>

        <div className="detail-section">
          <h3>{t('detail.myReview')}</h3>
          <div className="status-row">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                className={`status-choice status-${s} ${status === s ? 'active' : ''}`}
                onClick={() => handleStatusChange(s)}
                type="button"
              >
                {statusLabel(s)}
              </button>
            ))}
          </div>
          <form className="my-rating" onSubmit={handleSaveRating}>
            <label className="score-label">
              {t('detail.myScore')}
              <select value={score} onChange={(e) => setScore(Number(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}/10
                  </option>
                ))}
              </select>
            </label>
            <textarea
              placeholder={t('detail.commentPlaceholder')}
              value={comment}
              maxLength={COMMENT_MAX_LENGTH}
              onChange={(e) => setComment(e.target.value)}
            />
            <span className="comment-counter">
              {comment.length}/{COMMENT_MAX_LENGTH}
            </span>
            <button type="submit" className={justSaved ? 'saved' : ''} disabled={saving}>
              {justSaved ? t('detail.saved') : saving ? '…' : myRating?.score ? t('detail.update') : t('detail.rate')}
            </button>
          </form>

          {title.season_count !== null && (
            <div className="season-picker">
              <div className="season-picker-head">
                <span className="season-picker-label">{unitLabel}</span>
                <div className="season-picker-actions">
                  <button
                    type="button"
                    className="season-check-all"
                    onClick={markAllSeasonsWatched}
                  >
                    {t('detail.checkAll')}
                  </button>
                  <button
                    type="button"
                    className="season-edit-btn"
                    onClick={() => setEditingSeasonCount((v) => !v)}
                  >
                    ✎
                  </button>
                </div>
              </div>
              {editingSeasonCount && (
                <form className="season-count-edit" onSubmit={saveSeasonCount}>
                  <input
                    type="number"
                    min={1}
                    value={seasonCountInput}
                    onChange={(e) => setSeasonCountInput(e.target.value)}
                  />
                  <button type="submit">{t('detail.fix')}</button>
                </form>
              )}
              <div className="season-chips">
                {Array.from({ length: title.season_count }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`season-chip ${mySeasons.includes(n) ? 'active' : ''}`}
                    onClick={() => toggleSeason(n)}
                  >
                    {unitPrefix}
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
        </div>
       </div>
      </div>
    </Modal>
  )
}
