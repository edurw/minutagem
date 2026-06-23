import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

interface AuthModalProps {
  onClose: () => void
}

type View = 'login' | 'signup'

export function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()
  const [view, setView] = useState<View>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInputRef.current?.focus()
  }, [view])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (view === 'signup') {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.')
        return
      }
    }

    setLoading(true)
    try {
      if (view === 'login') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password, name)
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Email ou senha incorretos.')
      } else if (msg.includes('email-already-in-use')) {
        setError('Este email já está cadastrado.')
      } else if (msg.includes('weak-password')) {
        setError('A senha deve ter pelo menos 6 caracteres.')
      } else {
        setError('Erro ao autenticar. Verifique seus dados.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('popup-closed-by-user')) {
        // user cancelled, no error
      } else {
        setError('Erro ao fazer login com Google.')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchView = (v: View) => {
    setView(v)
    setError('')
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button type="button" className="auth-close-btn" onClick={onClose} aria-label="Fechar">
          <i className="ti ti-x" />
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            <svg width="36" height="36" viewBox="0 0 48 48" role="img" aria-label="Logo Minutagem">
              <rect x="4" y="4" width="40" height="40" rx="10" fill="var(--accent)" opacity="0.15"/>
              <circle cx="24" cy="22" r="12" fill="none" stroke="var(--accent)" strokeWidth="2"/>
              <path d="M24 22 L24 12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M24 22 L32 27" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="24" cy="22" r="2" fill="var(--accent)"/>
              <rect x="10" y="37" width="28" height="3" rx="1.5" fill="var(--accent)" opacity="0.4"/>
              <rect x="10" y="37" width="19" height="3" rx="1.5" fill="var(--accent)"/>
            </svg>
          </div>
          <h2 className="auth-title">
            {view === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}
          </h2>
          <p className="auth-subtitle">
            {view === 'login'
              ? 'Entre para continuar no Minutagem'
              : 'Cadastre-se para sincronizar seus dados'}
          </p>
        </div>

        {/* Google button */}
        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar com Google
        </button>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {view === 'signup' && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-name">Nome</label>
              <input
                id="auth-name"
                ref={firstInputRef}
                type="text"
                className="auth-input"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              ref={view === 'login' ? firstInputRef : undefined}
              type="email"
              className="auth-input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">Senha</label>
            <input
              id="auth-password"
              type="password"
              className="auth-input"
              placeholder={view === 'signup' ? 'Mínimo 6 caracteres' : 'Sua senha'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {view === 'signup' && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-confirm">Confirmar senha</label>
              <input
                id="auth-confirm"
                type="password"
                className="auth-input"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div className="auth-error">
              <i className="ti ti-alert-circle" />
              {error}
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="auth-spinner" />
            ) : view === 'login' ? (
              'Entrar'
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        <div className="auth-footer">
          {view === 'login' ? (
            <>
              Não tem conta?{' '}
              <button type="button" className="auth-link" onClick={() => switchView('signup')}>
                Crie uma
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button type="button" className="auth-link" onClick={() => switchView('login')}>
                Entre
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
