import {
  calcWorkedMinutes,
  formatDate,
  formatDuration,
} from '../lib/time'
import type { TimeEntry } from '../types'

interface EntryListProps {
  entries: TimeEntry[]
  dailyTargetMinutes: number
  editingId: string | null
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function EntryList({
  entries,
  dailyTargetMinutes,
  editingId,
  onEdit,
  onDelete,
}: EntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="empty">Nenhum registro ainda. Inicie ou adicione um manualmente.</p>
    )
  }

  return (
    <ul className="entry-list">
      {entries.map((entry) => {
        const worked = calcWorkedMinutes(
          entry.startTime,
          entry.endTime,
          entry.lunchMinutes,
        )
        const dayBalance = worked - dailyTargetMinutes
        const balanceClass =
          dayBalance > 0 ? 'positive' : dayBalance < 0 ? 'negative' : 'neutral'

        return (
          <li
            key={entry.id}
            className={`entry-item ${editingId === entry.id ? 'editing' : ''}`}
          >
            <div className="entry-main">
              <div>
                <strong>{formatDate(entry.date)}</strong>
                <span className="entry-times">
                  {entry.startTime} → {entry.endTime}
                </span>
              </div>
              <div className="entry-meta">
                <span>Almoço: {formatDuration(entry.lunchMinutes)}</span>
                <span>Trabalhado: {formatDuration(worked)}</span>
                <span className={balanceClass}>
                  Dia: {dayBalance >= 0 ? '+' : ''}
                  {formatDuration(Math.abs(dayBalance))}
                </span>
              </div>
            </div>
            <div className="entry-actions">
              <button
                type="button"
                className="btn btn-small"
                onClick={() => onEdit(entry.id)}
              >
                Editar
              </button>
              <button
                type="button"
                className="btn btn-small btn-danger"
                onClick={() => onDelete(entry.id)}
              >
                Excluir
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
