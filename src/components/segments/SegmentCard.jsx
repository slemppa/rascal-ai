import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function SegmentCard({ segment }) {
  const { t, i18n } = useTranslation('common')
  return (
    <Link to={`/segments/${segment.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
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
            <div style={{ color: '#6b7280', fontSize: 14 }}>{t('segments.card.contacts')}</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{segment.total_contacts || 0}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#6b7280', fontSize: 12 }}>{t('segments.card.created')}</div>
            <div style={{ fontSize: 14 }}>{segment.created_at ? new Date(segment.created_at).toLocaleDateString(i18n.language === 'fi' ? 'fi-FI' : 'en-US') : '-'}</div>
          </div>
        </div>
      </div>
    </Link>
  )
}


