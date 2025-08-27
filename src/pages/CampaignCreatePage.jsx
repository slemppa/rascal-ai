import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import CampaignForm from '../components/campaigns/CampaignForm'

export default function CampaignCreatePage() {
  const { user } = useAuth()
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Luo uusi kampanja</h1>
      <CampaignForm userId={user?.id} />
    </div>
  )
}


