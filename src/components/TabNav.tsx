export type AppTab = 'exibicao' | 'registro' | 'historico' | 'configuracao'

interface TabNavProps {
  active: AppTab
  onChange: (tab: AppTab) => void
  hasActiveSession: boolean
}

const TABS: { id: AppTab; label: string }[] = [
  { id: 'exibicao', label: 'Exibição' },
  { id: 'registro', label: 'Registro' },
  { id: 'historico', label: 'Histórico' },
  { id: 'configuracao', label: 'Configuração' },
]

export function TabNav({ active, onChange, hasActiveSession }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="Seções do aplicativo">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-btn ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          {tab.label}
          {tab.id === 'registro' && hasActiveSession && (
            <span className="tab-dot" aria-label="Registro ativo" />
          )}
        </button>
      ))}
    </nav>
  )
}
