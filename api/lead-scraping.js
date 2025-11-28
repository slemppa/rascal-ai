import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

    // Hae public.users.id
    const { data: userData, error: userError } = await userClient
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (userError || !userData) {
      return res.status(403).json({ error: 'User profile not found' })
    }

    const publicUserId = userData.id

    // Validoi request body
    const { filters, apifyJson, leadLimit } = req.body

    if (!filters || !apifyJson) {
      return res.status(400).json({ error: 'filters and apifyJson are required' })
    }

    const limit = Math.min(parseInt(leadLimit) || 1000, 50000) // Max 50,000

    // N8N webhook URL
    const n8nWebhookUrl = process.env.N8N_LEAD_SCRAPING_URL || 'https://samikiias.app.n8n.cloud/webhook/lead-scraping'
    const n8nSecretKey = process.env.N8N_SECRET_KEY

    if (!n8nWebhookUrl) {
      console.error('N8N_LEAD_SCRAPING_URL webhook URL not configured')
      return res.status(500).json({ error: 'Webhook configuration missing' })
    }

    // Valmistele payload N8N:ään
    const webhookData = {
      user_id: publicUserId,
      auth_user_id: authUser.id,
      filters,
      apifyJson,
      leadLimit: limit,
      timestamp: new Date().toISOString(),
      source: 'rascal-ai-lead-scraping'
    }

    console.log('Sending lead scraping request to N8N:', {
      user_id: publicUserId,
      leadLimit: limit,
      webhookUrl: n8nWebhookUrl,
      hasApiKey: !!n8nSecretKey
    })

    // Lähetä N8N:ään
    const response = await axios.post(n8nWebhookUrl, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        ...(n8nSecretKey ? { 'x-api-key': n8nSecretKey } : {})
      }
    })

    if (!response.ok && response.status !== 200) {
      const errorText = await response.text()
      console.error('N8N webhook error:', response.status, errorText)
      return res.status(500).json({
        error: 'Failed to send data to workflow',
        details: response.statusText
      })
    }

    const result = response.data

    console.log('N8N webhook response:', result)

    return res.status(200).json({
      success: true,
      message: 'Lead scraping started',
      jobId: result?.jobId || result?.id || null,
      data: result
    })

  } catch (error) {
    console.error('Error in lead-scraping endpoint:', error)
    const status = error.response?.status || 500
    const data = error.response?.data || { message: error.message }
    return res.status(status).json({ 
      error: 'Lead scraping error', 
      status, 
      details: data 
    })
  }
}

