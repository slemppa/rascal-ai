import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchSegmentById, fetchSegmentStats } from '../services/segmentsApi'
import SegmentStats from '../components/segments/SegmentStats'
import StatusChart from '../components/shared/StatusChart'

export default function SegmentDetailPage() {
  const { id } = useParams()
  const [segment, setSegment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await fetchSegmentById(id)
        const stats = await fetchSegmentStats(id)
        if (mounted) {
          setSegment(data)
          const total = stats.length
          const answered = stats.filter(r => r.answered).length
          const success = stats.filter(r => r.call_outcome === 'success').length
          const failed = total - success
          setChartData([
            { name: 'Success', value: success },
            { name: 'Answered', value: answered },
            { name: 'Failed', value: failed }
          ])
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Virhe haussa')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (id) load()
    return () => { mounted = false }
  }, [id])

  if (loading) return <div style={{ padding: 24 }}>Ladataan...</div>
  if (error) return <div style={{ padding: 24, color: '#dc2626' }}>{error}</div>
  if (!segment) return <div style={{ padding: 24 }}>Ei löydy</div>

  return (
    <div style={{ padding: 24, display: 'grid', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{segment.name}</h1>
        {segment.description && <p style={{ color: '#6b7280', marginTop: 8 }}>{segment.description}</p>}
      </div>
      <SegmentStats segmentId={segment.id} />
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Yhteenveto</h3>
        <StatusChart data={chartData} />
      </div>
    </div>
  )
}


