import { useState } from 'react'
import { DateInput } from './DateInput'
import { TimeInput } from './TimeInput'
import { getNowTime, getTodayDate, isValidTime } from '../lib/time'

interface StartSessionProps {
  hasActiveSession: boolean
  onStart: (startTime: string, date: string) => void
}

export function StartSession({ hasActiveSession, onStart }: StartSessionProps) {
  const [useManual, setUseManual] = useState(false)
  const [startTime, setStartTime] = useState(getNowTime())
  const [date, setDate] = useState(getTodayDate())
  const [error, setError] = useState<string | null>(null)

  if (hasActiveSession) return null

  function handleStart() {
    if (useManual) {
      if (!date) {
        setError('Data inválida. Use o formato dd/mm/aaaa.')
        return
      }
      if (!isValidTime(startTime)) {
        setError('Horário de entrada inválido. Use o formato hh:mm.')
        return
      }
      onStart(startTime, date)
    } else {
      onStart(getNowTime(), getTodayDate())
    }
    setError(null)
    setUseManual(false)
    setStartTime(getNowTime())
    setDate(getTodayDate())
  }

  return (
    <div className="section-content">
      <div className="toggle-row">
        <label className="radio-option">
          <input
            type="radio"
            name="start-mode"
            checked={!useManual}
            onChange={() => setUseManual(false)}
          />
          Agora ({getNowTime()})
        </label>
        <label className="radio-option">
          <input
            type="radio"
            name="start-mode"
            checked={useManual}
            onChange={() => setUseManual(true)}
          />
          Horário manual
        </label>
      </div>

      {useManual && (
        <div className="field-row">
          <label className="field">
            <span>Data</span>
            <DateInput value={date} onChange={setDate} />
          </label>
          <label className="field">
            <span>Entrada</span>
            <TimeInput value={startTime} onChange={setStartTime} />
          </label>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <button type="button" className="btn btn-primary" onClick={handleStart}>
        Iniciar
      </button>
    </div>
  )
}
