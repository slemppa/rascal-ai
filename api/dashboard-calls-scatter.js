import { createClient } from '@supabase/supabase-js'

// GET /api/dashboard-calls-scatter?days=30
// Palauttaa pisteitä: { label, avgDurationSec, successRate, count }
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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

    // Hae public.users.id tokenin perusteella
    const { data: authData, error: authErr } = await userClient.auth.getUser(token)
    if (authErr || !authData?.user) return res.status(401).json({ error: 'Invalid token' })
    const authUserId = authData.user.id
    const { data: userRow, error: userErr } = await userClient
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single()
    if (userErr || !userRow?.id) return res.status(403).json({ error: 'User profile not found' })

    // Hae puhelulokit (kesto + onnistuminen)
    const { data: logs, error: logsErr } = await userClient
      .from('call_logs')
      .select('created_at, call_date, duration, answered, call_outcome')
      .eq('user_id', userRow.id)
      .gte('call_date', start.toISOString())
      .lte('call_date', now.toISOString())
    if (logsErr) return res.status(500).json({ error: 'Failed to fetch logs', details: logsErr.message })

    // Apu: muunna duration sekunneiksi
    const toSeconds = (d) => {
      if (d == null) return null
      if (typeof d === 'number') return d
      if (typeof d === 'string') {
        if (d.includes(':')) {
          const [mm, ss] = d.split(':').map(v => parseInt(v, 10) || 0)
          return mm * 60 + ss
        }
        const n = parseInt(d, 10)
        if (!Number.isNaN(n)) return n
      }
      return null
    }

    // Binataan kestot
    const bins = [
      { key: '0-30s', min: 0, max: 30 },
      { key: '31-60s', min: 31, max: 60 },
      { key: '61-120s', min: 61, max: 120 },
      { key: '121-300s', min: 121, max: 300 },
      { key: '300s+', min: 301, max: Infinity }
    ]
    const acc = bins.reduce((m, b) => { m[b.key] = { sum: 0, count: 0, success: 0 } ; return m }, {})

    for (const row of logs || []) {
      const sec = toSeconds(row.duration)
      if (sec == null) continue
      const bin = bins.find(b => sec >= b.min && sec <= b.max)
      if (!bin) continue
      const bucket = acc[bin.key]
      bucket.sum += sec
      bucket.count += 1
      if (row.answered === true) bucket.success += 1
    }

    const points = bins.map(b => {
      const bucket = acc[b.key]
      const avgDurationSec = bucket.count > 0 ? Math.round(bucket.sum / bucket.count) : 0
      const successRate = bucket.count > 0 ? Math.round((bucket.success / bucket.count) * 100) : 0
      return { label: b.key, avgDurationSec, successRate, count: bucket.count }
    })

    return res.status(200).json(points)
  } catch (e) {
    console.error('dashboard-calls-scatter error:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


