import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export function ProfileSection() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(profile?.name || '')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const displayName = profile?.name || user.displayName || 'Usuário'
  const email = user.email || ''

  const handleSaveName = async () => {
    if (!nameValue.trim()) return
    setSaving(true)
    try {
      await updateProfile({ name: nameValue.trim() })
    } finally {
      setSaving(false)
      setEditingName(false)
    }
  }

  return (
    <div className="profile-section">
      <div className="profile-fields">
        <div className="profile-field">
          <label className="profile-label">Nome</label>
          {editingName ? (
            <div className="profile-name-edit">
              <input
                type="text"
                className="auth-input"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={handleSaveName}
                disabled={saving}
              >
                <i className="ti ti-check" />
              </button>
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={() => { setEditingName(false); setNameValue(displayName) }}
              >
                <i className="ti ti-x" />
              </button>
            </div>
          ) : (
            <div className="profile-name-display">
              <span className="profile-name-val">{displayName}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => { setEditingName(true); setNameValue(displayName) }}
                title="Editar nome"
              >
                <i className="ti ti-pencil" />
              </button>
            </div>
          )}
        </div>

        <div className="profile-field">
          <label className="profile-label">Email</label>
          <div className="profile-email">{email}</div>
        </div>
      </div>

      <button
        type="button"
        className="btn-secondary-sm profile-signout"
        onClick={signOut}
      >
        <i className="ti ti-logout" />
        Sair da conta
      </button>
    </div>
  )
}
