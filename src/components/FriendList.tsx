import { useEffect, useState, useCallback } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Friend, Title } from '../types'
import FriendTitleList from './FriendTitleList'
import ConfirmDialog from './ConfirmDialog'
import Toast from './Toast'
import './FriendList.css'

export default function FriendList() {
  const { t } = useI18n()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [addUsername, setAddUsername] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [viewFriend, setViewFriend] = useState<Friend | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirmState, setConfirmState] = useState<{ msg: string; action: () => void; danger?: boolean } | null>(null)

  useEffect(() => {
    apiFetch('/api/friends')
      .then((res) => res.json())
      .then(setFriends)
      .finally(() => setLoading(false))
  }, [])

  async function doAdd() {
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
      setFriends((prev) => [{ ...data, is_requester: true }, ...prev])
      setAddUsername('')
    } finally {
      setAdding(false)
    }
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!addUsername.trim()) return
    setConfirmState({
      msg: `${t('friends.confirmRequest')} ${addUsername.trim()} ?`,
      action: doAdd,
    })
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

  function removeFriend(f: Friend) {
    setConfirmState({
      msg: `${t('friends.remove')} ${f.friend_username} ?`,
      danger: true,
      action: async () => {
        await apiFetch('/api/friends', {
          method: 'DELETE',
          body: JSON.stringify({ friendship_id: f.friendship_id }),
        })
        setFriends((prev) => prev.filter((x) => x.friendship_id !== f.friendship_id))
      },
    })
  }

  const copyTitle = useCallback(async (titleObj: Title) => {
    const res = await apiFetch('/api/titles/copy', {
      method: 'POST',
      body: JSON.stringify({ title_id: titleObj.id }),
    })
    if (res.ok) {
      setToast({ msg: `« ${titleObj.title} » ${t('friends.addToList')}!`, type: 'success' })
    } else {
      const data = await res.json().catch(() => null)
      if (data?.error === 'already_yours') setToast({ msg: t('friends.alreadyYours'), type: 'error' })
      else setToast({ msg: t('friends.copyError'), type: 'error' })
    }
  }, [t])

  if (viewFriend) {
    return (
      <FriendTitleList
        friend={viewFriend}
        onBack={() => setViewFriend(null)}
        onCopy={copyTitle}
      />
    )
  }

  const incoming = friends.filter((f) => f.status === 'pending' && !f.is_requester)
  const outgoing = friends.filter((f) => f.status === 'pending' && f.is_requester)
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

      {incoming.length > 0 && (
        <div className="friend-section">
          <h3>{t('friends.pending')}</h3>
          {incoming.map((f) => (
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

      {outgoing.length > 0 && (
        <div className="friend-section">
          <h3>{t('friends.sent')}</h3>
          {outgoing.map((f) => (
            <div key={f.friendship_id} className="friend-row pending">
              <span className="friend-name">{f.friend_username}</span>
              <span className="friend-waiting">{t('friends.waiting')}</span>
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

      {confirmState && (
        <ConfirmDialog
          message={confirmState.msg}
          danger={confirmState.danger}
          onConfirm={() => { confirmState.action(); setConfirmState(null) }}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
