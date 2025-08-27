import { createClient } from '@supabase/supabase-js'

// GET /api/dashboard-campaign-compare?days=30
// Palauttaa kampanjakohtaiset: { id, name, total, answered, success, successRate }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: 'Missing Supabase env' })

    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Authorization token required' })

    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })

    const days = Math.max(1, Math.min(90, parseInt(req.query.days || '30', 10)))
    const now = new Date()
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Map auth → public.users.id
    const { data: authData, error: authErr } = await userClient.auth.getUser(token)
    if (authErr || !authData?.user) return res.status(401).json({ error: 'Invalid token' })
    const { data: userRow, error: userErr } = await userClient
      .from('users')
      .select('id')
      .eq('auth_user_id', authData.user.id)
      .single()
    if (userErr || !userRow?.id) return res.status(403).json({ error: 'User profile not found' })

    // Hae käyttäjän kampanjat
    const { data: campaigns, error: campErr } = await userClient
      .from('campaigns')
      .select('id, name')
      .eq('user_id', userRow.id)
      .order('created_at', { ascending: false })
    if (campErr) return res.status(500).json({ error: 'Failed to fetch campaigns', details: campErr.message })
    const ids = (campaigns || []).map(c => c.id)
    if (ids.length === 0) return res.status(200).json([])

    // Hae lokit valituille kampanjoille
    const { data: logs, error: logsErr } = await userClient
      .from('call_logs')
      .select('new_campaign_id, answered, call_outcome, created_at')
      .in('new_campaign_id', ids)
      .gte('created_at', start.toISOString())
      .lte('created_at', now.toISOString())
    if (logsErr) return res.status(500).json({ error: 'Failed to fetch logs', details: logsErr.message })

    const agg = {}
    for (const log of logs || []) {
      const cid = log.new_campaign_id
      if (!agg[cid]) agg[cid] = { total: 0, answered: 0, success: 0 }
      agg[cid].total += 1
      if (log.answered) agg[cid].answered += 1
      if ((log.call_outcome || '').toLowerCase() === 'success') agg[cid].success += 1
    }

    const rows = (campaigns || []).map(c => {
      const s = agg[c.id] || { total: 0, answered: 0, success: 0 }
      const successRate = s.total > 0 ? Math.round((s.success / s.total) * 100) : 0
      return { id: c.id, name: c.name, total: s.total, answered: s.answered, success: s.success, successRate }
    })

    return res.status(200).json(rows)
  } catch (e) {
    console.error('dashboard-campaign-compare error:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


