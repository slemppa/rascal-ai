import React, { useMemo, useState } from 'react'
import Button from './Button'

export default function PostsCalendar({ items = [], onEventClick }) {
  const [current, setCurrent] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const { monthLabel, weeks } = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat('fi-FI', { month: 'long', year: 'numeric' })
    const monthLabelLocal = monthFormatter.format(current)

    // Luo kartta: dateKey (YYYY-MM-DD) -> events
    const eventsByDate = new Map()
    for (const item of items) {
      if (!item.dateKey) continue
      if (!eventsByDate.has(item.dateKey)) eventsByDate.set(item.dateKey, [])
      eventsByDate.get(item.dateKey).push(item)
    }

    const firstDayOfMonth = new Date(current.getFullYear(), current.getMonth(), 1)
    const lastDayOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0)

    // Viikko alkaa maanantaista (FI). JS getDay(): 0=Su,1=Ma,...
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7
    const totalDays = lastDayOfMonth.getDate()

    const cells = []
    for (let i = 0; i < startOffset; i++) {
      cells.push(null)
    }
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(current.getFullYear(), current.getMonth(), d)
      const yyyy = String(date.getFullYear())
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(d).padStart(2, '0')
      const key = `${yyyy}-${mm}-${dd}`
      cells.push({ day: d, key, events: eventsByDate.get(key) || [] })
    }

    while (cells.length % 7 !== 0) cells.push(null)

    const weeksLocal = []
    for (let i = 0; i < cells.length; i += 7) {
      weeksLocal.push(cells.slice(i, i + 7))
    }

    return {
      monthLabel: monthLabelLocal,
      weeks: weeksLocal
    }
  }, [current, items])

  const todayKey = useMemo(() => {
    const now = new Date()
    const yyyy = String(now.getFullYear())
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])

  const goPrev = () => setCurrent(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const goNext = () => setCurrent(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  const goToday = () => setCurrent(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  const weekdayLabels = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su']

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-header-left">
          <h3 className="calendar-title">{monthLabel}</h3>
        </div>
        <div className="calendar-header-right">
          <Button variant="secondary" onClick={goPrev}>◀</Button>
          <Button variant="secondary" onClick={goToday}>Tänään</Button>
          <Button variant="secondary" onClick={goNext}>▶</Button>
        </div>
      </div>

      <div className="calendar-grid">
        {weekdayLabels.map(label => (
          <div key={label} className="calendar-weekday">{label}</div>
        ))}

        {weeks.map((week, wi) => (
          <React.Fragment key={wi}>
            {week.map((cell, ci) => (
              <div key={ci} className={`calendar-cell ${cell ? (cell.key === todayKey ? 'calendar-cell--today' : '') : 'calendar-cell--empty'}`}>
                {cell && (
                  <div className="calendar-cell-inner">
                    <div className="calendar-day-number">{cell.day}</div>
                    <div className="calendar-events">
                      {cell.events.slice(0, 4).map(ev => (
                        <div
                          key={ev.id}
                          className={`calendar-event calendar-event--${ev.source || 'other'}`}
                          title={ev.title}
                          onClick={() => onEventClick && onEventClick(ev)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') onEventClick && onEventClick(ev) }}
                        >
                          <span className="calendar-event-time">{ev.time || ''}</span>
                          <span className="calendar-event-title">{ev.title}</span>
                          <span className="calendar-chip">{ev.type}</span>
                          {ev.status && <span className="calendar-chip calendar-chip--muted">{ev.status}</span>}
                        </div>
                      ))}
                      {cell.events.length > 4 && (
                        <div className="calendar-more">+{cell.events.length - 4} lisää</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}


