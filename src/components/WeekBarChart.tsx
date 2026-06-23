import type { WeekBarDay } from '../lib/time'

interface WeekBarChartProps {
  bars: WeekBarDay[]
}

export function WeekBarChart({ bars }: WeekBarChartProps) {
  return (
    <div className="week-bars" style={{ height: '90px' }}>
      {bars.map((bar, i) => {
        const scaleY = bar.fillPercent / 100
        return (
          <div key={i} className="week-bar-wrap" style={{ opacity: bar.fillPercent === 0 && !bar.isToday ? '0.3' : '1' }}>
            <div className="week-bar-track">
              <div
                className={`week-bar-fill ${bar.isPositive ? 'pos' : 'neg'}${bar.isToday ? ' today' : ''}`}
                style={{
                  height: '100%',
                  transform: `scaleY(${scaleY})`,
                  transformOrigin: 'bottom',
                  borderRadius: '4px 4px 0 0',
                }}
              />
            </div>
            <div className={`week-day-label${bar.isToday ? ' today' : ''}`}>
              {bar.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
