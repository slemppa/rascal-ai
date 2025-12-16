import { supabase } from '../lib/supabase'
export async function fetchCampaigns(userId) {
  if (!userId) throw new Error('userId puuttuu')
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const response = await fetch(`/api/campaigns?user_id=${encodeURIComponent(userId)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Kampanjoiden haku epäonnistui: ${response.status} ${text}`)
  }
  return response.json()
}

export async function createCampaignApi(payload) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const response = await fetch('/api/campaigns/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Kampanjan luonti epäonnistui: ${response.status} ${text}`)
  }
  return response.json()
}

export async function fetchCampaignById(id) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const response = await fetch(`/api/campaigns/${encodeURIComponent(id)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Kampanjan haku epäonnistui: ${response.status} ${text}`)
  }
  return response.json()
}

export async function fetchCampaignStats(id, days = 30) {
  const response = await fetch(`/api/campaigns/${encodeURIComponent(id)}/stats?days=${encodeURIComponent(days)}`)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Kampanjan tilastojen haku epäonnistui: ${response.status} ${text}`)
  }
  return response.json()
}

export async function pauseCampaign(id) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const response = await fetch(`/api/campaigns/${encodeURIComponent(id)}/pause`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ id })
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Kampanjan keskeytys epäonnistui: ${response.status} ${text}`)
  }
  return response.json()
}

export async function deleteCampaign(id) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const response = await fetch(`/api/campaigns/${encodeURIComponent(id)}/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ id })
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Kampanjan poisto epäonnistui: ${response.status} ${text}`)
  }
  return response.json()
}


