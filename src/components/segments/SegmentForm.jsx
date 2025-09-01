import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../Button'
import SegmentColorPicker from './SegmentColorPicker'
import { createSegmentApi } from '../../services/segmentsApi'

export default function SegmentForm({ userId, onSuccess, onCancel }) {
  const { t } = useTranslation('common')
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
      setError(err.message || t('segments.form.saveError'))
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
        <label htmlFor="name" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{t('segments.form.nameLabel')}</label>
        <input id="name" type="text" required value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder={t('segments.form.namePlaceholder')} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />
      </div>

      <div>
        <label htmlFor="description" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{t('segments.form.descriptionLabel')}</label>
        <textarea id="description" rows={3} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder={t('segments.form.descriptionPlaceholder')} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{t('segments.form.colorLabel')}</label>
        <SegmentColorPicker value={formData.color} onChange={(c) => handleChange('color', c)} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button type="submit" disabled={loading}>{loading ? t('segments.form.submitting') : t('segments.form.submit')}</Button>
        <Button type="button" variant="secondary" onClick={() => (onCancel ? onCancel() : (window.location.href = '/segments'))}>{t('segments.form.cancel')}</Button>
      </div>
    </form>
  )
}


