export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { recordId, voiceover, voiceoverReady, companyId } = req.body

    if (!recordId || !companyId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Tässä vaiheessa lähetetään data N8N webhookiin
    const n8nWebhookUrl = process.env.N8N_VOICEOVER_READY
    
    if (!n8nWebhookUrl) {
      console.error('N8N_VOICEOVER_READY webhook URL not configured')
      return res.status(500).json({ error: 'Webhook configuration missing' })
    }

    const webhookData = {
      recordId,
      voiceover,
      voiceoverReady,
      companyId,
      timestamp: new Date().toISOString(),
      action: 'voiceover_ready'
    }

    console.log('Sending voiceover ready data to N8N:', webhookData)

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
      return res.status(500).json({ 
        error: 'Failed to send data to workflow',
        details: response.statusText
      })
    }

    const result = await response.text()
    console.log('N8N webhook response:', result)

    return res.status(200).json({ 
      success: true, 
      message: 'Voiceover status updated successfully',
      data: webhookData
    })

  } catch (error) {
    console.error('Voiceover ready webhook error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
} 