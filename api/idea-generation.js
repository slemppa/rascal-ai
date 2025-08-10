export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { idea, type, companyId, caption } = req.body

    if (!idea || !type || !companyId) {
      return res.status(400).json({ error: 'Missing required fields: idea, type, companyId' })
    }

    // N8N webhook URL
    const n8nWebhookUrl = process.env.N8N_IDEA_GENERATION || 'https://samikiias.app.n8n.cloud/webhook/idea-generation'
    


    if (!n8nWebhookUrl) {
      console.error('N8N_IDEA_GENERATION webhook URL not configured')
      return res.status(500).json({ error: 'Webhook configuration missing' })
    }

    const webhookData = {
      idea,
      type,
      companyId,
      caption,
      timestamp: new Date().toISOString(),
      action: 'idea_generation'
    }

    console.log('Sending idea generation request to N8N:', webhookData)
    console.log('Company ID:', companyId)
    console.log('API Key available:', !!process.env.N8N_SECRET_KEY)
    console.log('N8N Webhook URL:', n8nWebhookUrl)
    console.log('Request body:', JSON.stringify(webhookData, null, 2))

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_SECRET_KEY
      },
      body: JSON.stringify(webhookData)
    })

    if (!response.ok) {
      console.error('N8N webhook error:', response.status, response.statusText)
      console.error('Response headers:', Object.fromEntries(response.headers.entries()))
      const errorText = await response.text()
      console.error('Response body:', errorText)
      return res.status(500).json({
        error: 'Failed to send data to workflow',
        details: response.statusText
      })
    }

    const result = await response.json()
    console.log('N8N webhook response:', result)

    return res.status(200).json({
      success: true,
      message: 'Idea generation request sent successfully',
      data: webhookData
    })

  } catch (error) {
    console.error('Idea generation webhook error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
} 