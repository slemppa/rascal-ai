import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    // N8N webhook URL (hakee datan Notionista)
    const n8nWebhookUrl = process.env.N8N_LEADMAGNET_GET || 'https://samikiias.app.n8n.cloud/webhook/leadmagnet-get'
    const n8nSecretKey = process.env.N8N_SECRET_KEY
    
    if (!n8nWebhookUrl) {
      console.error('N8N_LEADMAGNET_GET webhook URL not configured')
      return res.status(500).json({ error: 'Webhook configuration missing' })
    }

    console.log('Fetching lead magnet from N8N:', {
      token,
      webhookUrl: n8nWebhookUrl,
      hasApiKey: !!n8nSecretKey
    })

    // Kutsu N8N webhookia, joka hakee datan Notionista
    const n8nResponse = await axios.post(n8nWebhookUrl, {
      token,
      action: 'get_leadmagnet'
    }, {
      headers: n8nSecretKey ? { 'x-api-key': n8nSecretKey } : {}
    })
    
    console.log('N8N response status:', n8nResponse.status)

    const leadMagnetData = n8nResponse.data

    // Tarkista että data löytyi
    if (!leadMagnetData || !leadMagnetData.email) {
      return res.status(404).json({ error: 'Lead magnet not found' })
    }

    // Jos video ei ole vielä valmis
    if (leadMagnetData.status !== 'ready' || !leadMagnetData.video_url) {
      return res.status(200).json({
        status: leadMagnetData.status || 'processing',
        message: 'Video is still processing',
        email: leadMagnetData.email
      })
    }

    // Päivitä katselukerrat Notionissa N8N:n kautta (async, ei odoteta)
    axios.post(n8nWebhookUrl, {
      token,
      action: 'increment_view_count'
    }, {
      headers: n8nSecretKey ? { 'x-api-key': n8nSecretKey } : {}
    }).catch(err => console.error('Failed to update view count:', err))

    // Palauta data (N8N palauttaa jo valmiin video URL:n)
    return res.status(200).json({
      status: 'ready',
      email: leadMagnetData.email,
      videoUrl: leadMagnetData.video_url,
      title: leadMagnetData.title || '',
      description: leadMagnetData.description || '',
      createdAt: leadMagnetData.created_at,
      metadata: leadMagnetData.metadata || {}
    })

  } catch (error) {
    console.error('Error in leadmagnet endpoint:', error)
    const status = error.response?.status || 500
    const data = error.response?.data || { message: error.message }
    return res.status(status).json({ error: 'Lead magnet error', status, details: data })
  }
}

