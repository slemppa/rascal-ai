import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchCampaigns } from '../services/campaignsApi'
import StatsCard from '../components/shared/StatsCard'
import CampaignCard from '../components/campaigns/CampaignCard'
import Button from '../components/Button'
import '../components/ModalComponents.css'
import CampaignForm from '../components/campaigns/CampaignForm'

export default function CampaignsPage() {
  const { user } = useAuth()
  const userId = user?.id
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!userId) {
        setLoading(false)
        return
      }
      try {
        const data = await fetchCampaigns(userId)
        if (mounted) setCampaigns(Array.isArray(data) ? data : [])
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
        <p>Ladataan kampanjoita...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <div style={{ color: '#dc2626' }}>Virhe ladattaessa kampanjoita: {error}</div>
      </div>
    )
  }

  const activeCount = campaigns.filter(c => c.status === 'active').length
  const totalCalls = campaigns.reduce((sum, c) => sum + (c.total_calls || 0), 0)
  const answeredCalls = campaigns.reduce((sum, c) => sum + (c.answered_calls || 0), 0)
  const successfulCalls = campaigns.reduce((sum, c) => sum + (c.successful_calls || 0), 0)
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0

  return (
    <div className="container" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Kampanjat</h1>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Hallitse puhelukampanjoitasi ja seuraa niiden suorituskykyä</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Luo uusi kampanja</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatsCard title="Aktiiviset kampanjat" value={activeCount} icon="📊" />
        <StatsCard title="Yhteensä puheluja" value={totalCalls} icon="📞" />
        <StatsCard title="Vastausprosentti" value={`${answerRate}%`} icon="✅" />
        <StatsCard title="Onnistuneita" value={successfulCalls} icon="🎯" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {campaigns.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: '#6b7280', marginBottom: 16 }}>Ei kampanjoita vielä</p>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay modal-overlay--light" role="dialog" aria-modal="true">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Luo uusi kampanja</h2>
              <button className="modal-close-btn" onClick={() => setShowCreate(false)} type="button">×</button>
            </div>
            <div className="modal-content">
              <CampaignForm 
                userId={userId}
                onSuccess={async () => {
                  setShowCreate(false)
                  setLoading(true)
                  try {
                    const data = await fetchCampaigns(userId)
                    setCampaigns(Array.isArray(data) ? data : [])
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
    </div>
  )
}


