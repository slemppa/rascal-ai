import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchSegments } from '../services/segmentsApi'
import StatsCard from '../components/shared/StatsCard'
import Button from '../components/Button'
import '../components/ModalComponents.css'
import SegmentForm from '../components/segments/SegmentForm'

import SegmentDetailModal from '../components/segments/SegmentDetailModal'

function SegmentCard({ segment, onOpen }) {
  return (
    <div onClick={() => onOpen(segment.id)} style={{
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      background: '#fff',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
    }}>
      <div style={{ padding: 16, paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: segment.color || '#111827' }} />
          <div style={{ fontSize: 18, fontWeight: 600 }}>{segment.name}</div>
        </div>
        {segment.description && (
          <div style={{ marginTop: 6, color: '#6b7280', fontSize: 14 }}>{segment.description}</div>
        )}
      </div>
      <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: 14 }}>Kontaktit</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{segment.total_contacts || 0}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Luotu</div>
          <div style={{ fontSize: 14 }}>{segment.created_at ? new Date(segment.created_at).toLocaleDateString('fi-FI') : '-'}</div>
        </div>
      </div>
    </div>
  )
}

export default function SegmentsPage() {
  const { t, i18n } = useTranslation('common')
  const { user } = useAuth()
  const userId = user?.id
  const navigate = useNavigate()
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [openSegmentId, setOpenSegmentId] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!userId) {
        setLoading(false)
        return
      }
      try {
        const data = await fetchSegments(userId)
        if (mounted) setSegments(Array.isArray(data) ? data : [])
      } catch (err) {
        if (mounted) setError(err.message || 'Tuntematon virhe')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [userId])

  if (loading) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <p>{t('segments.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <div style={{ color: '#dc2626' }}>{t('segments.error')}: {error}</div>
      </div>
    )
  }

  const totalContacts = segments.reduce((sum, s) => sum + (s.total_contacts || 0), 0)

  return (
    <div className="container" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{t('segments.header.title')}</h1>
          <p style={{ color: '#6b7280', marginTop: 8 }}>{t('segments.header.description')}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>{t('segments.actions.create')}</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatsCard title={t('segments.stats.totalSegments')} value={segments.length} icon="🎯" />
        <StatsCard title={t('segments.stats.totalContacts')} value={totalContacts} icon="👥" />
        <StatsCard title={t('segments.stats.avgPerSegment')} value={segments.length > 0 ? Math.round(totalContacts / segments.length) : 0} icon="📊" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
        {segments.map((segment) => (
          <SegmentCard key={segment.id} segment={segment} onOpen={(id) => setOpenSegmentId(id)} />
        ))}
      </div>

      {segments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: '#6b7280', marginBottom: 16 }}>{t('segments.empty')}</p>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay modal-overlay--light" role="dialog" aria-modal="true">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">{t('segments.actions.create')}</h2>
              <button className="modal-close-btn" onClick={() => setShowCreate(false)} type="button">×</button>
            </div>
            <div className="modal-content">
              <SegmentForm
                userId={userId}
                onSuccess={async () => {
                  setShowCreate(false)
                  setLoading(true)
                  try {
                    const data = await fetchSegments(userId)
                    setSegments(Array.isArray(data) ? data : [])
                  } finally {
                    setLoading(false)
                  }
                }}
                onCancel={() => setShowCreate(false)}
              />
            </div>
          </div>
        </div>
      )}

      {openSegmentId && (
        <SegmentDetailModal segmentId={openSegmentId} onClose={() => setOpenSegmentId(null)} />
      )}
    </div>
  )
}


