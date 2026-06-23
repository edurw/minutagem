import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

export function ProfileSection() {
  const { user, profile, signOut, updateProfile, uploadPhoto } = useAuth()
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(profile?.name || '')
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const displayName = profile?.name || user.displayName || 'Usuário'
  const email = user.email || ''
  const photoURL = profile?.photoURL || user.photoURL || null

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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      await uploadPhoto(file)
    } catch {
      // error handled silently
    } finally {
      setPhotoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="profile-section">
      <div className="profile-photo-wrap">
        <div
          className="profile-photo"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Alterar foto de perfil"
        >
          {photoURL ? (
            <img src={photoURL} alt={displayName} className="profile-photo-img" />
          ) : (
            <div className="profile-photo-initials">
              {displayName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
          )}
          <div className="profile-photo-overlay">
            {photoUploading ? (
              <span className="auth-spinner" style={{ width: 20, height: 20 }} />
            ) : (
              <i className="ti ti-camera" />
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handlePhotoChange}
        />
      </div>

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
