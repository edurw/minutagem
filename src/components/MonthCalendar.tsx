import { useState, useMemo } from 'react'
import { calcWorkedMinutes, getTodayDate } from '../lib/time'
import type { TimeEntry } from '../types'

interface MonthCalendarProps {
  entries: TimeEntry[]
  dailyTargetMinutes: number
}

export function MonthCalendar({ entries, dailyTargetMinutes }: MonthCalendarProps) {
  const today = getTodayDate()

  // monthOffset: 0 = current month, -1 = prev month, +1 = next month, etc.
  const [monthOffset, setMonthOffset] = useState(0)

  const todayDate = new Date(today + 'T12:00:00')

  const { year, month, monthLabel, daysInMonth, firstDayOfWeek, workedByDay } = useMemo(() => {
    const d = new Date(todayDate)
    d.setMonth(d.getMonth() + monthOffset)
    const y = d.getFullYear()
    const m = d.getMonth()
    const lastDay = new Date(y, m + 1, 0)
    const dim = lastDay.getDate()
    // day of week of the 1st of month (0=Sun, 1=Mon...)
    const fdow = new Date(y, m, 1).getDay()
    const byDay: Record<string, number> = {}
    for (const e of entries) {
      if (e.date.slice(0, 7) === `${y}-${String(m + 1).padStart(2, '0')}`) {
        const worked = calcWorkedMinutes(e.startTime, e.endTime, e.lunchMinutes)
        byDay[e.date] = (byDay[e.date] ?? 0) + worked
      }
    }
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { year: y, month: m, monthLabel: label, daysInMonth: dim, firstDayOfWeek: fdow, workedByDay: byDay }
  }, [entries, todayDate, monthOffset])

  const todayDay = todayDate.getDate()

  // Build full calendar grid starting from Sunday of the first week
  const cells: { day: number | null; month: number; year: number; isCurrentMonth: boolean }[] = []
  // Prev month trailing days
  const prevLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push({ day: prevLastDay - i, month: month - 1, year, isCurrentMonth: false })
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, isCurrentMonth: true })
  }
  // Next month leading days to fill last week
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, month: month + 1, year, isCurrentMonth: false })
    }
  }

  const cellSize = 28

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{
        fontSize: 'var(--label-size)',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        marginBottom: '10px',
      }}>
        Calendário
      </div>
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '14px',
        transition: 'background 0.25s, border-color 0.25s',
      }}>
        {/* month nav */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <button
            type="button"
            onClick={() => setMonthOffset((p) => p - 1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: '16px',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <i className="ti ti-chevron-left" />
          </button>
          <span style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--ink)',
            textTransform: 'capitalize',
          }}>
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => setMonthOffset((p) => p + 1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: '16px',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <i className="ti ti-chevron-right" />
          </button>
        </div>

        {/* weekday headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '6px',
        }}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <div key={i} style={{
              textAlign: 'center',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--muted)',
              opacity: 0.7,
            }}>{d}</div>
          ))}
        </div>

        {/* day grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
        }}>
          {cells.map((cell, idx) => {
            if (cell.day === null) {
              return <div key={`empty-${idx}`} style={{ height: cellSize }} />
            }
            const cellYear = cell.year
            const cellMonth = cell.month
            const cellDay = cell.day
            const cellDayStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`
            const worked = workedByDay[cellDayStr] ?? 0
            const isToday = cellDayStr === today
            const rowIndex = Math.floor(idx / 7)
            const todayRow = Math.floor((todayDay - 1 + firstDayOfWeek) / 7)
            const inCurrentWeek = monthOffset === 0 && rowIndex === todayRow
            const metTarget = worked >= dailyTargetMinutes
            const isFuture = cellDayStr > today

            let bg = 'transparent'
            let textColor = 'var(--muted)'
            if (!cell.isCurrentMonth) {
              textColor = 'var(--border)'
            }
            if (!isFuture && worked > 0 && cell.isCurrentMonth) {
              bg = metTarget ? 'var(--positive)' : 'var(--negative)'
              textColor = '#fff'
            }

            return (
              <div
                key={cellDayStr}
                title={`${cellDayStr}: ${worked > 0 ? `${Math.floor(worked / 60)}h ${worked % 60}min` : 'sem registro'}`}
                style={{
                  height: cellSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  background: bg,
                  border: isToday ? '2px solid var(--ink)' : inCurrentWeek ? '1px solid var(--border-md)' : 'none',
                  fontSize: '12px',
                  fontWeight: isToday ? 700 : 500,
                  color: textColor,
                  fontVariantNumeric: 'tabular-nums',
                  cursor: 'default',
                  userSelect: 'none',
                }}
              >
                {cell.day}
              </div>
            )
          })}
        </div>

        {/* legend */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: '12px',
          fontSize: '11px',
          color: 'var(--muted)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--positive)', display: 'inline-block' }} />
            ≥ meta
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--negative)', display: 'inline-block' }} />
            &lt; meta
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, border: '2px solid var(--ink)', display: 'inline-block', boxSizing: 'border-box' }} />
            hoje
          </span>
        </div>
      </div>
    </div>
  )
}
