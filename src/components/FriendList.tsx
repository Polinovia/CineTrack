import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Friend, Title } from '../types'
import FriendTitleList from './FriendTitleList'
import './FriendList.css'

export default function FriendList() {
  const { t } = useI18n()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [addUsername, setAddUsername] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [viewFriend, setViewFriend] = useState<Friend | null>(null)

  useEffect(() => {
    apiFetch('/api/friends')
      .then((res) => res.json())
      .then(setFriends)
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!addUsername.trim()) return
    if (!confirm(`${t('friends.confirmRequest')} ${addUsername.trim()} ?`)) return
    setAddError(null)
    setAdding(true)
    try {
      const res = await apiFetch('/api/friends', {
        method: 'POST',
        body: JSON.stringify({ username: addUsername.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.error === 'user_not_found') setAddError(t('friends.notFound'))
        else if (data?.error === 'cannot_add_self') setAddError(t('friends.cannotSelf'))
        else if (data?.error === 'already_exists') setAddError(t('friends.alreadySent'))
        else setAddError(t('friends.error'))
        return
      }
      const data = await res.json()
      setFriends((prev) => [{ ...data, requester_id: 0 }, ...prev])
      setAddUsername('')
    } finally {
      setAdding(false)
    }
  }

  async function accept(f: Friend) {
    const res = await apiFetch('/api/friends', {
      method: 'PATCH',
      body: JSON.stringify({ friendship_id: f.friendship_id, action: 'accept' }),
    })
    if (res.ok) {
      setFriends((prev) => prev.map((x) => (x.friendship_id === f.friendship_id ? { ...x, status: 'accepted' } : x)))
    }
  }

  async function reject(f: Friend) {
    const res = await apiFetch('/api/friends', {
      method: 'PATCH',
      body: JSON.stringify({ friendship_id: f.friendship_id, action: 'reject' }),
    })
    if (res.ok) {
      setFriends((prev) => prev.filter((x) => x.friendship_id !== f.friendship_id))
    }
  }

  async function removeFriend(f: Friend) {
    if (!confirm(`${t('friends.remove')} ${f.friend_username} ?`)) return
    await apiFetch('/api/friends', {
      method: 'DELETE',
      body: JSON.stringify({ friendship_id: f.friendship_id }),
    })
    setFriends((prev) => prev.filter((x) => x.friendship_id !== f.friendship_id))
  }

  async function copyTitle(titleObj: Title) {
    const res = await apiFetch('/api/titles/copy', {
      method: 'POST',
      body: JSON.stringify({ title_id: titleObj.id }),
    })
    if (res.ok) {
      alert(`« ${titleObj.title} » ${t('friends.addToList')}!`)
    } else {
      const data = await res.json().catch(() => null)
      if (data?.error === 'already_yours') alert(t('friends.alreadyYours'))
      else alert(t('friends.copyError'))
    }
  }

  if (viewFriend) {
    return (
      <FriendTitleList
        friend={viewFriend}
        onBack={() => setViewFriend(null)}
        onCopy={copyTitle}
      />
    )
  }

  const pending = friends.filter((f) => f.status === 'pending' && f.requester_id !== 0 && f.friend_id !== 0)
  const accepted = friends.filter((f) => f.status === 'accepted')

  return (
    <div className="friend-list">
      <form className="add-friend-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder={t('friends.addPlaceholder')}
          value={addUsername}
          onChange={(e) => setAddUsername(e.target.value)}
        />
        <button type="submit" disabled={adding || !addUsername.trim()}>
          {t('friends.add')}
        </button>
      </form>
      {addError && <p className="error">{addError}</p>}

      {loading && <p className="loading-text">{t('friendList.loading')}</p>}

      {pending.length > 0 && (
        <div className="friend-section">
          <h3>{t('friends.pending')}</h3>
          {pending.map((f) => (
            <div key={f.friendship_id} className="friend-row pending">
              <span className="friend-name">{f.friend_username}</span>
              <div className="friend-actions">
                <button className="accept-btn" onClick={() => accept(f)}>{t('friends.accept')}</button>
                <button className="reject-btn" onClick={() => reject(f)}>{t('friends.reject')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {accepted.length > 0 && (
        <div className="friend-section">
          <h3>{t('friends.myFriends')}</h3>
          {accepted.map((f) => (
            <div key={f.friendship_id} className="friend-row">
              <button className="friend-name-btn" onClick={() => setViewFriend(f)}>
                {f.friend_username}
              </button>
              <button className="remove-friend-btn" onClick={() => removeFriend(f)}>{t('friends.remove')}</button>
            </div>
          ))}
        </div>
      )}

      {!loading && friends.length === 0 && (
        <p className="empty">{t('friends.empty')}</p>
      )}
    </div>
  )
}
