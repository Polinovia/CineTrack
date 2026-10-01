import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../lib/api'
import type { Friend, Title } from '../types'
import FriendTitleList from './FriendTitleList'
import './FriendList.css'

export default function FriendList() {
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
    setAddError(null)
    setAdding(true)
    try {
      const res = await apiFetch('/api/friends', {
        method: 'POST',
        body: JSON.stringify({ username: addUsername.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.error === 'user_not_found') setAddError('Utilisateur introuvable.')
        else if (data?.error === 'cannot_add_self') setAddError('Tu ne peux pas t\'ajouter toi-même.')
        else if (data?.error === 'already_exists') setAddError('Demande déjà envoyée.')
        else setAddError('Erreur, réessaie.')
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
    if (!confirm(`Retirer ${f.friend_username} de tes amis ?`)) return
    await apiFetch('/api/friends', {
      method: 'DELETE',
      body: JSON.stringify({ friendship_id: f.friendship_id }),
    })
    setFriends((prev) => prev.filter((x) => x.friendship_id !== f.friendship_id))
  }

  async function copyTitle(t: Title) {
    const res = await apiFetch('/api/titles/copy', {
      method: 'POST',
      body: JSON.stringify({ title_id: t.id }),
    })
    if (res.ok) {
      alert(`« ${t.title} » ajouté à ta liste !`)
    } else {
      const data = await res.json().catch(() => null)
      if (data?.error === 'already_yours') alert('Ce titre est déjà dans ta liste.')
      else alert('Erreur lors de la copie.')
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
          placeholder="Ajouter un ami par pseudo…"
          value={addUsername}
          onChange={(e) => setAddUsername(e.target.value)}
        />
        <button type="submit" disabled={adding || !addUsername.trim()}>
          Ajouter
        </button>
      </form>
      {addError && <p className="error">{addError}</p>}

      {loading && <p className="loading-text">Chargement…</p>}

      {pending.length > 0 && (
        <div className="friend-section">
          <h3>Demandes en attente</h3>
          {pending.map((f) => (
            <div key={f.friendship_id} className="friend-row pending">
              <span className="friend-name">{f.friend_username}</span>
              <div className="friend-actions">
                <button className="accept-btn" onClick={() => accept(f)}>Accepter</button>
                <button className="reject-btn" onClick={() => reject(f)}>Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {accepted.length > 0 && (
        <div className="friend-section">
          <h3>Mes amis</h3>
          {accepted.map((f) => (
            <div key={f.friendship_id} className="friend-row">
              <button className="friend-name-btn" onClick={() => setViewFriend(f)}>
                {f.friend_username}
              </button>
              <button className="remove-friend-btn" onClick={() => removeFriend(f)}>Retirer</button>
            </div>
          ))}
        </div>
      )}

      {!loading && friends.length === 0 && (
        <p className="empty">Pas encore d'amis. Ajoute quelqu'un par son pseudo !</p>
      )}
    </div>
  )
}
