import { calcWorkedMinutes, formatDuration, getDayMonth, getWeekdayFull } from '../lib/time'
import type { TimeEntry } from '../types'

interface EntryCardProps {
  entry: TimeEntry
  dailyTargetMinutes: number
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function EntryCard({ entry, dailyTargetMinutes, onEdit, onDelete }: EntryCardProps) {
  const worked = calcWorkedMinutes(entry.startTime, entry.endTime, entry.lunchMinutes)
  const dayBalance = worked - dailyTargetMinutes
  const dayMonth = getDayMonth(entry.date)
  const weekday = getWeekdayFull(entry.date)

  return (
    <div className="entry-card">
      <div className="entry-date">
        <div className="entry-date-main">{dayMonth}</div>
        <div className="entry-date-day">{weekday}</div>
      </div>
      <div className="entry-times">
        <i className="ti ti-login" />
        {entry.startTime}
        <i className="ti ti-logout" />
        {entry.endTime}
        <i className="ti ti-coffee" />
        {entry.lunchMinutes}m
      </div>
      <div className={`entry-delta ${dayBalance >= 0 ? 'pos' : 'neg'}`}>
        {dayBalance >= 0 ? '+' : '-'}{formatDuration(Math.abs(dayBalance))}
      </div>
      <div className="entry-actions">
        <button type="button" className="icon-btn" title="Editar" onClick={() => onEdit(entry.id)}>
          <i className="ti ti-edit" />
        </button>
        <button type="button" className="icon-btn del" title="Excluir" onClick={() => onDelete(entry.id)}>
          <i className="ti ti-trash" />
        </button>
      </div>
    </div>
  )
}
