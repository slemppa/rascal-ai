import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../Button'
import { createCampaignApi } from '../../services/campaignsApi'

export default function CampaignForm({ userId, onSuccess, onCancel }) {
  const { t } = useTranslation('common')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
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
      const created = await createCampaignApi(payload)
      if (onSuccess) {
        onSuccess(created)
      } else {
        window.location.href = '/campaigns'
      }
    } catch (err) {
      setError(err.message || t('campaigns.form.saveError'))
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
        <label htmlFor="name" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{t('campaigns.form.nameLabel')}</label>
        <input id="name" type="text" required value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder={t('campaigns.form.namePlaceholder')} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />
      </div>

      <div>
        <label htmlFor="description" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{t('campaigns.form.descriptionLabel')}</label>
        <textarea id="description" rows={4} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder={t('campaigns.form.descriptionPlaceholder')} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button type="submit" disabled={loading}>{loading ? t('campaigns.form.submitting') : t('campaigns.form.submit')}</Button>
        <Button type="button" variant="secondary" onClick={() => (onCancel ? onCancel() : (window.location.href = '/campaigns'))}>{t('campaigns.form.cancel')}</Button>
      </div>
    </form>
  )
}


