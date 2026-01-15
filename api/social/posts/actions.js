import { withOrganization } from '../../_middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../../_lib/cors.js'
import { sendToN8N } from '../../_lib/n8n-client.js'

async function handler(req, res) {
  // CORS headers
  setCorsHeaders(res, ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
  
  // Handle preflight requests
  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      post_id,
      auth_user_id,
      content,
      media_urls = [],
      segments = [],
      scheduled_date,
      publish_date,
      mixpost_api_token,
      mixpost_workspace_uuid,
      post_type, // 'post', 'reel', 'carousel'
      action = 'schedule', // 'schedule', 'publish', tai 'delete'
      selected_accounts = [] // Valitut somekanavat
    } = req.body

    if (!post_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: post_id' 
      })
    }

    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client
    const orgId = req.organization.id

    // Haetaan Mixpost konfiguraatio ja sometilit Supabase:sta
    let mixpostConfig = null
    let socialAccounts = null

    try {
      // Haetaan Mixpost konfiguraatio käyttäen organisaation ID:tä
      const { data: configData, error: configError } = await req.supabase
        .from('user_mixpost_config')
        .select('mixpost_workspace_uuid, mixpost_api_token')
        .eq('user_id', orgId) // Käytetään organisaation ID:tä
        .single()

      if (configError || !configData || !configData.mixpost_workspace_uuid || !configData.mixpost_api_token) {
        return res.status(400).json({ 
          error: 'Mixpost konfiguraatio ei löytynyt',
          details: configError?.message || 'Konfiguraatio puuttuu tai on epätäydellinen',
          orgId: orgId,
          hint: 'Varmista että Mixpost-konfiguraatio on tallennettu käyttäen organisaation ID:tä (public.users.id)'
        })
      }

      mixpostConfig = configData

      // Haetaan yhdistetyt sometilit käyttäen organisaation ID:tä
      const { data: accountsData, error: accountsError } = await req.supabase
        .from('user_social_accounts')
        .select('mixpost_account_uuid, provider, account_name')
        .eq('user_id', orgId) // Käytetään organisaation ID:tä
        .eq('is_authorized', true)

      if (accountsError) {
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
      return res.status(500).json({ 
        error: 'Supabase virhe',
        details: error.message
      })
    }

    // Käytetään valittuja tilejä tai ensimmäistä yhdistettyä tiliä
    let accountIds = []
    
    if (selected_accounts && selected_accounts.length > 0) {
      // Käytä valittuja tilejä
      accountIds = selected_accounts
    } else {
      // Fallback: käytä ensimmäistä yhdistettyä tiliä
      accountIds = [socialAccounts[0].mixpost_account_uuid]
    }

    // Lähetetään data N8N webhook:iin käyttäen sendToN8N-funktiota (HMAC)
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
        // Ignore parsing errors
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
        // Ignore parsing errors
      }
    }
    
    const webhookData = {
      post_id,
      user_id: orgId, // Käytetään organisaation ID:tä
      auth_user_id: req.authUser?.id || auth_user_id, // auth.users.id
      content,
      media_urls,
      segments,
      scheduled_date,
      publish_date, // Keep original for N8N if needed
      date,
      time,
      action,
      post_type, // 'post', 'reel', 'carousel'
      workspace_uuid: mixpost_workspace_uuid || mixpostConfig.mixpost_workspace_uuid,
      mixpost_api_token: mixpost_api_token || mixpostConfig.mixpost_api_token,
      account_ids: accountIds, // Useita tilejä
      selected_accounts: selected_accounts, // Valitut tilit
      timestamp: new Date().toISOString()
    }

    // Lähetetään POST-pyyntö webhook:iin käyttäen sendToN8N-funktiota (HMAC)
    console.log('Sending to N8N webhook:', {
      url: webhookUrl,
      action: action,
      post_id: post_id,
      account_ids: accountIds
    })
    
    let result = { success: true, message: 'Webhook sent successfully' }
    
    try {
      result = await sendToN8N(webhookUrl, webhookData)
      console.log('N8N webhook response:', result)
    } catch (error) {
      console.error('N8N webhook error:', {
        message: error.message,
        url: webhookUrl,
        action: action,
        post_id: post_id
      })
      // Heitä virhe eteenpäin, jotta frontend saa tietää että webhook epäonnistui
      return res.status(500).json({
        success: false,
        error: 'Webhook lähetys epäonnistui: ' + error.message,
        details: {
          webhook_url: webhookUrl,
          action: action
        }
      })
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

export default withOrganization(handler) 