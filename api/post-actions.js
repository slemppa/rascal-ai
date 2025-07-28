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
      scheduled_date,
      action = 'schedule' // 'schedule', 'publish', tai 'delete'
    } = req.body

    if (!post_id || !user_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: post_id, user_id' 
      })
    }

    // Lähetetään data N8N webhook:iin
    const webhookUrl = process.env.MIXPOST_N8N_WEBHOOK_URL || 'https://samikiias.app.n8n.cloud/webhook/mixpost'
    
    const webhookData = {
      post_id,
      user_id,
      auth_user_id,
      content,
      media_urls,
      scheduled_date,
      action,
      timestamp: new Date().toISOString()
    }

    const headers = {
      'Content-Type': 'application/json'
    }

    // Lisätään API key header N8N webhook:iin
    if (process.env.N8N_SECRET_KEY) {
      headers['x-api-key'] = process.env.N8N_SECRET_KEY
      console.log('Using API key header')
    } else {
      console.log('No API key found in environment')
    }

    console.log('Sending webhook to:', webhookUrl)
    console.log('Webhook data:', webhookData)
    console.log('Headers:', headers)

    // Lähetetään POST-pyyntö webhook:iin
    console.log('Sending POST request to webhook...')
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(webhookData)
      })

      console.log('POST response status:', response.status)

      if (!response.ok) {
        console.error('Webhook response:', response.status, response.statusText)
        console.error('Webhook URL:', webhookUrl)
        console.error('Webhook data:', webhookData)
        throw new Error(`Webhook failed: ${response.status} - ${response.statusText}`)
      }

      let result
      try {
        result = await response.json()
      } catch (error) {
        console.error('Failed to parse webhook response:', error)
        result = { success: true, message: 'Webhook sent successfully' }
      }

      console.log('Webhook result:', result)
    } catch (error) {
      console.error('Webhook request failed:', error)
      throw error
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