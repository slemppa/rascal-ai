import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
  || process.env.VITE_SUPABASE_ANON_KEY 
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

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

  try {
    const id = req.query.id
    const days = parseInt(req.query.days || '30', 10)
    if (!id) return res.status(400).json({ error: 'id puuttuu' })

    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('call_logs')
      .select('call_date, answered, call_outcome, call_status')
      .eq('new_campaign_id', id)
      .gte('call_date', sinceIso)
      .order('call_date', { ascending: true })

    if (error) return res.status(500).json({ error: 'Failed to fetch stats', details: error.message })
    res.status(200).json(data || [])
  } catch (error) {
    console.error('Unhandled error /api/campaign-stats:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}


