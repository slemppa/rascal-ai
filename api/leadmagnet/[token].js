import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Vain GET-pyynnöt
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    // N8N webhook URL (hakee datan Notionista)
    const n8nWebhookUrl = process.env.N8N_LEADMAGNET_GET || 'https://samikiias.app.n8n.cloud/webhook/leadmagnet-get'
    
    if (!n8nWebhookUrl) {
      console.error('N8N_LEADMAGNET_GET webhook URL not configured')
      return res.status(500).json({ error: 'Webhook configuration missing' })
    }

    console.log('Fetching lead magnet data from Notion via N8N:', token)

    // Kutsu N8N webhookia, joka hakee datan Notionista
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_SECRET_KEY
      },
      body: JSON.stringify({
        token,
        action: 'get_leadmagnet'
      })
    })

    if (!n8nResponse.ok) {
      console.error('N8N webhook error:', n8nResponse.status, n8nResponse.statusText)
      return res.status(404).json({ error: 'Lead magnet not found' })
    }

    const leadMagnetData = await n8nResponse.json()

    // Tarkista että data löytyi
    if (!leadMagnetData || !leadMagnetData.email) {
      return res.status(404).json({ error: 'Lead magnet not found' })
    }

    // Jos video ei ole vielä valmis
    if (leadMagnetData.status !== 'ready' || !leadMagnetData.video_path) {
      return res.status(200).json({
        status: leadMagnetData.status || 'processing',
        message: 'Video is still processing',
        email: leadMagnetData.email
      })
    }

    // Luo signed URL videolle Supabase Storagesta (voimassa 24h)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase configuration missing' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('leadmagnet')
      .createSignedUrl(leadMagnetData.video_path, 86400) // 24h

    if (urlError) {
      console.error('Error creating signed URL:', urlError)
      return res.status(500).json({ error: 'Failed to generate video URL' })
    }

    // Päivitä katselukerrat Notionissa N8N:n kautta
    try {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.N8N_SECRET_KEY
        },
        body: JSON.stringify({
          token,
          action: 'increment_view_count'
        })
      })
    } catch (viewUpdateError) {
      console.error('Failed to update view count:', viewUpdateError)
      // Ei keskeytä pyyntöä, jos katselukertojen päivitys epäonnistuu
    }

    // Palauta data
    return res.status(200).json({
      status: 'ready',
      email: leadMagnetData.email,
      videoUrl: signedUrlData.signedUrl,
      createdAt: leadMagnetData.created_at,
      metadata: leadMagnetData.metadata || {}
    })

  } catch (error) {
    console.error('Error in leadmagnet endpoint:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

