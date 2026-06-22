import { useState } from 'react'
import { DateInput } from './DateInput'
import { TimeInput } from './TimeInput'
import { getTodayDate, isValidEntry } from '../lib/time'
import type { EntryInput, TimeEntry } from '../types'

interface EntryFormProps {
  entry?: TimeEntry
  defaultLunchMinutes: number
  onSubmit: (input: EntryInput) => string | null
  onCancel?: () => void
}

export function EntryForm({
  entry,
  defaultLunchMinutes,
  onSubmit,
  onCancel,
}: EntryFormProps) {
  const [date, setDate] = useState(entry?.date ?? getTodayDate())
  const [startTime, setStartTime] = useState(entry?.startTime ?? '08:00')
  const [endTime, setEndTime] = useState(entry?.endTime ?? '17:00')
  const [useDefaultLunch, setUseDefaultLunch] = useState(
    entry?.usedDefaultLunch ?? true,
  )
  const [manualLunch, setManualLunch] = useState(
    entry?.usedDefaultLunch === false
      ? entry.lunchMinutes
      : defaultLunchMinutes,
  )
  const [error, setError] = useState<string | null>(null)

  const lunchMinutes = useDefaultLunch ? defaultLunchMinutes : manualLunch

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!date) {
      setError('Data inválida. Use o formato dd/mm/aaaa.')
      return
    }

    const validationError = isValidEntry(startTime, endTime, lunchMinutes)
    if (validationError) {
      setError(validationError)
      return
    }

    const submitError = onSubmit({
      date,
      startTime,
      endTime,
      lunchMinutes,
      usedDefaultLunch: useDefaultLunch,
    })
    if (submitError) {
      setError(submitError)
      return
    }

    if (!entry) {
      setDate(getTodayDate())
      setStartTime('08:00')
      setEndTime('17:00')
      setUseDefaultLunch(true)
      setManualLunch(defaultLunchMinutes)
    }
    setError(null)
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <label className="field">
          <span>Data</span>
          <DateInput value={date} onChange={setDate} required />
        </label>
        <label className="field">
          <span>Entrada</span>
          <TimeInput value={startTime} onChange={setStartTime} required />
        </label>
        <label className="field">
          <span>Saída</span>
          <TimeInput value={endTime} onChange={setEndTime} required />
        </label>
      </div>

      <fieldset className="lunch-fieldset">
        <legend>Almoço</legend>
        <label className="radio-option">
          <input
            type="radio"
            name={`lunch-${entry?.id ?? 'new'}`}
            checked={useDefaultLunch}
            onChange={() => setUseDefaultLunch(true)}
          />
          Usar padrão ({defaultLunchMinutes} min)
        </label>
        <label className="radio-option">
          <input
            type="radio"
            name={`lunch-${entry?.id ?? 'new'}`}
            checked={!useDefaultLunch}
            onChange={() => setUseDefaultLunch(false)}
          />
          Tempo manual
        </label>
        {!useDefaultLunch && (
          <label className="field">
            <span>Minutos</span>
            <input
              type="number"
              min={0}
              max={480}
              value={manualLunch}
              onChange={(e) => setManualLunch(Number(e.target.value))}
            />
          </label>
        )}
      </fieldset>

      {error && <p className="error">{error}</p>}

      <div className="button-row">
        <button type="submit" className="btn btn-primary">
          {entry ? 'Salvar alterações' : 'Adicionar'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
