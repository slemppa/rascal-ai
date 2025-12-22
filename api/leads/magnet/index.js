import { sendToN8N } from '../lib/n8n-client.js'

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
    
    if (!n8nWebhookUrl) {
      return res.status(500).json({ error: 'Webhook configuration missing' })
    }

    // Kutsu N8N webhookia, joka hakee datan Notionista
    const safePayload = {
      token: String(token),
      action: 'get_leadmagnet'
    }

    const leadMagnetData = await sendToN8N(n8nWebhookUrl, safePayload)

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
    sendToN8N(n8nWebhookUrl, {
      token: String(token),
      action: 'increment_view_count'
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

