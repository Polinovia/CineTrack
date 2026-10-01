import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Title, TitleType } from '../types'
import { IconFilm } from './Icons'
import './AddTitleForm.css'

type Suggestion = {
  tmdb_id: number
  title: string
  year: string | null
  poster_url: string | null
}

type Props = {
  onAdded: (title: Title) => void
}

export default function AddTitleForm({ onAdded }: Props) {
  const { t, typeLabel } = useI18n()
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [type, setType] = useState<TitleType>('film')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Suggestion | null>(null)
  const [showList, setShowList] = useState(false)
  const [adding, setAdding] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const typeOptions: TitleType[] = ['film', 'serie', 'anime']

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (selected || text.trim().length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      const res = await apiFetch(`/api/tmdb-search?q=${encodeURIComponent(text.trim())}&type=${type}`)
      if (res.ok) {
        setSuggestions(await res.json())
        setShowList(true)
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [text, type, selected])

  function handleTextChange(value: string) {
    setText(value)
    setSelected(null)
  }

  async function addTitle(titleText: string, tmdbId?: number) {
    if (!titleText.trim()) return
    setAdding(true)
    setError('')
    try {
      const res = await apiFetch('/api/titles', {
        method: 'POST',
        body: JSON.stringify({
          title: titleText.trim(),
          type,
          ...(tmdbId !== undefined ? { tmdb_id: tmdbId } : {}),
        }),
      })
      if (res.ok) {
        onAdded(await res.json())
        setText('')
        setSelected(null)
        setSuggestions([])
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.error === 'already_in_list') {
          setError(t('add.alreadyInList'))
        }
      }
    } finally {
      setAdding(false)
    }
  }

  function pick(s: Suggestion) {
    setShowList(false)
    addTitle(s.title, s.tmdb_id)
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    await addTitle(text, selected?.tmdb_id)
  }

  return (
    <form className="add-form" onSubmit={handleAdd}>
      <select
        value={type}
        onChange={(e) => {
          setType(e.target.value as TitleType)
          setSelected(null)
        }}
      >
        {typeOptions.map((value) => (
          <option key={value} value={value}>
            {typeLabel(value)}
          </option>
        ))}
      </select>
      <div className="add-form-input">
        <input
          type="text"
          placeholder={t('add.placeholder')}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowList(true)}
          onBlur={() => setTimeout(() => setShowList(false), 150)}
        />
        {showList && suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((s) => (
              <li key={s.tmdb_id}>
                <button type="button" onClick={() => pick(s)}>
                  <span className="suggestion-poster">
                    {s.poster_url ? <img src={s.poster_url} alt="" /> : <IconFilm size={16} />}
                  </span>
                  <span>
                    {s.title}
                    {s.year && <span className="suggestion-year"> ({s.year})</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" className="add-form-submit" disabled={adding || !text.trim()}>
        {t('add.submit')}
      </button>
      {error && <p className="add-form-error">{error}</p>}
    </form>
  )
}
