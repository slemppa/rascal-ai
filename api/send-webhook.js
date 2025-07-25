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
    const { webhook_url, payload } = req.body

    if (!webhook_url || !payload) {
      return res.status(400).json({ error: 'Missing webhook_url or payload' })
    }

    console.log('Sending webhook to:', webhook_url)
    console.log('Payload:', payload)

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