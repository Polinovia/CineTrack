import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'
import {
  STATUS_LABELS,
  STATUS_ORDER,
  TYPE_LABELS,
  isUpcoming,
  type Title,
  type TitleType,
} from '../types'
import TitleDetailModal from './TitleDetailModal'
import AddTitleForm from './AddTitleForm'
import NowWatchingCard from './NowWatchingCard'
import TitleShelf from './TitleShelf'
import './TitleList.css'

type TypeFilter = 'tous' | TitleType | 'cartoon'

function isCartoon(t: Title) {
  return t.type === 'film' && !!t.genres?.toLowerCase().includes('animation')
}

type SortMode = 'recent' | 'title' | 'rating'

const SORT_LABELS: Record<SortMode, string> = {
  recent: 'Récemment ajouté',
  title: 'Titre (A-Z)',
  rating: 'Note (meilleure d'abord)',
}

type Props = {
  myUsername: string
}

export default function TitleList({ myUsername }: Props) {
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

  async function cycleMyStatus(t: Title) {
    const mine = t.ratings.find((r) => r.username === myUsername)
    const current = mine?.status ?? 'a_voir'
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
    updateTitle({
      ...t,
      ratings: [
        ...t.ratings.filter((r) => r.username !== myUsername),
        {
          username: myUsername,
          status: next,
          score: mine?.score ?? null,
          comment: mine?.comment ?? null,
          rated_at: new Date().toISOString(),
        },
      ],
    })
    await apiFetch(`/api/titles/${t.id}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ status: next }),
    })
  }

  async function remove(t: Title) {
    if (!confirm(`Retirer « ${t.title} » de la liste ?`)) return
    setTitles((prev) => prev.filter((x) => x.id !== t.id))
    await apiFetch(`/api/titles/${t.id}`, { method: 'DELETE' })
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

  function ratingSummary(t: Title) {
    const mine = t.ratings.find((r) => r.username === myUsername)
    if (!mine) return ''
    const parts: string[] = [STATUS_LABELS[mine.status]]
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
            label="À venir"
            titles={upcomingTitles}
            onOpen={setOpenId}
            getSubtitle={(t) => formatReleaseDate(t.release_date!)}
          />
        </>
      )}

      <input
        type="search"
        className="search-input"
        placeholder="Rechercher un titre…"
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
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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
      {!loading && visible.length === 0 && <p className="empty">Rien ici pour l'instant.</p>}

      {!loading && (
      <ul className="titles">
        {visible.map((t) => {
          const myStatus = t.ratings.find((r) => r.username === myUsername)?.status ?? 'a_voir'
          return (
            <li key={t.id}>
              <div className="title-row" onClick={() => setOpenId(t.id)}>
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
                  <span className="rating-summary">{ratingSummary(t)}</span>
                </span>
                <span className="row-actions">
                  <button
                    className={`status-pill status-${myStatus}`}
                    title="Ton statut (clique pour changer)"
                    onClick={(e) => {
                      e.stopPropagation()
                      cycleMyStatus(t)
                    }}
                  >
                    {STATUS_LABELS[myStatus]}
                  </button>
                </span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(t)
                  }}
                >
                  Supprimer
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
    </div>
  )
}
