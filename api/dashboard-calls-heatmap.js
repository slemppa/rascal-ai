import { createClient } from '@supabase/supabase-js'

// GET /api/dashboard-calls-heatmap?days=30
// Palauttaa 7x24 lämpökartan: { day (0-6, Ma=1...), hour (0-23), total, success }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

    const { data: logs, error: logsErr } = await userClient
      .from('call_logs')
      .select('created_at, call_date, call_time, answered, call_outcome')
      .eq('user_id', userRow.id)
      .gte('call_date', start.toISOString())
      .lte('call_date', now.toISOString())
    if (logsErr) return res.status(500).json({ error: 'Failed to fetch logs', details: logsErr.message })

    const grid = {}
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        grid[`${d}-${h}`] = { day: d, hour: h, total: 0, success: 0 }
      }
    }

    for (const row of logs || []) {
      const dt = new Date(row.call_date || row.created_at)
      // JS: 0=Su, 1=Ma, ..., 6=La → muutetaan 1..6,0 (alk. Ma)
      const jsDay = dt.getDay() // 0..6
      const day = (jsDay + 6) % 7 // 0=Ma, 6=Su
      const hour = (row.call_time && typeof row.call_time === 'string' && row.call_time.includes(':'))
        ? parseInt(row.call_time.slice(0,2), 10)
        : dt.getHours()
      const key = `${day}-${hour}`
      const bucket = grid[key]
      if (!bucket) continue
      bucket.total += 1
      if (row.answered === true) bucket.success += 1
    }

    return res.status(200).json(Object.values(grid))
  } catch (e) {
    console.error('dashboard-calls-heatmap error:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


