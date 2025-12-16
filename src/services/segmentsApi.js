import { supabase } from '../lib/supabase'
export async function fetchSegments(userId) {
  if (!userId) throw new Error('userId puuttuu')
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const response = await fetch(`/api/segments?user_id=${encodeURIComponent(userId)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Segmenttien haku epäonnistui: ${response.status} ${text}`)
  }
  return response.json()
}

export async function createSegmentApi(payload) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const response = await fetch('/api/segments/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Segmentin luonti epäonnistui: ${response.status} ${text}`)
  }
  return response.json()
}

export async function fetchSegmentById(id) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  const response = await fetch(`/api/segments/${encodeURIComponent(id)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Segmentin haku epäonnistui: ${response.status} ${text}`)
  }
  return response.json()
}

export async function fetchSegmentStats(id) {
  const response = await fetch(`/api/segments/${encodeURIComponent(id)}/stats`)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Segmentin tilastojen haku epäonnistui: ${response.status} ${text}`)
  }
  return response.json()
}


