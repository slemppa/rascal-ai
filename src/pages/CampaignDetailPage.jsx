import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchCampaignById } from '../services/campaignsApi'
import CampaignStats from '../components/campaigns/CampaignStats'
import CampaignStatusBadge from '../components/campaigns/CampaignStatusBadge'

export default function CampaignDetailPage() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await fetchCampaignById(id)
        if (mounted) setCampaign(data)
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
  if (!campaign) return <div style={{ padding: 24 }}>Ei löydy</div>

  return (
    <div style={{ padding: 24, display: 'grid', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{campaign.name}</h1>
          {campaign.description && <p style={{ color: '#6b7280', marginTop: 8 }}>{campaign.description}</p>}
        </div>
        <CampaignStatusBadge status={campaign.status} />
      </div>
      <CampaignStats campaignId={campaign.id} />
    </div>
  )
}


