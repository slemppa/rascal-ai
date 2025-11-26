import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY 
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ 
      error: 'Supabase config missing',
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseAnonKey)
    })
  }

  try {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ error: 'campaign id puuttuu' })

    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Poista kampanja (RLS varmistaa että käyttäjä voi poistaa vain omia kampanjojaan)
    const { error: deleteError } = await userClient
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return res.status(500).json({ error: 'Kampanjan poisto epäonnistui', details: deleteError.message })
    }

    res.status(200).json({
      success: true,
      message: 'Kampanja poistettu onnistuneesti'
    })
  } catch (error) {
    console.error('Unhandled error /api/campaign-delete:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}


