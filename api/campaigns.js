import { createClient } from '@supabase/supabase-js'

// Fallbackit paikalliseen deviin: käytä palvelinenv > VITE_ > NEXT_PUBLIC_
const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY 
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ 
      error: 'Supabase config missing',
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseAnonKey)
    })
  }

  try {
    const idParam = req.query.user_id
    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    // Authentikoitu client käyttäjän JWT:llä, jotta RLS toimii
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    if (!idParam) {
      return res.status(400).json({ error: 'user_id puuttuu kyselystä' })
    }

    // idParam voi olla joko public.users.id TAI auth.users.id (users.auth_user_id)
    // Selvitetään public.users.id ennen kampanjoiden hakua
    let publicUserId = null

    // Selvitä public.users.id joko suoraan idParamista tai auth_user_id:n kautta
    const { data: directUser } = await userClient
      .from('users')
      .select('id')
      .eq('id', idParam)
      .maybeSingle()
    if (directUser?.id) publicUserId = directUser.id

    if (!publicUserId) {
      const { data: byAuthUser } = await userClient
        .from('users')
        .select('id')
        .eq('auth_user_id', idParam)
        .maybeSingle()
      if (byAuthUser?.id) publicUserId = byAuthUser.id
    }

    if (!publicUserId) {
      // Ei vastaavaa käyttäjää → palautetaan tyhjä lista
      return res.status(200).json([])
    }

    // Hae kampanjat ja call_types-relaatio
    const { data: campaigns, error: campaignsError } = await userClient
      .from('campaigns')
      .select('*, call_types(name)')
      .eq('user_id', publicUserId)
      .order('created_at', { ascending: false })

    if (campaignsError) {
      return res.status(500).json({ error: 'Failed to fetch campaigns', details: campaignsError.message })
    }

    if (!campaigns || campaigns.length === 0) {
      return res.status(200).json([])
    }

    const campaignIds = campaigns.map(c => c.id)

    // Hae call_logs rivit ja laske aggregaatit muistissa
    const { data: logs, error: logsError } = await userClient
      .from('call_logs')
      .select('new_campaign_id, answered, call_outcome')
      .in('new_campaign_id', campaignIds)

    if (logsError) {
      // Jos lokien haku epäonnistuu, palauta kampanjat ilman tilastoja
      return res.status(200).json(campaigns.map(c => ({
        ...c,
        total_calls: 0,
        answered_calls: 0,
        successful_calls: 0
      })))
    }

    const statsByCampaign = {}
    for (const log of logs || []) {
      const cid = log.new_campaign_id
      if (!statsByCampaign[cid]) {
        statsByCampaign[cid] = { total_calls: 0, answered_calls: 0, successful_calls: 0 }
      }
      statsByCampaign[cid].total_calls += 1
      if (log.answered) statsByCampaign[cid].answered_calls += 1
      if (log.call_outcome === 'success') statsByCampaign[cid].successful_calls += 1
    }

    const enriched = campaigns.map(c => ({
      ...c,
      total_calls: statsByCampaign[c.id]?.total_calls || 0,
      answered_calls: statsByCampaign[c.id]?.answered_calls || 0,
      successful_calls: statsByCampaign[c.id]?.successful_calls || 0
    }))

    res.status(200).json(enriched)
  } catch (error) {
    console.error('Unhandled error /api/campaigns:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}


