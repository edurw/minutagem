import { useState } from 'react'
import {
  calcWorkedMinutes,
  formatDuration,
  getNowTime,
  getTodayDate,
  isValidEntry,
} from '../lib/time'
import type { EntryInput, TimeEntry } from '../types'

interface ManualEntryFormProps {
  entry?: TimeEntry
  defaultLunchMinutes: number
  onSubmit: (input: EntryInput) => void
  onSuccess?: () => void
  onCancel?: () => void
}

export function ManualEntryForm({
  entry,
  defaultLunchMinutes,
  onSubmit,
  onSuccess,
  onCancel,
}: ManualEntryFormProps) {
  const [date, setDate] = useState(entry?.date ?? getTodayDate())
  const [startTime, setStartTime] = useState(entry?.startTime ?? '08:00')
  const [endTime, setEndTime] = useState(entry?.endTime ?? getNowTime())
  const [lunch, setLunch] = useState(entry?.lunchMinutes ?? defaultLunchMinutes)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!entry

  const worked = calcWorkedMinutes(startTime, endTime, lunch)
  const workedDisplay = worked > 0 ? formatDuration(worked) : '—'
  const balanceDisplay = worked > 0
    ? (worked - 480 >= 0 ? '+' : '') + formatDuration(worked - 480)
    : '—'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = isValidEntry(startTime, endTime, lunch)
    if (validation) {
      setError(validation)
      return
    }
    setError(null)
    onSubmit({ date, startTime, endTime, lunchMinutes: lunch, usedDefaultLunch: lunch === defaultLunchMinutes })
    if (!isEditing) {
      setDate(getTodayDate())
      setStartTime('08:00')
      setEndTime(getNowTime())
      setLunch(defaultLunchMinutes)
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Data</label>
        <input
          type="date"
          className="form-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          lang="pt-BR"
        />
      </div>

      <div className="form-group">
        <div className="form-row">
          <div>
            <label className="form-label">Entrada</label>
            <input
              type="time"
              className="form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              lang="pt-BR"
            />
          </div>
          <div>
            <label className="form-label">Saída</label>
            <input
              type="time"
              className="form-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              lang="pt-BR"
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Almoço (minutos)</label>
        <input
          type="number"
          className="form-input"
          value={lunch}
          onChange={(e) => setLunch(Number(e.target.value))}
          min={0}
          max={480}
          style={{ width: '120px' }}
        />
      </div>

      <div style={{
        background: 'var(--bg)',
        borderRadius: 'var(--r-sm)',
        padding: '10px 14px',
        fontSize: '13px',
        color: 'var(--muted)',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>Total calculado</span>
        <strong style={{ color: worked > 0 ? 'var(--positive)' : 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
          {workedDisplay}
          {worked > 0 && balanceDisplay !== '—' ? (
            <span style={{ color: balanceDisplay.startsWith('-') ? 'var(--negative)' : 'var(--positive)' }}>
              {' '}({balanceDisplay})
            </span>
          ) : ''}
        </strong>
      </div>

      {error && (
        <p style={{ color: 'var(--negative)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button type="submit" className="btn-primary btn-start" style={{ width: '100%', justifyContent: 'center' }}>
          <i className="ti ti-check" />
          {isEditing ? 'Salvar alterações' : 'Salvar entrada'}
        </button>

        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
