import { useState } from 'react'
import { SessionTimer } from './SessionTimer'
import { getWeekdayFull } from '../lib/time'
import type { ActiveSession, StopSessionInput } from '../types'

interface LiveSessionCardProps {
  session: ActiveSession
  defaultLunchMinutes: number
  onStop: (input: StopSessionInput) => void
  onCancel: () => void
}

export function LiveSessionCard({
  session,
  defaultLunchMinutes,
  onStop,
  onCancel,
}: LiveSessionCardProps) {
  const [lunch, setLunch] = useState(defaultLunchMinutes)

  function handleStop() {
    const now = new Date()
    const endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    onStop({ endTime, lunchMinutes: lunch, usedDefaultLunch: lunch === defaultLunchMinutes })
  }

  const weekday = getWeekdayFull(session.date)
  const dayMonth = session.date.split('-').reverse().join('/')

  return (
    <div className="session-card">
      <div className="session-badge">
        <i className="ti ti-circle-filled" style={{ color: 'var(--positive)', fontSize: '9px' }} />
        Em andamento
      </div>
      <SessionTimer startTime={session.startTime} date={session.date} />
      <div className="session-start-info">
        Iniciou às {session.startTime} · {weekday}, {dayMonth}
      </div>
      <div className="btn-stop-wrap">
        <div className="lunch-inline">
          <i className="ti ti-coffee" style={{ fontSize: '15px' }} />
          Almoço:
          <select value={lunch} onChange={(e) => setLunch(Number(e.target.value))}>
            <option value={30}>30 min</option>
            <option value={60}>60 min</option>
            <option value={90}>90 min</option>
          </select>
        </div>
        <button type="button" className="btn-primary btn-stop" onClick={handleStop}>
          <i className="ti ti-player-stop-filled" />
          Encerrar sessão
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel} style={{ width: 'auto', marginTop: 0 }}>
          <i className="ti ti-x" />
          Cancelar registro
        </button>
      </div>
    </div>
  )
}
