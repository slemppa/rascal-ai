import React, { useEffect, useMemo, useState, memo } from 'react'
import { createPortal } from 'react-dom'
import Button from '../Button'

function CallDetailModal({
  selectedLog,
  loading,
  onClose,
  onBackgroundClick,
  formatDuration,
  detailActiveTab,
  setDetailActiveTab,
  showMoreDetails,
  setShowMoreDetails
}) {
  useEffect(() => {
    setDetailActiveTab && setDetailActiveTab('summary')
    setShowMoreDetails && setShowMoreDetails(false)
  }, [])

  if (!selectedLog) return null

  const displayName = useMemo(() => selectedLog.customer_name || 'Human', [selectedLog.customer_name])
  const displayPhone = selectedLog.phone_number
  const formattedDate = useMemo(() => {
    if (!selectedLog.call_date) return '-'
    try {
      const d = new Date(selectedLog.call_date)
      return d.toLocaleDateString('fi-FI') + ' ' + d.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '-'
    }
  }, [selectedLog.call_date])

  // Pre-prosessoidaan transkripti kerran
  const transcriptMessages = useMemo(() => {
    const raw = selectedLog.transcript
    if (!raw) return []
    // JSON → array
    try {
      const parsed = JSON.parse(raw)
      const arr = Array.isArray(parsed) ? parsed : parsed?.messages
      if (Array.isArray(arr)) {
        return arr.map((m) => {
          const role = String(m.role || m.speaker || '').toLowerCase()
          const isBot = role.includes('bot') || role.includes('assistant') || role.includes('agent')
          return { isBot, text: m.text || m.content || '' }
        })
      }
    } catch {}
    // Plain text → rivikohtaisesti
    return String(raw)
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => {
        const lower = line.toLowerCase()
        const isBot = lower.startsWith('bot:') || lower.startsWith('assistant:') || lower.startsWith('agent:')
        const text = line.replace(/^\w+:\s*/, '')
        return { isBot, text }
      })
  }, [selectedLog.transcript])

  // Tarkista onko äänitiedosto saatavilla
  const hasAudioFile = useMemo(() => {
    const recordingUrl = selectedLog.recording_url
    if (!recordingUrl) return false
    
    // Käsittele sekä array että JSON string -muotoja
    let urls = []
    if (Array.isArray(recordingUrl)) {
      urls = recordingUrl
    } else if (typeof recordingUrl === 'string') {
      try {
        // Yritä parsia JSON string
        const parsed = JSON.parse(recordingUrl)
        if (Array.isArray(parsed)) {
          urls = parsed
        } else {
          urls = [recordingUrl] // Jos ei ole array, käsittele stringinä
        }
      } catch {
        urls = [recordingUrl] // Jos JSON parsing epäonnistuu, käsittele stringinä
      }
    }
    
    return urls.some(url => {
      if (!url || typeof url !== 'string') return false
      const lowerUrl = url.toLowerCase()
      return lowerUrl.includes('.mp3') || lowerUrl.includes('.wav') || lowerUrl.includes('.m4a') || lowerUrl.includes('.ogg') || lowerUrl.includes('.mp4')
    })
  }, [selectedLog.recording_url])

  // Hae ensimmäinen äänitiedosto
  const audioUrl = useMemo(() => {
    if (!hasAudioFile) return null
    const recordingUrl = selectedLog.recording_url
    
    // Käsittele sekä array että JSON string -muotoja
    let urls = []
    if (Array.isArray(recordingUrl)) {
      urls = recordingUrl
    } else if (typeof recordingUrl === 'string') {
      try {
        // Yritä parsia JSON string
        const parsed = JSON.parse(recordingUrl)
        if (Array.isArray(parsed)) {
          urls = parsed
        } else {
          urls = [recordingUrl] // Jos ei ole array, käsittele stringinä
        }
      } catch {
        urls = [recordingUrl] // Jos JSON parsing epäonnistuu, käsittele stringinä
      }
    }
    
    return urls.find(url => {
      if (!url || typeof url !== 'string') return false
      const lowerUrl = url.toLowerCase()
      return lowerUrl.includes('.mp3') || lowerUrl.includes('.wav') || lowerUrl.includes('.m4a') || lowerUrl.includes('.ogg') || lowerUrl.includes('.mp4')
    })
  }, [selectedLog.recording_url, hasAudioFile])

  // Lataa äänitiedosto Supabase Storage:sta
  const [audioBlobUrl, setAudioBlobUrl] = useState(null)
  const [audioLoading, setAudioLoading] = useState(false)

  useEffect(() => {
    if (!hasAudioFile || !audioUrl) {
      setAudioBlobUrl(null)
      return
    }

    const downloadAudio = async () => {
      try {
        setAudioLoading(true)
        
        // Tarkista onko URL Supabase Storage authenticated URL
        if (audioUrl.includes('/storage/v1/object/authenticated/')) {
          // Pura bucket ja file path URL:ista
          const urlParts = audioUrl.split('/storage/v1/object/authenticated/')
          if (urlParts.length === 2) {
            const pathParts = urlParts[1].split('/')
            const bucket = pathParts[0]
            const filePath = pathParts.slice(1).join('/')
            
            // Lataa tiedosto Supabase Storage:sta
            const { data, error } = await supabase.storage
              .from(bucket)
              .download(filePath)
            
            if (error) {
              console.error('Error downloading audio:', error)
              return
            }
            
            // Luo blob URL
            const blobUrl = URL.createObjectURL(data)
            setAudioBlobUrl(blobUrl)
          }
        } else {
          // Jos ei ole Supabase Storage URL, käytä suoraan
          setAudioBlobUrl(audioUrl)
        }
      } catch (error) {
        console.error('Error processing audio:', error)
      } finally {
        setAudioLoading(false)
      }
    }

    downloadAudio()

    // Cleanup blob URL kun komponentti unmountataan
    return () => {
      if (audioBlobUrl && audioBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioBlobUrl)
      }
    }
  }, [hasAudioFile, audioUrl, supabase])

  // Renderöidään transkripti paginoiden, jotta avaus ja scroll on nopea
  const [transcriptLimit, setTranscriptLimit] = useState(200)
  useEffect(() => {
    setTranscriptLimit(200)
  }, [selectedLog.transcript, detailActiveTab])
  return createPortal(
    <div 
      onClick={onBackgroundClick}
      className="modal-overlay modal-overlay--dark"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="modal-container"
        style={{ maxWidth: 960, width: '100%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', padding: 0 }}
      >
        {/* Close button only in absolute top-right */}
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
          <Button
            onClick={onClose}
            variant="secondary"
            className="modal-close-btn"
            style={{ background: 'rgba(17,24,39,0.6)', color: '#fff' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Button>
        </div>

        {/* Header */}
        <div className="call-detail__header" style={{ background: 'transparent', color: '#24170f', padding: '12px 16px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Puhelun tiedot</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, color: '#cea78d' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cea78d" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span style={{ fontWeight: 700 }}>{selectedLog.customer_name || selectedLog.phone_number || '-'}</span>
            {selectedLog.customer_name && (
              <span style={{ color: '#9b7b66', fontWeight: 600 }}>· {selectedLog.phone_number || '-'}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 16, maxHeight: '75vh', overflowY: 'auto', background: '#fff' }}>
          {/* Basic Info */}
          <div className="call-detail__basics" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Perustiedot
              </h3>
              <button
                onClick={() => setShowMoreDetails(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cea78d', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                {showMoreDetails ? 'Piilota lisätiedot' : 'Näytä lisätiedot'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cea78d" strokeWidth="2">{showMoreDetails ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}</svg>
              </button>
            </div>

            {/* Always visible: Name & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div style={{ background: '#f9fafb', padding: 12, borderRadius: 10, border: '1px solid #eef2f7' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
                  Nimi
                </div>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>{selectedLog.customer_name || 'Ei nimeä'}</div>
              </div>

              <div style={{ background: '#f9fafb', padding: 12, borderRadius: 10, border: '1px solid #eef2f7' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Puhelinnumero
                </div>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>{selectedLog.phone_number || '-'}</div>
              </div>
            </div>

            {/* Status & Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div style={{ background: '#f9fafb', padding: 12, borderRadius: 10, border: '1px solid #eef2f7' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  Vastattu
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, background: selectedLog.answered ? '#10b981' : '#ef4444', borderRadius: 9999 }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: selectedLog.answered ? '#065f46' : '#991b1b' }}>{selectedLog.answered ? 'Kyllä' : 'Ei'}</span>
                </div>
              </div>

              <div style={{ background: '#f9fafb', padding: 12, borderRadius: 10, border: '1px solid #eef2f7' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Kesto
                </div>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>{selectedLog.duration ? formatDuration(selectedLog.duration) : '-'}</div>
              </div>
            </div>

            {/* Expandable details */}
            {showMoreDetails && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div style={{ background: '#f9fafb', padding: 12, borderRadius: 10, border: '1px solid #eef2f7' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
                    Sähköposti
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: selectedLog.email ? '#111827' : '#9ca3af', fontStyle: selectedLog.email ? 'normal' : 'italic' }}>
                    {selectedLog.email || 'Ei sähköpostia'}
                  </div>
                </div>
                <div style={{ background: '#f9fafb', padding: 12, borderRadius: 10, border: '1px solid #eef2f7' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Päivämäärä
                  </div>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>
                    {selectedLog.call_date ? new Date(selectedLog.call_date).toLocaleDateString('fi-FI') + ' ' + new Date(selectedLog.call_date).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </div>
                </div>
                <div style={{ background: '#f9fafb', padding: 12, borderRadius: 10, border: '1px solid #eef2f7' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    Puhelun tyyppi
                  </div>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>{selectedLog.call_type || '-'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => setDetailActiveTab('summary')}
              style={{
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                color: detailActiveTab === 'summary' ? '#24170f' : '#6b7280',
                borderBottom: detailActiveTab === 'summary' ? '2px solid #ff6600' : '2px solid transparent',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Yhteenveto
            </button>
            <button
              onClick={() => setDetailActiveTab('transcript')}
              style={{
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                color: detailActiveTab === 'transcript' ? '#24170f' : '#6b7280',
                borderBottom: detailActiveTab === 'transcript' ? '2px solid #ff6600' : '2px solid transparent',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Transkripti
            </button>
            {hasAudioFile && (
              <button
                onClick={() => setDetailActiveTab('audio')}
                style={{
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: detailActiveTab === 'audio' ? '#24170f' : '#6b7280',
                  borderBottom: detailActiveTab === 'audio' ? '2px solid #ff6600' : '2px solid transparent',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Ääni
              </button>
            )}
          </div>

          {/* Tab content */}
          <div style={{ minHeight: 200 }}>
            {detailActiveTab === 'summary' && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 16 }}>
                {selectedLog.summary ? (
                  <div style={{ color: '#1f2937', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedLog.summary}</div>
                ) : (
                  <div style={{ color: '#6b7280', fontSize: 14 }}>Ei yhteenvetoa.</div>
                )}
              </div>
            )}

            {detailActiveTab === 'transcript' && transcriptMessages.length > 0 && (
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  {transcriptMessages.slice(0, transcriptLimit).map((m, idx) => {
                    const bubbleStyle = {
                      padding: 12,
                      borderRadius: 12,
                      maxWidth: '80%',
                      background: m.isBot ? '#f8f5f2' : '#f3f4f6',
                      color: '#111827',
                      border: '1px solid #e2e8f0'
                    }
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: m.isBot ? 'flex-start' : 'flex-end' }}>
                        <div style={bubbleStyle}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
                            {m.isBot ? 'Bot' : displayName}
                          </div>
                          <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.text}</div>
                        </div>
                      </div>
                    )
                  })}
                  {transcriptMessages.length > transcriptLimit && (
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <button
                        onClick={() => setTranscriptLimit(l => l + 200)}
                        style={{ background: '#ff6600', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Näytä lisää ({transcriptMessages.length - transcriptLimit})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

       {detailActiveTab === 'audio' && hasAudioFile && (
         <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6600" strokeWidth="2">
               <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
               <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
             </svg>
             <div>
               <div style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>Puhelun äänitiedosto</div>
               <div style={{ color: '#6b7280', fontSize: 14 }}>
                 {audioLoading ? 'Ladataan äänitiedostoa...' : 'Kuuntele puhelun tallenne'}
               </div>
             </div>
           </div>
           
           {audioLoading ? (
             <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center', 
               padding: '20px',
               color: '#6b7280'
             }}>
               <div style={{ 
                 width: '20px', 
                 height: '20px', 
                 border: '2px solid #e5e7eb', 
                 borderTop: '2px solid #ff6600', 
                 borderRadius: '50%', 
                 animation: 'spin 1s linear infinite',
                 marginRight: '8px'
               }}></div>
               Ladataan...
             </div>
           ) : audioBlobUrl ? (
             <audio 
               controls 
               style={{ width: '100%', height: 40 }}
               preload="metadata"
             >
               <source src={audioBlobUrl} type="audio/mpeg" />
               <source src={audioBlobUrl} type="audio/wav" />
               <source src={audioBlobUrl} type="audio/mp4" />
               <source src={audioBlobUrl} type="audio/ogg" />
               <source src={audioBlobUrl} type="video/mp4" />
               Selaimesi ei tue äänitiedostojen toistoa.
             </audio>
           ) : (
             <div style={{ 
               padding: '20px', 
               textAlign: 'center', 
               color: '#6b7280',
               background: '#f3f4f6',
               borderRadius: '8px'
             }}>
               Äänitiedoston lataus epäonnistui
             </div>
           )}
         </div>
       )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default memo(CallDetailModal)
