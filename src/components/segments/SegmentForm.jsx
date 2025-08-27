import React, { useState } from 'react'
import Button from '../Button'
import SegmentColorPicker from './SegmentColorPicker'
import { createSegmentApi } from '../../services/segmentsApi'

export default function SegmentForm({ userId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { ...formData, user_id: userId }
      const created = await createSegmentApi(payload)
      if (onSuccess) {
        onSuccess(created)
      } else {
        window.location.href = '/segments'
      }
    } catch (err) {
      setError(err.message || 'Virhe tallennuksessa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      {error && (
        <div style={{ padding: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: 8 }}>{error}</div>
      )}

      <div>
        <label htmlFor="name" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Segmentin nimi *</label>
        <input id="name" type="text" required value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Esim. Lämpimät liidit" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />
      </div>

      <div>
        <label htmlFor="description" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Kuvaus</label>
        <textarea id="description" rows={3} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Kuvaile segmenttiä..." style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Väri</label>
        <SegmentColorPicker value={formData.color} onChange={(c) => handleChange('color', c)} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button type="submit" disabled={loading}>{loading ? 'Luodaan...' : 'Luo segmentti'}</Button>
        <Button type="button" variant="secondary" onClick={() => (onCancel ? onCancel() : (window.location.href = '/segments'))}>Peruuta</Button>
      </div>
    </form>
  )
}


