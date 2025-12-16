import { createClient } from '@supabase/supabase-js'
import logger from '../../lib/logger.js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
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

  try {
    const id = req.query.id
    if (!id) return res.status(400).json({ error: 'id puuttuu' })

    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data, error } = await userClient
      .from('contact_segments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return res.status(500).json({ error: 'Failed to fetch segment', details: error.message })
    res.status(200).json(data)
  } catch (error) {
    logger.error('Unhandled error /api/segment-by-id:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}


