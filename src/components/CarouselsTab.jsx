import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './CarouselsTab.css'
import '../components/ModalComponents.css'

export default function CarouselsTab({ 
  posts = [], 
  onEdit, 
  onDelete, 
  onPublish, 
  onSchedule, 
  onMoveToNext, 
  onDragStart, 
  onDragEnd, 
  draggedPost, 
  t,
  PostCard
}) {
  // Älä näytä Supabasesta tulevia karuselleja - tämä tabi on vain Airtable-karuselleille
  const carouselPosts = []; // Ei näytetä Supabasesta tulevia karuselleja
  
  // Data state
  const [carouselsData, setCarouselsData] = useState([])
  
  // Muokkausten state - tallennetaan muutokset segmentteihin
  const [segmentEdits, setSegmentEdits] = useState({}) // { [recordId]: { text: string, approved: boolean } }
  
  // Tallennuksen state
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  
  // Hae data automaattisesti kun komponentti mountataan
  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        if (!token) {
          return
        }

        const payload = {
          action: 'get',
          verify_only: false
        }

        const response = await fetch('/api/airtable-carousels', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (response.ok) {
          const responseData = data.data || data
          // Datan rakenne: [{ content: { caption, segments: [...] } }, ...]
          if (Array.isArray(responseData)) {
            setCarouselsData(responseData)
          }
          console.log('Data fetched:', responseData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  // Tallenna kaikki muutokset
  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveMessage(null)

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      if (!token) {
        throw new Error('Ei autentikointia')
      }

      // Kerää kaikki muutokset kaikista karuselleista
      const updates = []
      
      carouselsData.forEach((item, carouselIndex) => {
        const content = item.content || {}
        const segments = content.segments || []
        
        segments.forEach((segment, segIndex) => {
          const segmentId = segment.recordId || `segment-${carouselIndex}-${segIndex}`
          const edit = segmentEdits[segmentId]
          
          if (edit) {
            updates.push({
              recordId: segment.recordId,
              carouselRecordId: content.recordId,
              text: edit.text !== undefined ? edit.text : segment.text,
              approved: edit.approved !== undefined ? edit.approved : false
            })
          }
        })
      })

      if (updates.length === 0) {
        setSaveMessage({ type: 'info', text: 'Ei muutoksia tallennettavaksi' })
        return
      }

      const payload = {
        action: 'approve',
        updates: updates
      }

      const response = await fetch('/api/airtable-carousels', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Tallennus epäonnistui')
      }

      setSaveMessage({ type: 'success', text: `Tallennettu ${updates.length} muutosta` })
      
      // Tyhjennä muutokset onnistuneen tallennuksen jälkeen
      setTimeout(() => {
        setSegmentEdits({})
        setSaveMessage(null)
      }, 2000)

    } catch (error) {
      console.error('Error saving changes:', error)
      setSaveMessage({ type: 'error', text: error.message || 'Tallennus epäonnistui' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="carousels-tab-container">
      <div className="carousels-tab-header">
        <h2 className="carousels-tab-title">Karusellit</h2>
        <div className="carousels-header-actions">
          {carouselsData.length > 0 && (
            <span className="carousels-count">{carouselsData.length} karusellia</span>
          )}
          {carouselsData.length > 0 && Object.keys(segmentEdits).length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="carousels-save-btn"
            >
              {saving ? 'Tallennetaan...' : 'Tallenna'}
            </button>
          )}
        </div>
      </div>

      {/* Tallennusviesti */}
      {saveMessage && (
        <div className={`carousels-save-message ${saveMessage.type}`}>
          {saveMessage.text}
        </div>
      )}

      {carouselsData.length === 0 ? (
        <div className="carousels-empty">
          <div className="carousels-empty-icon">🎠</div>
          <p className="carousels-empty-text">Karusellit tulevat tänne.</p>
        </div>
      ) : (
        <div className="carousels-list">
          {carouselsData.map((item, index) => {
            const content = item.content || {}
            const segments = content.segments || []
            
            // Järjestä segmentit slideNo:n mukaan
            const sortedSegments = [...segments].sort((a, b) => {
              const aNum = parseInt(a.slideNo) || 999
              const bNum = parseInt(b.slideNo) || 999
              return aNum - bNum
            })

            return (
              <div key={content.recordId || index} className="carousel-item">
                {/* Vasemmalla 1/4: Caption-laatikko */}
                <div className="carousel-caption-box">
                  <div className="carousel-caption-content">
                    <h3 className="carousel-caption-title">Caption</h3>
                    <p className="carousel-caption-text">{content.caption || 'Ei captionia'}</p>
                  </div>
                </div>

                {/* Oikealla 3/4: Segmentit allekkain */}
                <div className="carousel-segments">
                  {sortedSegments.length === 0 ? (
                    <div className="carousel-segment-empty">
                      <p>Ei segmenttejä</p>
                    </div>
                  ) : (
                    sortedSegments.map((segment, segIndex) => {
                      const segmentId = segment.recordId || `segment-${index}-${segIndex}`
                      const currentText = segmentEdits[segmentId]?.text !== undefined 
                        ? segmentEdits[segmentId].text 
                        : segment.text || ''
                      const currentApproved = segmentEdits[segmentId]?.approved !== undefined
                        ? segmentEdits[segmentId].approved
                        : false
                      
                      return (
                        <div key={segmentId} className="carousel-segment">
                          <div className="carousel-segment-header">
                            <span className="carousel-segment-number">Slide {segment.slideNo || segIndex + 1}</span>
                            <div className="carousel-segment-header-right">
                              {segment.status && (
                                <span className={`carousel-segment-status status-${segment.status.toLowerCase()}`}>
                                  {segment.status}
                                </span>
                              )}
                              <div className="carousel-segment-approved">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={currentApproved}
                                    onChange={(e) => {
                                      setSegmentEdits(prev => ({
                                        ...prev,
                                        [segmentId]: {
                                          ...prev[segmentId],
                                          approved: e.target.checked
                                        }
                                      }))
                                    }}
                                  />
                                  <span className="slider"></span>
                                </label>
                                <span className="carousel-segment-approved-label">Hyväksytty</span>
                              </div>
                            </div>
                          </div>
                          <textarea
                            className="carousel-segment-text-input"
                            value={currentText}
                            onChange={(e) => {
                              setSegmentEdits(prev => ({
                                ...prev,
                                [segmentId]: {
                                  ...prev[segmentId],
                                  text: e.target.value
                                }
                              }))
                            }}
                            placeholder="Segmentin teksti..."
                            rows={3}
                          />
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
