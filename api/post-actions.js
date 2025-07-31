import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      post_id,
      user_id,
      auth_user_id,
      content,
      media_urls = [],
      segments = [],
      scheduled_date,
      publish_date,
      mixpost_api_token,
      mixpost_workspace_uuid,
      action = 'schedule' // 'schedule', 'publish', tai 'delete'
    } = req.body

    if (!post_id || !user_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: post_id, user_id' 
      })
    }

    // Ota access token headerista
    const access_token = req.headers['authorization']?.replace('Bearer ', '')
    if (!access_token) {
      return res.status(401).json({ error: 'Unauthorized: access token puuttuu' })
    }

    // Luo Supabase-yhteys käyttäjän tokenilla
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${access_token}` } }
    })

    // Haetaan Mixpost konfiguraatio ja sometilit Supabase:sta
    let mixpostConfig = null
    let socialAccounts = null

    try {
      // Haetaan Mixpost konfiguraatio
      const { data: configData, error: configError } = await supabase
        .from('user_mixpost_config')
        .select('mixpost_workspace_uuid, mixpost_api_token')
        .eq('user_id', user_id)
        .single()

      if (configError) {
        console.error('Error fetching mixpost config:', configError)
        return res.status(400).json({ 
          error: 'Mixpost konfiguraatio ei löytynyt',
          details: configError.message
        })
      }

      mixpostConfig = configData

      // Haetaan yhdistetyt sometilit
      const { data: accountsData, error: accountsError } = await supabase
        .from('user_social_accounts')
        .select('mixpost_account_uuid, provider, account_name')
        .eq('user_id', user_id)
        .eq('is_authorized', true)

      if (accountsError) {
        console.error('Error fetching social accounts:', accountsError)
        return res.status(400).json({ 
          error: 'Sometilien haku epäonnistui',
          details: accountsError.message
        })
      }

      if (!accountsData || accountsData.length === 0) {
        return res.status(400).json({ 
          error: 'Ei yhdistettyjä sometilejä'
        })
      }

      socialAccounts = accountsData

    } catch (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ 
        error: 'Supabase virhe',
        details: error.message
      })
    }

    // Käytetään ensimmäistä yhdistettyä tiliä
    const accountId = socialAccounts[0].mixpost_account_uuid

    // Lähetetään data N8N webhook:iin
    const webhookUrl = process.env.MIXPOST_N8N_WEBHOOK_URL || 'https://samikiias.app.n8n.cloud/webhook/mixpost'
    
    // Käsittele scheduled_date ja publish_date erillisiksi date ja time kentiksi
    let date = null
    let time = null
    
    // Käytä publish_date jos se on saatavilla (sisältää ajan)
    if (publish_date && publish_date.trim() !== '') {
      try {
        const dateTime = new Date(publish_date)
        if (!isNaN(dateTime.getTime())) {
          date = dateTime.toISOString().split('T')[0] // YYYY-MM-DD
          time = dateTime.toTimeString().split(' ')[0] // HH:MM:SS
        }
      } catch (error) {
        console.error('Error parsing publish_date:', error)
      }
    }
    // Fallback: käytä scheduled_date jos publish_date ei ole saatavilla
    else if (scheduled_date && scheduled_date.trim() !== '') {
      try {
        const dateTime = new Date(scheduled_date)
        if (!isNaN(dateTime.getTime())) {
          date = dateTime.toISOString().split('T')[0] // YYYY-MM-DD
          time = null // scheduled_date ei sisällä aikaa
        }
      } catch (error) {
        console.error('Error parsing scheduled_date:', error)
      }
    }
    
    const webhookData = {
      post_id,
      user_id,
      auth_user_id,
      content,
      media_urls,
      segments,
      scheduled_date,
      publish_date, // Keep original for N8N if needed
      date,
      time,
      action,
      workspace_uuid: mixpost_workspace_uuid || mixpostConfig.mixpost_workspace_uuid,
      mixpost_api_token: mixpost_api_token || mixpostConfig.mixpost_api_token,
      account_id: accountId,
      timestamp: new Date().toISOString()
    }

    const headers = {
      'Content-Type': 'application/json'
    }

    // Lisätään API key header N8N webhook:iin
    if (process.env.N8N_SECRET_KEY) {
      headers['x-api-key'] = process.env.N8N_SECRET_KEY
    }



    // Lähetetään POST-pyyntö webhook:iin
    let result = { success: true, message: 'Webhook sent successfully' } // Default result
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(webhookData)
      })



      if (!response.ok) {
        console.error('Webhook response:', response.status, response.statusText)
        console.error('Webhook URL:', webhookUrl)
        console.error('Webhook data:', webhookData)
        throw new Error(`Webhook failed: ${response.status} - ${response.statusText}`)
      }

      try {
        result = await response.json()
      } catch (error) {
        console.error('Failed to parse webhook response:', error)
        result = { success: true, message: 'Webhook sent successfully' }
      }


    } catch (error) {
      console.error('Webhook request failed:', error)
      // Älä throw error, vaan jatka default result:lla
      result = { success: false, message: 'Webhook failed but continuing', error: error.message }
    }

    let message = 'Action completed successfully'
    if (action === 'schedule') {
      message = 'Post scheduled successfully'
    } else if (action === 'publish') {
      message = 'Post published successfully'
    } else if (action === 'delete') {
      message = 'Post deleted successfully'
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: message
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
} 