import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchSegmentStats } from '../../services/segmentsApi'

export default function SegmentStats({ segmentId }) {
  const { t } = useTranslation('common')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const rows = await fetchSegmentStats(segmentId)
        if (mounted) setData(rows || [])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (segmentId) load()
    return () => { mounted = false }
  }, [segmentId])

  if (loading) return <div>{t('segments.statsBoard.loading')}</div>

  const total = data.length
  const answered = data.filter(r => r.answered).length
  const success = data.filter(r => r.call_outcome === 'success').length
  const answerRate = total > 0 ? Math.round((answered / total) * 100) : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 12 }}>{t('segments.statsBoard.calls')}</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{total}</div>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 12 }}>{t('segments.statsBoard.answered')}</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{answered}</div>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 12 }}>{t('segments.statsBoard.successful')}</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{success}</div>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 12 }}>{t('segments.statsBoard.answerRateShort')}</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{answerRate}%</div>
      </div>
    </div>
  )
}


