import { useEffect, useMemo, useState } from 'react'
import { useTimeBank } from './hooks/useTimeBank'
import { LiveSessionCard } from './components/LiveSessionCard'
import { ManualEntryForm } from './components/ManualEntryForm'
import { WeekBarChart } from './components/WeekBarChart'
import { EntryCard } from './components/EntryCard'
import {
  calcWorkedMinutes,
  exportEntriesToCsv,
  formatDuration,
  formatTargetDisplay,
  getMonthYear,
  getNowTime,
  getTodayDate,
  getWeekBars,
} from './lib/time'
import type { TimeEntry } from './types'
import './App.css'

type AppTab = 'exibicao' | 'registro' | 'historico' | 'configuracao'

function App() {
  const {
    settings,
    activeSession,
    entries,
    balance,
    todayWorked,
    todayBalance,
    startSession,
    stopSession,
    cancelSession,
    addEntry,
    updateEntry,
    deleteEntry,
    updateSettings,
    resetAll,
  } = useTimeBank()

  const [activeTab, setActiveTab] = useState<AppTab>('exibicao')
  const [registroMode, setRegistroMode] = useState<'live' | 'manual'>('live')
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Theme — use React state so checkbox stays in sync
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('minutagem-theme')
    return saved !== 'light'
  })

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light-theme')
    } else {
      document.body.classList.add('light-theme')
    }
    localStorage.setItem('minutagem-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  function toggleTheme() {
    setIsDark((prev) => !prev)
  }

  // Computed
  const weekBars = useMemo(
    () => getWeekBars(entries, settings.dailyTargetMinutes),
    [entries, settings.dailyTargetMinutes],
  )

  const weekTotal = useMemo(() => {
    return weekBars.reduce((sum, b) => sum + b.workedMinutes, 0)
  }, [weekBars])

  const weekDays = weekBars.filter((b) => b.workedMinutes > 0).length

  const todayFormatted = useMemo(() => {
    const d = new Date()
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }, [])

  const monthYear = entries.length > 0
    ? getMonthYear(entries[0].date)
    : getMonthYear(getTodayDate())

  const periodBalance = useMemo(() => {
    return entries.reduce((sum, e) => {
      const worked = calcWorkedMinutes(e.startTime, e.endTime, e.lunchMinutes)
      return sum + worked - settings.dailyTargetMinutes
    }, 0)
  }, [entries, settings.dailyTargetMinutes])

  // Handlers
  function handleDelete(id: string) {
    if (window.confirm('Excluir este registro?')) {
      deleteEntry(id)
      if (editingId === id) setEditingId(null)
    }
  }

  function handleStart() {
    startSession(getNowTime(), getTodayDate())
  }

  function handleStop(input: { endTime: string; lunchMinutes: number; usedDefaultLunch: boolean }) {
    stopSession(input)
  }

  function handleManualSubmit(input: { date: string; startTime: string; endTime: string; lunchMinutes: number; usedDefaultLunch: boolean }) {
    if (editingId) {
      updateEntry(editingId, input)
      setEditingId(null)
      setEditingEntry(null)
      setToast('Registro atualizado com sucesso!')
    } else {
      addEntry(input)
      setToast('Entrada salva com sucesso!')
    }
    setTimeout(() => setToast(null), 3000)
    setRegistroMode('live')
  }

  function handleManualCancel() {
    setRegistroMode('live')
    setEditingId(null)
    setEditingEntry(null)
  }

  function handleEdit(id: string) {
    const entry = entries.find((e) => e.id === id)
    if (entry) {
      setEditingId(id)
      setEditingEntry(entry)
      setRegistroMode('manual')
    }
  }

  return (
    <div className="app">
      <div className="shell">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-brand">
            <span>Minu</span>tagem
            <small>banco de horas</small>
          </div>
          <div
            className={`nav-item${activeTab === 'exibicao' ? ' active' : ''}`}
            onClick={() => setActiveTab('exibicao')}
          >
            <i className="ti ti-home" />
            Exibição
          </div>
          <div
            className={`nav-item${activeTab === 'registro' ? ' active' : ''}`}
            onClick={() => setActiveTab('registro')}
          >
            <i className="ti ti-player-record" />
            Registro
          </div>
          <div
            className={`nav-item${activeTab === 'historico' ? ' active' : ''}`}
            onClick={() => setActiveTab('historico')}
          >
            <i className="ti ti-list" />
            Histórico
          </div>
          <div
            className={`nav-item${activeTab === 'configuracao' ? ' active' : ''}`}
            onClick={() => setActiveTab('configuracao')}
          >
            <i className="ti ti-settings" />
            Configuração
          </div>
        </div>

        {/* Content */}
        <div className="content">

          {/* ── TAB: EXIBIÇÃO ── */}
          <div className={`tab-panel${activeTab === 'exibicao' ? ' active' : ''}`}>
            <div className="topbar">
              <h1>Visão geral</h1>
              <span className="topbar-date">{todayFormatted}</span>
            </div>
            <div style={{ padding: '0 24px 20px' }}>
              <div className="balance-hero">
                <div className="balance-label">Saldo acumulado</div>
                <div className={`balance-number ${balance >= 0 ? 'pos' : 'neg'}`}>
                  {balance >= 0 ? '+' : '-'}{formatDuration(Math.abs(balance))}
                </div>
                <div className="balance-sub">
                  <span className={`balance-pill ${balance >= 0 ? 'pos' : 'neg'}`}>
                    {balance >= 0 ? 'adiantado' : 'atrasado'}
                  </span>
                  <span>em relação à meta acumulada</span>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Hoje — trabalhado</div>
                  <div className="stat-val">{formatDuration(todayWorked)}</div>
                  <div className="stat-sub">meta: {formatDuration(settings.dailyTargetMinutes)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Hoje — saldo</div>
                  <div className={`stat-val ${todayBalance >= 0 ? 'pos' : 'neg'}`}>
                    {todayBalance >= 0 ? '+' : '-'}{formatDuration(Math.abs(todayBalance))}
                  </div>
                  <div className="stat-sub">sessão encerrada</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Semana</div>
                  <div className={`stat-val ${weekTotal >= settings.dailyTargetMinutes * weekDays ? 'pos' : 'neg'}`}>
                    {weekTotal >= 0 ? '+' : '-'}{formatDuration(Math.abs(weekTotal))}
                  </div>
                  <div className="stat-sub">{weekDays} dia{weekDays !== 1 ? 's' : ''} registrado{weekDays !== 1 ? 's' : ''}</div>
                </div>
              </div>

              <div className="divider" />
              <div className="section-title">Esta semana</div>
              <WeekBarChart bars={weekBars} />
            </div>
          </div>

          {/* ── TAB: REGISTRO ── */}
          <div className={`tab-panel${activeTab === 'registro' ? ' active' : ''}`}>
            <div className="topbar">
              <h1>Registrar horas</h1>
            </div>
            <div style={{ padding: '12px 24px 20px' }}>
              <div className="mode-toggle">
                <button
                  type="button"
                  className={`mode-btn${registroMode === 'live' ? ' active' : ''}`}
                  onClick={() => setRegistroMode('live')}
                >
                  <i className="ti ti-player-record" />
                  Iniciar/Parar
                </button>
                <button
                  type="button"
                  className={`mode-btn${registroMode === 'manual' ? ' active' : ''}`}
                  onClick={() => setRegistroMode('manual')}
                >
                  <i className="ti ti-pencil" />
                  Entrada manual
                </button>
              </div>

              {registroMode === 'live' ? (
                activeSession ? (
                  <LiveSessionCard
                    session={activeSession}
                    defaultLunchMinutes={settings.defaultLunchMinutes}
                    onStop={handleStop}
                    onCancel={cancelSession}
                  />
                ) : (
                  <div className="start-card">
                    <div className="start-card-icon">
                      <i className="ti ti-player-record" style={{ fontSize: '40px' }} />
                    </div>
                    <div className="start-card-title">Iniciar sessão</div>
                    <div className="start-card-sub">
                      Registre o início do seu expediente com um clique.
                    </div>
                    <button type="button" className="btn-primary btn-start" onClick={handleStart}>
                      <i className="ti ti-player-play-filled" />
                      Iniciar
                    </button>
                  </div>
                )
              ) : (
                <ManualEntryForm
                  entry={editingEntry ?? undefined}
                  defaultLunchMinutes={settings.defaultLunchMinutes}
                  onSubmit={handleManualSubmit}
                  onCancel={handleManualCancel}
                />
              )}
            </div>
          </div>

          {/* ── TAB: HISTÓRICO ── */}
          <div className={`tab-panel${activeTab === 'historico' ? ' active' : ''}`}>
            <div className="topbar">
              <h1>Histórico</h1>
            </div>
            <div style={{ padding: '12px 24px 20px' }}>
              {entries.length > 0 && (
                <div className="summary-strip">
                  <span>{monthYear} · {entries.length} registro{entries.length !== 1 ? 's' : ''}</span>
                  <strong style={{ color: periodBalance >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                    {periodBalance >= 0 ? '+' : '-'}{formatDuration(Math.abs(periodBalance))} no período
                  </strong>
                </div>
              )}

              {entries.length === 0 ? (
                <div className="no-entries">Nenhum registro ainda. Inicie ou adicione um manualmente.</div>
              ) : (
                <div className="history-list">
                  {entries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      dailyTargetMinutes={settings.dailyTargetMinutes}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── TAB: CONFIGURAÇÃO ── */}
          <div className={`tab-panel${activeTab === 'configuracao' ? ' active' : ''}`}>
            <div className="topbar">
              <h1>Configuração</h1>
            </div>
            <div style={{ padding: '12px 24px 20px' }}>

              {/* Aparência */}
              <div className="settings-section">
                <div className="settings-section-title">Aparência</div>
                <div className="setting-row">
                  <div className="setting-info">
                    <div className="setting-name">Usar tema escuro</div>
                    <div className="setting-desc">Ative para usar o tema escuro em toda a aplicação</div>
                  </div>
                  <div className="setting-control">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={isDark}
                        onChange={toggleTheme}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Jornada */}
              <div className="settings-section">
                <div className="settings-section-title">Jornada de trabalho</div>
                <div className="setting-row">
                  <div className="setting-info">
                    <div className="setting-name">Meta diária</div>
                    <div className="setting-desc">Minutos esperados por dia útil</div>
                  </div>
                  <div className="setting-control">
                    <input
                      type="number"
                      className="setting-input"
                      value={settings.dailyTargetMinutes}
                      min={60}
                      max={1440}
                      onChange={(e) => updateSettings({ dailyTargetMinutes: Number(e.target.value) })}
                    />
                    <span className="setting-unit">min</span>
                    <span className="computed-display">
                      {formatTargetDisplay(settings.dailyTargetMinutes)}
                    </span>
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-info">
                    <div className="setting-name">Almoço padrão</div>
                    <div className="setting-desc">Pré-preenchido ao encerrar sessão</div>
                  </div>
                  <div className="setting-control">
                    <input
                      type="number"
                      className="setting-input"
                      value={settings.defaultLunchMinutes}
                      min={0}
                      max={480}
                      onChange={(e) => updateSettings({ defaultLunchMinutes: Number(e.target.value) })}
                    />
                    <span className="setting-unit">min</span>
                    <span className="computed-display">
                      {formatTargetDisplay(settings.defaultLunchMinutes)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dados */}
              <div className="settings-section">
                <div className="settings-section-title">Dados</div>
                <div className="setting-row">
                  <div className="setting-info">
                    <div className="setting-name">Exportar histórico</div>
                    <div className="setting-desc">Baixa todos os registros em CSV</div>
                  </div>
                  <div className="setting-control">
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      onClick={() => exportEntriesToCsv(entries)}
                    >
                      <i className="ti ti-download" />
                      Exportar CSV
                    </button>
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-info">
                    <div className="setting-name">Limpar todos os dados</div>
                    <div className="setting-desc">Remove todos os registros permanentemente</div>
                  </div>
                  <div className="setting-control">
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      style={{ color: 'var(--negative)', borderColor: 'rgba(220,38,38,0.25)' }}
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja apagar todos os dados?')) {
                          resetAll()
                        }
                      }}
                    >
                      <i className="ti ti-trash" />
                      Limpar
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--muted)', textAlign: 'center', marginTop: '8px' }}>
                Dados salvos localmente no dispositivo · nenhuma conta necessária
              </div>
            </div>
          </div>

        </div>

        {/* Toast notification */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--surface)',
            color: 'var(--positive)',
            border: '0.5px solid var(--positive)',
            borderRadius: 'var(--r-md)',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            zIndex: 200,
            whiteSpace: 'nowrap',
          }}>
            <i className="ti ti-check" style={{ fontSize: '16px' }} />
            {toast}
          </div>
        )}

        {/* Mobile Bottom Nav */}
        <div className="mobile-bottom-nav">
          <div
            className={`mobile-nav-item${activeTab === 'exibicao' ? ' active' : ''}`}
            onClick={() => setActiveTab('exibicao')}
          >
            <i className="ti ti-home" />
            <span>Exibição</span>
          </div>
          <div
            className={`mobile-nav-item${activeTab === 'registro' ? ' active' : ''}`}
            onClick={() => setActiveTab('registro')}
          >
            <i className="ti ti-player-record" />
            <span>Registro</span>
          </div>
          <div
            className={`mobile-nav-item${activeTab === 'historico' ? ' active' : ''}`}
            onClick={() => setActiveTab('historico')}
          >
            <i className="ti ti-list" />
            <span>Histórico</span>
          </div>
          <div
            className={`mobile-nav-item${activeTab === 'configuracao' ? ' active' : ''}`}
            onClick={() => setActiveTab('configuracao')}
          >
            <i className="ti ti-settings" />
            <span>Config.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
