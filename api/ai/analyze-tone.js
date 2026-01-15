import { sendToN8N } from '../_lib/n8n-client.js'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validoi käyttäjä
    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Hae käyttäjän tiedot
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser(token)
    if (authError || !authUser) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Hae user_id ja social_url body:stä
    const { user_id, social_url } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    if (!social_url || !social_url.trim()) {
      return res.status(400).json({ error: 'social_url is required' })
    }

    // N8N webhook URL
    const n8nWebhookUrl = process.env.N8N_TOV_SCRAPE

    if (!n8nWebhookUrl) {
      return res.status(500).json({ error: 'Webhook configuration missing' })
    }

    // Valmistele payload N8N:ään
    const safePayload = {
      user_id: String(user_id),
      social_url: String(social_url.trim()),
      timestamp: new Date().toISOString(),
      source: 'rascal-ai-tov-analyze'
    }

    const result = await sendToN8N(n8nWebhookUrl, safePayload)

    return res.status(200).json({
      success: true,
      message: 'TOV analysis started',
      tov: result?.tov || null,
      data: result
    })

  } catch (error) {
    return res.status(500).json({ 
      error: 'TOV analysis error', 
      details: error.message 
    })
  }
}

