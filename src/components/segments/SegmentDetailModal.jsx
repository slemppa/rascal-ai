import React, { useEffect, useState } from 'react'
import { fetchSegmentById, fetchSegmentStats } from '../../services/segmentsApi'
import '../ModalComponents.css'

export default function SegmentDetailModal({ segmentId, onClose }) {
  const [segment, setSegment] = useState(null)
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [seg, st] = await Promise.all([
          fetchSegmentById(segmentId),
          fetchSegmentStats(segmentId)
        ])
        if (mounted) {
          setSegment(seg)
          setStats(Array.isArray(st) ? st : [])
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Virhe haussa')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (segmentId) load()
    return () => { mounted = false }
  }, [segmentId])

  const successCount = stats.filter(s => s.call_outcome === 'success').length
  const totalCalls = stats.length
  const answerRate = totalCalls > 0 ? Math.round(stats.filter(s => s.answered).length / totalCalls * 100) : 0

  return (
    <div className="modal-overlay modal-overlay--light" role="dialog" aria-modal="true">
      <div className="modal-container" style={{ maxWidth: 900 }}>
        <div className="modal-header">
          <h2 className="modal-title">Segmentin tiedot</h2>
          <button className="modal-close-btn" onClick={onClose} type="button">×</button>
        </div>
        <div className="modal-content">
          {loading && <div>Ladataan...</div>}
          {error && <div style={{ color: '#dc2626' }}>{error}</div>}
          {!loading && !error && segment && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{segment.name}</h3>
                {segment.description && <p style={{ color: '#6b7280', marginTop: 6 }}>{segment.description}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ color: '#6b7280' }}>Puhelut</div>
                  <div style={{ fontWeight: 600 }}>{totalCalls}</div>
                </div>
                <div>
                  <div style={{ color: '#6b7280' }}>Vastaus%</div>
                  <div style={{ fontWeight: 600 }}>{answerRate}%</div>
                </div>
                <div>
                  <div style={{ color: '#6b7280' }}>Onnistuneet</div>
                  <div style={{ fontWeight: 600 }}>{successCount}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


