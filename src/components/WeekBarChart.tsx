import type { WeekBarDay } from '../lib/time'

interface WeekBarChartProps {
  bars: WeekBarDay[]
}

export function WeekBarChart({ bars }: WeekBarChartProps) {
  return (
    <div className="week-bars" style={{ height: '72px' }}>
      {bars.map((bar, i) => (
        <div key={i} className="week-bar-wrap" style={{ opacity: bar.fillPercent === 0 && !bar.isToday ? '0.3' : '1' }}>
          <div className="week-bar-track">
            <div
              className={`week-bar-fill ${bar.isPositive ? 'pos' : 'neg'}${bar.isToday ? ' today' : ''}`}
              style={{ height: `${bar.fillPercent}%` }}
            />
          </div>
          <div className={`week-day-label${bar.isToday ? ' today' : ''}`}>
            {bar.label}
          </div>
        </div>
      ))}
    </div>
  )
}
