import axios from 'axios'
import { withOrganization } from '../middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../lib/cors.js'

const N8N_STRATEGY_APPROVAL_URL = process.env.N8N_STRATEGY_APPROVEMENT || process.env.N8N_STRATEGY_ARPPVOMENT || 'https://samikiias.app.n8n.cloud/webhook/strategy-approvment'
const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

async function handler(req, res) {
  setCorsHeaders(res, ['POST', 'OPTIONS'])
  
  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { strategy_id, company_id, user_id } = req.body

    if (!strategy_id || !company_id || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Tarkista että middleware on asettanut organization ja supabase
    if (!req.organization || !req.organization.id) {
      console.error('❌ req.organization missing in strategy approve handler')
      return res.status(500).json({ error: 'Organization context missing' })
    }

    if (!req.supabase) {
      console.error('❌ req.supabase missing in strategy approve handler')
      return res.status(500).json({ error: 'Supabase client missing' })
    }

    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client
    const publicUserId = req.organization.id

    // Hae strategian tiedot ja poimi kuukausi strategy_id:n perusteella
    const { data: strategyData, error: strategyError } = await req.supabase
      .from('content_strategy')
      .select('month')
      .eq('id', strategy_id)
      .single()

    if (strategyError || !strategyData) {
      console.error('Error fetching strategy by id:', strategyError)
      return res.status(404).json({ error: 'Strategiaa ei löytynyt annetulla strategy_id:llä' })
    }

    const month = strategyData.month || null

    console.log('🚀 Lähetetään strategian vahvistus webhook...')
    console.log('URL:', N8N_STRATEGY_APPROVAL_URL)
    console.log('API Key:', N8N_SECRET_KEY ? '✅ Asetettu' : '❌ Puuttuu')
    console.log('Auth user_id:', req.authUser?.id || user_id)
    console.log('Public user_id (orgId):', publicUserId)

    const response = await axios.post(N8N_STRATEGY_APPROVAL_URL, {
      action: 'strategy_approved',
      strategy_id,
      month,
      company_id,
      user_id: publicUserId, // Käytetään organisaation ID:tä (public.users.id)
      auth_user_id: req.authUser?.id || user_id, // Säilytetään myös auth.users.id referenssinä
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
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    })
    return res.status(500).json({ 
      error: 'Failed to send strategy approval webhook',
      details: error.message,
      response: error.response?.data || null
    })
  }
}

export default withOrganization(handler)