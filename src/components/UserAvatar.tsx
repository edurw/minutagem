import { useAuth } from '../context/AuthContext'

interface UserAvatarProps {
  onClick: () => void
  variant?: 'sidebar' | 'topbar'
  showName?: boolean
}

export function UserAvatar({ onClick, variant = 'topbar', showName = false }: UserAvatarProps) {
  const { user, profile } = useAuth()


  const photoURL = profile?.photoURL || user?.photoURL || null
  const displayName = profile?.name || user?.displayName || user?.email || 'U'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        className="user-avatar-sidebar-btn"
        onClick={onClick}
        title={user ? (profile?.name || user.email || 'Perfil') : 'Entrar ou criar conta'}
      >
        {photoURL ? (
          <img src={photoURL} alt={displayName} className="user-avatar-img" />
        ) : (
          <div className="user-avatar-initials-sm">{initials}</div>
        )}
        {user && (
          <div className="user-avatar-sidebar-info">
            <span className="user-avatar-name">{profile?.name || displayName}</span>
          </div>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      className={`user-avatar-btn${showName ? ' user-avatar-btn' : ''}`}
      onClick={onClick}
      title={user ? (profile?.name || user.email || 'Perfil') : 'Entrar ou criar conta'}
    >
      {photoURL ? (
        <img src={photoURL} alt={displayName} className="user-avatar-img" />
      ) : (
        <div className="user-avatar-initials">{initials}</div>
      )}
      {/* {showName && user && (
        <span className="user-avatar-topbar-name">{profile?.name || displayName}</span>
      )} */}
    </button>
  )
}
