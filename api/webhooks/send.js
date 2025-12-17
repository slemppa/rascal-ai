import { setCorsHeaders, handlePreflight } from '../lib/cors.js'

export default async function handler(req, res) {
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
    const { webhook_url, payload } = req.body

    if (!webhook_url || !payload) {
      return res.status(400).json({ error: 'Missing webhook_url or payload' })
    }

    // Tarkista että webhook URL on whitelistissä (N8N-domain)
    const allowedN8nHost = process.env.N8N_HOST || 'https://samikiias.app.n8n.cloud'
    if (!webhook_url.startsWith(allowedN8nHost)) {
      console.error('Blocked webhook request to non-whitelisted URL:', webhook_url)
      return res.status(403).json({ 
        error: 'Forbidden: webhook URL not whitelisted',
        message: 'Webhook URLs must be from the allowed N8N domain'
      })
    }

    console.log('Sending webhook to:', webhook_url)
    console.log('Payload:', payload)

    // Vain whitelistatulle URL:lle lähetetään x-api-key
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_SECRET_KEY || ''
      },
      body: JSON.stringify(payload)
    })

    console.log('Webhook response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Webhook failed:', response.status, errorText)
      return res.status(response.status).json({ 
        error: 'Webhook failed', 
        status: response.status,
        details: errorText 
      })
    }

    const responseText = await response.text()
    console.log('Webhook sent successfully:', responseText)

    return res.status(200).json({ 
      success: true, 
      message: 'Webhook sent successfully',
      response: responseText 
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(500).json({ 
      error: 'Webhook error', 
      message: error.message 
    })
  }
} 