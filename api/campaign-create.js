import { createClient } from '@supabase/supabase-js'

// Sama fallback kuin muissa toimivissa endpointeissa
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Luo userClient tokenilla – käytetään RLS:ää varten
    const authHeader = req.headers['authorization'] || req.headers['Authorization']
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' })
    }
    const token = authHeader.slice(7)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })

    // Vahvista käyttäjä JWT:stä
    let authUserId = null
    try {
      const { data: authResult, error: authError } = await userClient.auth.getUser(token)
      if (!authError && authResult?.user) authUserId = authResult.user.id
    } catch (_) {}
    const payload = req.body || {}
    if (!payload.name) {
      return res.status(400).json({ error: 'name vaaditaan' })
    }

    // Hae public.users.id, joka vastaa auth.users.id:tä (auth_user_id)
    const { data: userRow, error: userRowError } = await userClient
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single()

    if (userRowError || !userRow?.id) {
      return res.status(403).json({ error: 'Käyttäjäprofiilia ei löytynyt' })
    }

    // Insert käyttäjän clientillä -> RLS varmistaa näkyvyyden ja oikeudet
    const { data, error } = await userClient
      .from('campaigns')
      .insert([{ ...payload, user_id: userRow.id }])
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to create campaign', details: error.message })
    }

    res.status(200).json(data)
  } catch (error) {
    console.error('Unhandled error /api/campaign-create:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}


