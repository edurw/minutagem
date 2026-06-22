import { formatDuration, formatMinutes } from '../lib/time'

interface BalanceCardProps {
  balance: number
  todayWorked: number
  todayBalance: number
  dailyTargetMinutes: number
}

export function BalanceCard({
  balance,
  todayWorked,
  todayBalance,
  dailyTargetMinutes,
}: BalanceCardProps) {
  const balanceClass =
    balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'neutral'
  const todayClass =
    todayBalance > 0 ? 'positive' : todayBalance < 0 ? 'negative' : 'neutral'

  return (
    <div className="balance-card">
      <div className="balance-main">
        <span className="balance-label">Saldo total</span>
        <strong className={`balance-value ${balanceClass}`}>
          {formatMinutes(balance)}
        </strong>
      </div>
      <div className="balance-stats">
        <div className="stat">
          <span>Hoje trabalhado</span>
          <strong>{formatDuration(todayWorked)}</strong>
        </div>
        <div className="stat">
          <span>Meta diária</span>
          <strong>{formatDuration(dailyTargetMinutes)}</strong>
        </div>
        <div className="stat">
          <span>Saldo hoje</span>
          <strong className={todayClass}>{formatMinutes(todayBalance)}</strong>
        </div>
      </div>
    </div>
  )
}
