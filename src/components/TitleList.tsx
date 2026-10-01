import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import { useI18n, type TKey } from '../lib/i18n'
import { IconFilm } from './Icons'
import {
  STATUS_ORDER,
  isUpcoming,
  type Title,
  type TitleType,
} from '../types'
import TitleDetailModal from './TitleDetailModal'
import AddTitleForm from './AddTitleForm'
import NowWatchingCard from './NowWatchingCard'
import TitleShelf from './TitleShelf'
import ConfirmDialog from './ConfirmDialog'
import './TitleList.css'

type TypeFilter = 'tous' | TitleType | 'cartoon'

function isCartoon(t: Title) {
  return t.type === 'film' && !!t.genres?.toLowerCase().includes('animation')
}

type SortMode = 'recent' | 'title' | 'rating'

const SORT_KEYS: Record<SortMode, TKey> = {
  recent: 'sort.recent',
  title: 'sort.title',
  rating: 'sort.rating',
}

type Props = {
  myUsername: string
}

export default function TitleList({ myUsername }: Props) {
  const { t, typeLabel, statusLabel } = useI18n()
  const [titles, setTitles] = useState<Title[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TypeFilter>('tous')
  const [sort, setSort] = useState<SortMode>('recent')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    apiFetch('/api/titles')
      .then((res) => res.json())
      .then(setTitles)
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    const byType =
      filter === 'tous'
        ? titles
        : filter === 'cartoon'
          ? titles.filter(isCartoon)
          : titles.filter((t) => t.type === filter)
    const q = query.trim().toLowerCase()
    const filtered = q ? byType.filter((t) => t.title.toLowerCase().includes(q)) : byType
    const sorted = [...filtered]
    if (sort === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'fr'))
    } else if (sort === 'rating') {
      sorted.sort((a, b) => (b.tmdb_rating ?? -1) - (a.tmdb_rating ?? -1))
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    return sorted
  }, [titles, filter, sort, query])

  const openTitle = titles.find((t) => t.id === openId) ?? null

  const nowWatching = titles.find((t) => t.now_watching) ?? null

  const upcomingTitles = useMemo(() => {
    return titles
      .filter(isUpcoming)
      .sort((a, b) => new Date(a.release_date!).getTime() - new Date(b.release_date!).getTime())
  }, [titles])

  function formatReleaseDate(dateStr: string) {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(dateStr),
    )
  }

  async function cycleMyStatus(title: Title) {
    const mine = title.ratings.find((r) => r.username === myUsername)
    const current = mine?.status ?? 'a_voir'
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
    updateTitle({
      ...title,
      ratings: [
        ...title.ratings.filter((r) => r.username !== myUsername),
        {
          username: myUsername,
          status: next,
          score: mine?.score ?? null,
          comment: mine?.comment ?? null,
          rated_at: new Date().toISOString(),
        },
      ],
    })
    await apiFetch(`/api/titles/${title.id}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ status: next }),
    })
  }

  const [confirmState, setConfirmState] = useState<{ msg: string; action: () => void } | null>(null)

  function remove(title: Title) {
    setConfirmState({
      msg: `${t('titles.delete')} « ${title.title} » ?`,
      action: async () => {
        setTitles((prev) => prev.filter((x) => x.id !== title.id))
        await apiFetch(`/api/titles/${title.id}`, { method: 'DELETE' })
      },
    })
  }

  function updateTitle(updated: Title) {
    setTitles((prev) =>
      prev.map((x) => {
        if (x.id === updated.id) return updated
        if (updated.now_watching && x.now_watching) return { ...x, now_watching: false }
        return x
      }),
    )
  }

  function ratingSummary(title: Title) {
    const mine = title.ratings.find((r) => r.username === myUsername)
    if (!mine) return ''
    const parts: string[] = [statusLabel(mine.status)]
    if (mine.score !== null) parts.push(`${mine.score}/10`)
    return parts.join(' · ')
  }

  return (
    <div className="title-list">
      <AddTitleForm onAdded={(created) => setTitles((prev) => [created, ...prev])} />

      {!loading && (
        <>
          <div className="feature-row">
            <NowWatchingCard
              title={nowWatching}
              myUsername={myUsername}
              onOpen={setOpenId}
            />
          </div>
          <TitleShelf
            label={t('titles.upcoming')}
            titles={upcomingTitles}
            onOpen={setOpenId}
            getSubtitle={(title) => formatReleaseDate(title.release_date!)}
          />
        </>
      )}

      <input
        type="search"
        className="search-input"
        placeholder={t('titles.search')}
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
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
          {(Object.keys(SORT_KEYS) as SortMode[]).map((value) => (
            <option key={value} value={value}>
              {t(SORT_KEYS[value])}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <ul className="titles">
          {[0, 1, 2].map((i) => (
            <li key={i} className="skeleton-row">
              <span className="skeleton-poster" />
              <span className="skeleton-lines">
                <span className="skeleton-line short" />
                <span className="skeleton-line" />
                <span className="skeleton-line" />
              </span>
            </li>
          ))}
        </ul>
      )}
      {!loading && visible.length === 0 && <p className="empty">{t('titles.empty')}</p>}

      {!loading && (
      <ul className="titles">
        {visible.map((title) => {
          const myStatus = title.ratings.find((r) => r.username === myUsername)?.status ?? 'a_voir'
          return (
            <li key={title.id}>
              <div className="title-row" onClick={() => setOpenId(title.id)}>
                <span className="poster">
                  {title.poster_url ? (
                    <img src={title.poster_url} alt="" loading="lazy" />
                  ) : (
                    <span className="poster-fallback"><IconFilm size={20} /></span>
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
                  <span className="rating-summary">{ratingSummary(title)}</span>
                </span>
                <span className="row-actions">
                  <button
                    className={`status-pill status-${myStatus}`}
                    title={t('titles.statusHint')}
                    onClick={(e) => {
                      e.stopPropagation()
                      cycleMyStatus(title)
                    }}
                  >
                    {statusLabel(myStatus)}
                  </button>
                </span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(title)
                  }}
                >
                  {t('titles.delete')}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      )}

      {openTitle && (
        <TitleDetailModal
          title={openTitle}
          myUsername={myUsername}
          onClose={() => setOpenId(null)}
          onChange={updateTitle}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          message={confirmState.msg}
          danger
          onConfirm={() => { confirmState.action(); setConfirmState(null) }}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  )
}
