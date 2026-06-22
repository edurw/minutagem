import { useState } from 'react'
import { BalanceCard } from './components/BalanceCard'
import { EntryForm } from './components/EntryForm'
import { EntryList } from './components/EntryList'
import { SettingsPanel } from './components/SettingsPanel'
import { StartSession } from './components/StartSession'
import { StopSession } from './components/StopSession'
import { TabNav, type AppTab } from './components/TabNav'
import { useTimeBank } from './hooks/useTimeBank'
import './App.css'

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
  } = useTimeBank()

  const [activeTab, setActiveTab] = useState<AppTab>('exibicao')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)

  const editingEntry = entries.find((entry) => entry.id === editingId)

  function handleDelete(id: string) {
    if (window.confirm('Excluir este registro?')) {
      deleteEntry(id)
      if (editingId === id) setEditingId(null)
    }
  }

  function handleStart(startTime: string, date: string) {
    startSession(startTime, date)
    setActiveTab('registro')
  }

  function handleEdit(id: string) {
    setEditingId(id)
    setShowManualForm(false)
    setActiveTab('historico')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Minutagem</h1>
          <p>Banco de horas</p>
        </div>
        <span className="storage-hint">Salvo neste dispositivo</span>
      </header>

      <TabNav
        active={activeTab}
        onChange={setActiveTab}
        hasActiveSession={!!activeSession}
      />

      <main className="tab-content">
        {activeTab === 'exibicao' && (
          <section className="tab-panel tab-panel--exibicao">
            <BalanceCard
              balance={balance}
              todayWorked={todayWorked}
              todayBalance={todayBalance}
              dailyTargetMinutes={settings.dailyTargetMinutes}
            />
          </section>
        )}

        {activeTab === 'registro' && (
          <section className="tab-panel tab-panel--registro">
            <div className="panel-header">
              <h2>Registro</h2>
              {activeSession && <span className="badge">Ativo</span>}
            </div>

            {activeSession ? (
              <StopSession
                session={activeSession}
                defaultLunchMinutes={settings.defaultLunchMinutes}
                onStop={(input) => {
                  stopSession(input)
                  return null
                }}
                onCancel={cancelSession}
              />
            ) : (
              <>
                <StartSession
                  hasActiveSession={!!activeSession}
                  onStart={handleStart}
                />

                {!showManualForm ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-block"
                    onClick={() => setShowManualForm(true)}
                  >
                    + Registro manual
                  </button>
                ) : (
                  <div className="sub-panel">
                    <h3>Registro manual</h3>
                    <EntryForm
                      defaultLunchMinutes={settings.defaultLunchMinutes}
                      onSubmit={(input) => {
                        addEntry(input)
                        setShowManualForm(false)
                        return null
                      }}
                      onCancel={() => setShowManualForm(false)}
                    />
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'historico' && (
          <section className="tab-panel tab-panel--historico">
            <h2>Histórico</h2>

            {editingEntry && (
              <div className="sub-panel">
                <h3>Editar registro</h3>
                <EntryForm
                  entry={editingEntry}
                  defaultLunchMinutes={settings.defaultLunchMinutes}
                  onSubmit={(input) => {
                    updateEntry(editingEntry.id, input)
                    setEditingId(null)
                    return null
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            )}

            <div className="entry-list-scroll">
              <EntryList
                entries={entries}
                dailyTargetMinutes={settings.dailyTargetMinutes}
                editingId={editingId}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </section>
        )}

        {activeTab === 'configuracao' && (
          <section className="tab-panel tab-panel--configuracao">
            <h2>Configuração</h2>
            <SettingsPanel settings={settings} onChange={updateSettings} />
          </section>
        )}
      </main>
    </div>
  )
}

export default App
