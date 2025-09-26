import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const N8N_STRATEGY_APPROVAL_URL = process.env.N8N_STRATEGY_ARPPVOMENT || 'https://samikiias.app.n8n.cloud/webhook/strategy-approvment'
const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { strategy_id, month, company_id, user_id } = req.body

    if (!strategy_id || !month || !company_id || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Hae access token headerista
    const access_token = req.headers['authorization']?.replace('Bearer ', '')
    if (!access_token) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    // Luo Supabase client käyttäjän tokenilla
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${access_token}` } }
    })

    // Hae public.users.id käyttäen auth_user_id:tä
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user_id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user data:', userError)
      return res.status(500).json({ error: 'Käyttäjätietojen haku epäonnistui' })
    }

    const publicUserId = userData.id

    console.log('🚀 Lähetetään strategian vahvistus webhook...')
    console.log('URL:', N8N_STRATEGY_APPROVAL_URL)
    console.log('API Key:', N8N_SECRET_KEY ? '✅ Asetettu' : '❌ Puuttuu')
    console.log('Auth user_id:', user_id)
    console.log('Public user_id:', publicUserId)

    const response = await axios.post(N8N_STRATEGY_APPROVAL_URL, {
      action: 'strategy_approved',
      strategy_id,
      month,
      company_id,
      user_id: publicUserId, // Käytetään public.users.id:tä
      auth_user_id: user_id, // Säilytetään myös auth.users.id referenssinä
      approved_at: new Date().toISOString()
    }, {
      headers: {
        'x-api-key': N8N_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    })

    console.log('✅ Strategy approval webhook sent successfully:', response.status, response.data)
    
    return res.status(200).json({ 
      success: true, 
      message: 'Strategy approval webhook sent successfully',
      webhook_response: response.data
    })

  } catch (error) {
    console.error('❌ Error in strategy-approve API:', error)
    return res.status(500).json({ 
      error: 'Failed to send strategy approval webhook',
      details: error.message
    })
  }
}