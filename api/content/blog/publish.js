import { withOrganization } from '../../middleware/with-organization.js'

async function handler(req, res) {
  console.log('blog-publish API called:', req.method, req.url)
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('blog-publish request body:', req.body)
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
      action = 'publish', // Blog-publish käyttää aina 'publish' actionia
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

    console.log('blog-publish: Using orgId:', orgId)

    // Haetaan Mixpost konfiguraatio ja sometilit Supabase:sta
    let mixpostConfig = null
    let socialAccounts = null

    try {
      // Haetaan Mixpost konfiguraatio käyttäen organisaation ID:tä
      console.log('blog-publish: Fetching Mixpost config for orgId:', orgId)
      const { data: configData, error: configError } = await req.supabase
        .from('user_mixpost_config')
        .select('mixpost_workspace_uuid, mixpost_api_token')
        .eq('user_id', orgId) // Käytetään organisaation ID:tä
        .single()

      console.log('blog-publish: Config query result:', { configData, configError })

      if (configError || !configData || !configData.mixpost_workspace_uuid || !configData.mixpost_api_token) {
        console.error('Error fetching mixpost config:', configError)
        console.error('Config data:', configData)
        console.error('Org ID used:', orgId)
        
        // Tarkista onko konfiguraatio olemassa mutta eri user_id:llä (vanha data)
        const { data: allConfigs } = await req.supabase
          .from('user_mixpost_config')
          .select('user_id, mixpost_workspace_uuid')
          .limit(5)
        
        console.log('blog-publish: Sample configs in database:', allConfigs)
        
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

    // Käytetään valittuja tilejä tai ensimmäistä yhdistettyä tiliä
    let accountIds = []
    
    if (selected_accounts && selected_accounts.length > 0) {
      // Käytä valittuja tilejä
      accountIds = selected_accounts
    } else {
      // Fallback: käytä ensimmäistä yhdistettyä tiliä
      accountIds = [socialAccounts[0].mixpost_account_uuid]
    }

    // Lähetetään data N8N webhook:iin
    const webhookUrl = process.env.N8N_BLOG_PUBLISH_URL
    
    if (!webhookUrl) {
      return res.status(500).json({ 
        error: 'N8N_BLOG_PUBLISH_URL ympäristömuuttuja ei ole asetettu',
        hint: 'Aseta N8N_BLOG_PUBLISH_URL Vercel-ympäristömuuttujaksi'
      })
    }
    
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
      user_id: orgId, // Käytetään organisaation ID:tä
      auth_user_id: req.authUser?.id || auth_user_id, // auth.users.id
      content,
      media_urls,
      segments,
      scheduled_date,
      publish_date, // Keep original for N8N if needed
      date,
      time,
      action: 'publish', // Blog-publish käyttää aina 'publish' actionia
      post_type, // 'post', 'reel', 'carousel'
      workspace_uuid: mixpost_workspace_uuid || mixpostConfig.mixpost_workspace_uuid,
      mixpost_api_token: mixpost_api_token || mixpostConfig.mixpost_api_token,
      account_ids: accountIds, // Useita tilejä
      selected_accounts: selected_accounts, // Valitut tilit
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
    let result = { success: true, message: 'Blog published successfully' }
    
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
        result = { success: true, message: 'Blog published successfully' }
      }

    } catch (error) {
      console.error('Webhook request failed:', error)
      return res.status(500).json({
        success: false,
        error: 'Blogin julkaisu epäonnistui',
        details: error.message
      })
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Blog published successfully'
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

export default withOrganization(handler)

