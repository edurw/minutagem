import type { Settings } from '../types'

interface SettingsPanelProps {
  settings: Settings
  onChange: (settings: Partial<Settings>) => void
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return (
    <div className="section-content">
      <div className="field-row">
        <label className="field">
          <span>Meta diária (horas)</span>
          <input
            type="number"
            min={1}
            max={24}
            step={0.5}
            value={settings.dailyTargetMinutes / 60}
            onChange={(e) =>
              onChange({ dailyTargetMinutes: Number(e.target.value) * 60 })
            }
          />
        </label>
        <label className="field">
          <span>Almoço padrão (minutos)</span>
          <input
            type="number"
            min={0}
            max={480}
            value={settings.defaultLunchMinutes}
            onChange={(e) =>
              onChange({ defaultLunchMinutes: Number(e.target.value) })
            }
          />
        </label>
      </div>
      <p className="hint">
        O almoço padrão será aplicado automaticamente ao parar um registro,
        quando você escolher essa opção.
      </p>
    </div>
  )
}
