import { useState } from 'react'
import { TimeInput } from './TimeInput'
import {
  calcWorkedMinutes,
  formatDate,
  formatDuration,
  getNowTime,
  isValidEntry,
  isValidTime,
} from '../lib/time'
import type { ActiveSession } from '../types'

interface StopSessionProps {
  session: ActiveSession
  defaultLunchMinutes: number
  onStop: (input: {
    endTime: string
    lunchMinutes: number
    usedDefaultLunch: boolean
  }) => string | null
  onCancel: () => void
}

export function StopSession({
  session,
  defaultLunchMinutes,
  onStop,
  onCancel,
}: StopSessionProps) {
  const [useManualEnd, setUseManualEnd] = useState(false)
  const [endTime, setEndTime] = useState(getNowTime())
  const [useDefaultLunch, setUseDefaultLunch] = useState(true)
  const [manualLunch, setManualLunch] = useState(defaultLunchMinutes)
  const [error, setError] = useState<string | null>(null)

  const effectiveEnd = useManualEnd ? endTime : getNowTime()
  const lunchMinutes = useDefaultLunch ? defaultLunchMinutes : manualLunch
  const previewWorked = calcWorkedMinutes(
    session.startTime,
    effectiveEnd,
    lunchMinutes,
  )

  function handleStop() {
    if (useManualEnd && !isValidTime(endTime)) {
      setError('Horário de saída inválido. Use o formato hh:mm.')
      return
    }

    const validationError = isValidEntry(
      session.startTime,
      effectiveEnd,
      lunchMinutes,
    )
    if (validationError) {
      setError(validationError)
      return
    }

    const stopError = onStop({
      endTime: effectiveEnd,
      lunchMinutes,
      usedDefaultLunch: useDefaultLunch,
    })
    if (stopError) {
      setError(stopError)
    }
  }

  return (
    <div className="section-content">
      <p className="active-info">
        Entrada às <strong>{session.startTime}</strong> em{' '}
        <strong>{formatDate(session.date)}</strong>
      </p>

      <div className="toggle-row">
        <label className="radio-option">
          <input
            type="radio"
            name="end-mode"
            checked={!useManualEnd}
            onChange={() => setUseManualEnd(false)}
          />
          Parar agora ({getNowTime()})
        </label>
        <label className="radio-option">
          <input
            type="radio"
            name="end-mode"
            checked={useManualEnd}
            onChange={() => setUseManualEnd(true)}
          />
          Horário de saída manual
        </label>
      </div>

      {useManualEnd && (
        <label className="field">
          <span>Saída</span>
          <TimeInput value={endTime} onChange={setEndTime} />
        </label>
      )}

      <fieldset className="lunch-fieldset">
        <legend>Almoço</legend>
        <label className="radio-option">
          <input
            type="radio"
            name="lunch-mode"
            checked={useDefaultLunch}
            onChange={() => setUseDefaultLunch(true)}
          />
          Usar padrão ({formatDuration(defaultLunchMinutes)})
        </label>
        <label className="radio-option">
          <input
            type="radio"
            name="lunch-mode"
            checked={!useDefaultLunch}
            onChange={() => setUseDefaultLunch(false)}
          />
          Tempo manual
        </label>
        {!useDefaultLunch && (
          <label className="field">
            <span>Minutos de almoço</span>
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

      <p className="preview">
        Tempo trabalhado: <strong>{formatDuration(previewWorked)}</strong>
      </p>

      {error && <p className="error">{error}</p>}

      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={handleStop}>
          Parar e salvar
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancelar registro
        </button>
      </div>
    </div>
  )
}
