import React, { useEffect, useState } from 'react'
import Button from '../Button'
import { createCampaignApi } from '../../services/campaignsApi'
import { supabase } from '../../lib/supabase'

export default function CampaignForm({ userId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    call_type_id: '',
    daily_call_limit: 50,
    max_attempts_per_contact: 3,
    status: 'active'
  })
  const [callTypes, setCallTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadCallTypes() {
      if (!userId) return
      try {
        // Hae public.users.id auth_user_id:n perusteella
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', userId)
          .single()

        if (userError || !userData) return

        const publicUserId = userData.id

        // Hae call_types suoraan RLS:n läpi
        const { data: types, error } = await supabase
          .from('call_types')
          .select('id,name')
          .eq('user_id', publicUserId)
          .order('created_at', { ascending: false })

        if (error) return

        const options = (types || []).map(ct => ({ id: ct.id, name: ct.name }))
        if (mounted) setCallTypes(options)
      } catch (e) {
        // ignore
      }
    }
    loadCallTypes()
    return () => { mounted = false }
  }, [userId])

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
        <label htmlFor="name" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Kampanjan nimi *</label>
        <input id="name" type="text" required value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Esim. Q3 Follow-up kampanja" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />
      </div>

      <div>
        <label htmlFor="description" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Kuvaus</label>
        <textarea id="description" rows={4} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Lyhyt kuvaus kampanjan tarkoituksesta..." style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />
      </div>

      <div>
        <label htmlFor="call_type" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Soittoskripti</label>
        <select id="call_type" value={formData.call_type_id} onChange={(e) => handleChange('call_type_id', e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }}>
          <option value="">Valitse soittoskripti</option>
          {callTypes.map(ct => (
            <option key={ct.id} value={ct.id}>{ct.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label htmlFor="daily_limit" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Päivittäinen raja</label>
          <input id="daily_limit" type="number" min={1} value={formData.daily_call_limit} onChange={(e) => handleChange('daily_call_limit', parseInt(e.target.value || '0', 10))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />
        </div>
        <div>
          <label htmlFor="max_attempts" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Max yritykset per kontakti</label>
          <input id="max_attempts" type="number" min={1} max={10} value={formData.max_attempts_per_contact} onChange={(e) => handleChange('max_attempts_per_contact', parseInt(e.target.value || '0', 10))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button type="submit" disabled={loading}>{loading ? 'Luodaan...' : 'Luo kampanja'}</Button>
        <Button type="button" variant="secondary" onClick={() => (onCancel ? onCancel() : (window.location.href = '/campaigns'))}>Peruuta</Button>
      </div>
    </form>
  )
}


