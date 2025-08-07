// Ei käytetä Supabase clientia - kaikki data menee webhookin kautta

export default async function handler(req, res) {
  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { voiceId, script, welcomeMessage, userId, userEmail, userName, companyName, vapiInboundAssistantId, inboundSettingsId } = req.body

    // Validointi
    if (!userId) {
      return res.status(400).json({ error: 'Käyttäjän ID on pakollinen' })
    }

    if (!script || !script.trim()) {
      return res.status(400).json({ error: 'Skripti on pakollinen' })
    }

    // Lähetä webhook N8N:ään
    const webhookUrl = process.env.N8N_INBOUND_SETTINGS_WEBHOOK || 'https://samikiias.app.n8n.cloud/webhook/inbound-settings'
    const secretKey = process.env.N8N_SECRET_KEY
    
    console.log('Webhook URL:', webhookUrl)
    console.log('Secret Key available:', !!secretKey)
    
    if (!secretKey) {
      console.error('N8N_SECRET_KEY ympäristömuuttuja puuttuu')
      return res.status(500).json({ error: 'API-avain puuttuu' })
    }

    const webhookData = {
      user_id: userId,
      contact_email: userEmail,
      contact_person: userName,
      company_name: companyName,
      vapi_inbound_assistant_id: vapiInboundAssistantId,
      inbound_settings_id: inboundSettingsId,
      inbound_settings: {
        voice_id: voiceId,
        script: script.trim(),
        welcome_message: welcomeMessage ? welcomeMessage.trim() : null,
        is_active: true
      },
      timestamp: new Date().toISOString(),
      action: 'save_inbound_settings'
    }

    console.log('Sending inbound settings to N8N:', webhookData)
    console.log('Webhook URL:', webhookUrl)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': secretKey
      },
      body: JSON.stringify(webhookData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('N8N webhook error:', response.status, response.statusText)
      console.error('Response body:', errorText)
      
      // Tarkista onko kyseessä 404 virhe (webhook ei rekisteröity)
      if (response.status === 404) {
        return res.status(500).json({ 
          error: 'Inbound-asetusten tallennus ei onnistu - N8N workflow ei ole aktiivinen',
          details: 'Webhook "inbound-settings" ei ole rekisteröity N8N:ssä. Tarkista että workflow on aktiivinen.'
        })
      }
      
      return res.status(500).json({ 
        error: 'Inbound-asetusten tallennus epäonnistui',
        details: `HTTP ${response.status}: ${errorText}`
      })
    }

    const result = await response.json()
    console.log('N8N webhook response:', result)

    return res.status(200).json({
      success: true,
      message: 'Inbound-asetukset lähetetty webhookin kautta onnistuneesti'
    })

  } catch (error) {
    console.error('Error in save-inbound-settings:', error)
    return res.status(500).json({ 
      error: 'Sisäinen palvelinvirhe',
      details: error.message 
    })
  }
} 