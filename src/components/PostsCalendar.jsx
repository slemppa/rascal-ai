import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useToast } from '../contexts/ToastContext'
import Button from './Button'

export default function PostsCalendar({ 
  items = [], 
  onEventClick, 
  readyPosts = [], 
  onSchedulePost,
  socialAccounts = [],
  selectedAccounts = [],
  setSelectedAccounts,
  loadingAccounts = false,
  onFetchSocialAccounts,
  onRefresh,
  refreshing = false
}) {
  const toast = useToast()
  const [current, setCurrent] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [hoveredDate, setHoveredDate] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [selectedTime, setSelectedTime] = useState('12:00')

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

  const handleDateClick = (dateKey) => {
    if (readyPosts.length === 0) return
    setSelectedDate(dateKey)
    setShowScheduleModal(true)
  }

  const handlePostSelect = (post, dateKey) => {
    // Suljetaan postausvalinta-modaali ja avataan kellonajan valinta-modaali
    setSelectedPost({ post, dateKey })
    setShowScheduleModal(false)
    setShowTimeModal(true)
    
    // Asetetaan oletuskellonaika klo 12:00
    setSelectedTime('12:00')
    
    // Tyhjennetään aiemmat valinnat ja haetaan somekanavat
    if (setSelectedAccounts) {
      setSelectedAccounts([])
    }
    if (onFetchSocialAccounts) {
      onFetchSocialAccounts()
    }
  }

  const toggleAccount = (accountId) => {
    if (!setSelectedAccounts) return
    
    if (selectedAccounts.includes(accountId)) {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId))
    } else {
      setSelectedAccounts([...selectedAccounts, accountId])
    }
  }

  const handleConfirmSchedule = () => {
    if (onSchedulePost && selectedPost) {
      const { post, dateKey } = selectedPost
      
      // Tarkista että on valittu vähintään yksi kanava
      if (!selectedAccounts || selectedAccounts.length === 0) {
        toast.warning('Valitse vähintään yksi somekanava')
        return
      }
      
      // Muunnetaan dateKey (YYYY-MM-DD) ja kellonaika ISO-muotoon
      // Luodaan datetime-string Helsinki-aikavyöhykkeessä ja muunnetaan se UTC:ksi oikein
      const [year, month, day] = dateKey.split('-')
      const [hours, minutes] = selectedTime.split(':')
      
      // Luodaan Date-objekti joka edustaa Helsinki-aikaa UTC:na
      // Käytetään yksinkertaista tapaa: luodaan Date-objekti tulkitsemalla datetime-string
      // Helsinki-aikavyöhykkeessä, sitten muunnetaan se UTC:ksi
      const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}:00`
      
      // Luodaan Date-objekti joka edustaa Helsinki-aikaa
      // Tämä luo Date-objektin käyttäjän paikalliseen aikaan (browserin aikavyöhyke)
      // Mutta meidän täytyy tulkita se Helsinki-aikavyöhykkeessä
      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes))
      
      // Laske offset Helsinki-aikavyöhykkeelle tälle päivämäärälle
      // Helsinki on UTC+2 (talviaika) tai UTC+3 (kesäaika)
      // Käytetään Intl.DateTimeFormat:ia muuntamaan Helsinki-aika UTC:ksi
      const helsinkiTime = new Date(localDate.toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }))
      const utcTime = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }))
      const offset = helsinkiTime.getTime() - utcTime.getTime()
      
      // Luodaan UTC-datetime lisäämällä offset (koska Helsinki on UTC:n edellä)
      const utcDate = new Date(localDate.getTime() - offset)
      
      // Lähetetään ISO-muodossa (backend odottaa ISO-muotoa)
      onSchedulePost(post, utcDate.toISOString().slice(0, 16), selectedAccounts)
    }
    setShowTimeModal(false)
    setSelectedPost(null)
    setSelectedDate(null)
    if (setSelectedAccounts) {
      setSelectedAccounts([])
    }
  }

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false)
    setSelectedDate(null)
  }

  const handleCloseTimeModal = () => {
    setShowTimeModal(false)
    setSelectedPost(null)
    setSelectedDate(null)
    if (setSelectedAccounts) {
      setSelectedAccounts([])
    }
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-header-left">
          <h3 className="calendar-title">{monthLabel}</h3>
        </div>
        <div className="calendar-header-right">
          {onRefresh && (
            <Button 
              variant="secondary" 
              onClick={onRefresh}
              disabled={refreshing}
              style={{ 
                marginRight: '8px',
                fontSize: '14px',
                padding: '8px 12px'
              }}
            >
              {refreshing ? 'Päivitetään...' : 'Päivitä'}
            </Button>
          )}
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
              <div 
                key={ci} 
                className={`calendar-cell ${cell ? (cell.key === todayKey ? 'calendar-cell--today' : '') : 'calendar-cell--empty'}`}
                onMouseEnter={() => cell && setHoveredDate(cell.key)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                {cell && (
                  <div className="calendar-cell-inner">
                    <div className="calendar-day-header">
                      <div className="calendar-day-number">{cell.day}</div>
                      {hoveredDate === cell.key && readyPosts.length > 0 && (
                        <button
                          className="calendar-add-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDateClick(cell.key)
                          }}
                          title="Aikatauluta postaus"
                        >
                          +
                        </button>
                      )}
                    </div>
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
                          <div className="calendar-event-header">
                            <span className="calendar-event-time">{ev.time || ''}</span>
                            {ev.channel && <span className="calendar-event-channel">{ev.channel}</span>}
                          </div>
                          <span className="calendar-event-title">{ev.title}</span>
                          <div className="calendar-event-chips">
                            <span className="calendar-chip">{ev.type}</span>
                            {ev.status && <span className="calendar-chip calendar-chip--muted">{ev.status}</span>}
                          </div>
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

      {/* Post Selection Modal */}
      {showScheduleModal && selectedDate && createPortal(
        <div className="modal-overlay modal-overlay--light" onClick={handleCloseScheduleModal}>
          <div className="modal-container modal-content--schedule" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>Aikatauluta postaus</h2>
                <button className="modal-close" onClick={handleCloseScheduleModal}>×</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '16px', color: '#6b7280' }}>
                  Valitse postaus joka aikataulutetaan päivälle: <strong>{selectedDate}</strong>
                </p>
                <div className="schedule-posts-list">
                  {readyPosts.length === 0 ? (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                      Ei valmiita postauksia
                    </p>
                  ) : (
                    readyPosts.map(post => (
                      <div
                        key={post.id}
                        className="schedule-post-item"
                        onClick={() => handlePostSelect(post, selectedDate)}
                      >
                        <div className="schedule-post-thumbnail">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} alt={post.title} />
                          ) : (
                            <div className="schedule-post-placeholder">🖼️</div>
                          )}
                        </div>
                        <div className="schedule-post-info">
                          <h4 className="schedule-post-title">{post.title || 'Postaus'}</h4>
                          <p className="schedule-post-caption">{post.caption || 'Ei kuvausta'}</p>
                          <div className="schedule-post-meta">
                            <span className="schedule-post-type">{post.type || 'Post'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Time Selection Modal */}
      {showTimeModal && selectedPost && createPortal(
        <div className="modal-overlay modal-overlay--light" onClick={handleCloseTimeModal}>
          <div className="modal-container modal-content--schedule" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>Valitse kellonaika</h2>
                <button className="modal-close" onClick={handleCloseTimeModal}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '24px' }}>
                  <div className="schedule-post-item" style={{ cursor: 'default', pointerEvents: 'none' }}>
                    <div className="schedule-post-thumbnail">
                      {selectedPost.post.thumbnail ? (
                        <img src={selectedPost.post.thumbnail} alt={selectedPost.post.title} />
                      ) : (
                        <div className="schedule-post-placeholder">🖼️</div>
                      )}
                    </div>
                    <div className="schedule-post-info">
                      <h4 className="schedule-post-title">{selectedPost.post.title || 'Postaus'}</h4>
                      <p className="schedule-post-caption">{selectedPost.post.caption || 'Ei kuvausta'}</p>
                      <div className="schedule-post-meta">
                        <span className="schedule-post-type">{selectedPost.post.type || 'Post'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ marginBottom: '8px', color: '#6b7280', fontSize: '14px' }}>
                    Päivämäärä: <strong>{selectedPost.dateKey}</strong>
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label" style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#111827' 
                  }}>
                    Julkaisuaika
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                {/* Somekanavat */}
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    marginTop: 0, 
                    marginBottom: '12px', 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#111827' 
                  }}>
                    Kanavat
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px', 
                    maxHeight: '300px', 
                    overflowY: 'auto' 
                  }}>
                    {loadingAccounts ? (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#6b7280',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}>
                        Ladataan tilejä...
                      </div>
                    ) : socialAccounts && socialAccounts.length > 0 ? (
                      socialAccounts.map((account) => {
                        const isSelected = selectedAccounts.includes(account.mixpost_account_uuid)
                        return (
                          <div 
                            key={account.mixpost_account_uuid}
                            onClick={() => toggleAccount(account.mixpost_account_uuid)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px',
                              backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                              border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleAccount(account.mixpost_account_uuid)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer'
                              }}
                            />
                            {account.profile_image_url && (
                              <img 
                                src={account.profile_image_url} 
                                alt={account.account_name}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  objectFit: 'cover'
                                }}
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
                                {account.account_name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {account.provider} • {account.username ? `@${account.username}` : account.account_name}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#6b7280',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}>
                        Ei yhdistettyjä sometilejä
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-actions" style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '12px', 
                  marginTop: '24px',
                  paddingTop: '24px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <Button variant="secondary" onClick={handleCloseTimeModal}>
                    Peruuta
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleConfirmSchedule}
                    disabled={!selectedAccounts || selectedAccounts.length === 0}
                  >
                    Aikatauluta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}


