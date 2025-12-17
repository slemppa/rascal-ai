import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getUserOrgId } from '../lib/getUserOrgId'
import Button from './Button'

export default function WorkspaceSettings() {
  const { user, organization } = useAuth()
  const [orgId, setOrgId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    mixpost_api_token: '',
    mixpost_workspace_uuid: '',
    is_active: false
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    const fetchOrgId = async () => {
      if (organization?.id) {
        setOrgId(organization.id);
      } else if (user?.id) {
        const id = await getUserOrgId(user.id);
        setOrgId(id);
      }
    };
    fetchOrgId();
  }, [user?.id, organization?.id]);

  useEffect(() => {
    if (orgId) {
      loadWorkspaceConfig()
    }
  }, [orgId])

  const loadWorkspaceConfig = async () => {
    if (!orgId) return;
    
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('user_mixpost_config')
        .select('*')
        .eq('user_id', orgId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setConfig({
          mixpost_api_token: data.mixpost_api_token || '',
          mixpost_workspace_uuid: data.mixpost_workspace_uuid || '',
          is_active: data.is_active || false
        })
      }
    } catch (err) {
      console.error('Error loading Mixpost config:', err)
      setError('Virhe konfiguraation lataamisessa')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!orgId) {
        setError('Organisaation ID puuttuu')
        return;
      }

      const { error } = await supabase
        .from('user_mixpost_config')
        .upsert({
          user_id: orgId,
          mixpost_api_token: config.mixpost_api_token,
          mixpost_workspace_uuid: config.mixpost_workspace_uuid,
          is_active: config.is_active,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setSuccess('Workspace konfiguraatio tallennettu!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error saving Mixpost config:', err)
      setError('Virhe konfiguraation tallentamisessa')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTestResult(null)
      setError('')

      const response = await fetch('/api/integrations/mixpost/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          api_token: config.mixpost_api_token,
          workspace_uuid: config.mixpost_workspace_uuid
        })
      })

      const result = await response.json()

      if (response.ok) {
        setTestResult({ success: true, message: 'Yhteys onnistui!' })
      } else {
        setTestResult({ success: false, message: result.error || 'Yhteys epäonnistui' })
      }
    } catch (err) {
      console.error('Error testing connection:', err)
      setTestResult({ success: false, message: 'Virhe yhteyden testaamisessa' })
    }
  }

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div>Ladataan workspace konfiguraatiota...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 20 }}>
        Workspace Yhdistäminen
      </h2>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* API Token */}
        <div>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            API Token
          </label>
          <input
            type="password"
            value={config.mixpost_api_token}
            onChange={(e) => handleInputChange('mixpost_api_token', e.target.value)}
            placeholder="Syötä API token"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              backgroundColor: '#fff'
            }}
          />
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Löydät API tokenin workspace dashboardista
          </div>
        </div>



        {/* Workspace UUID */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Workspace UUID
          </label>
          <input
            type="text"
            value={config.mixpost_workspace_uuid}
            onChange={(e) => handleInputChange('mixpost_workspace_uuid', e.target.value)}
            placeholder="Syötä workspace UUID"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              backgroundColor: '#fff'
            }}
          />
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Workspace UUID löytyy workspace dashboardista
          </div>
        </div>

        {/* Active Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="checkbox"
            id="is_active"
            checked={config.is_active}
            onChange={(e) => handleInputChange('is_active', e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          <label htmlFor="is_active" style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
            Aktivoi workspace yhdistäminen
          </label>
        </div>

        {/* Error & Success Messages */}
        {error && (
          <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#16a34a' }}>
            {success}
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div style={{ 
            padding: 12, 
            background: testResult.success ? '#f0fdf4' : '#fef2f2', 
            border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`, 
            borderRadius: 8, 
            color: testResult.success ? '#16a34a' : '#dc2626' 
          }}>
            {testResult.message}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            style={{ minWidth: 120 }}
          >
            {saving ? 'Tallennetaan...' : 'Tallenna'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            disabled={!config.mixpost_api_token || !config.mixpost_workspace_uuid}
            style={{ minWidth: 120 }}
          >
            Testaa Yhteys
          </Button>
        </div>
      </form>

      {/* Help Section */}
      <div style={{ marginTop: 40, padding: 20, background: '#f9fafb', borderRadius: 12 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
          Miten löydän workspace tiedot?
        </h3>
        <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
          <p>1. Kirjaudu workspace dashboardiin</p>
          <p>2. Mene Settings → API</p>
          <p>3. Kopioi API token ja workspace UUID</p>
          <p>4. Syötä tiedot yllä oleviin kenttiin</p>
          <p>5. Testaa yhteys ja tallenna konfiguraatio</p>
        </div>
      </div>
    </div>
  )
} 