import { useEffect, useState } from 'react'
import { timeToMinutes } from '../lib/time'

interface SessionTimerProps {
  startTime: string
  date: string
}

export function SessionTimer({ startTime, date }: SessionTimerProps) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const startMinutes = timeToMinutes(startTime)
    const tick = () => {
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const nowSecs = now.getSeconds()
      const elapsed = Math.max(0, (nowMinutes - startMinutes) * 60 + nowSecs)
      setSeconds(elapsed)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startTime, date])

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return (
    <div className="session-time">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  )
}
