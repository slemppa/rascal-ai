import { sendToN8N } from '../lib/n8n-client.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { idea, content, type, companyId, caption, count } = req.body

    if (!idea || !companyId) {
      return res.status(400).json({ error: 'Missing required fields: idea, companyId' })
    }
    
    // Varmista että count on validi numero (1-10)
    const postCount = count ? Math.max(1, Math.min(10, parseInt(count, 10))) : 1
    
    // Type on pakollinen vain jos luodaan yksi postaus
    if (postCount === 1 && !type) {
      return res.status(400).json({ error: 'Missing required field: type (required when count is 1)' })
    }

    // N8N webhook URL
    const n8nWebhookUrl = process.env.N8N_IDEA_GENERATION || 'https://samikiias.app.n8n.cloud/webhook/idea-generation'

    if (!n8nWebhookUrl) {
      return res.status(500).json({ error: 'Webhook configuration missing' })
    }

    const safePayload = {
      idea: String(idea),
      content: content ? String(content) : null,
      type: type ? String(type) : null,
      companyId: String(companyId),
      caption: caption ? String(caption) : null,
      count: Number(postCount),
      timestamp: new Date().toISOString(),
      action: 'idea_generation'
    }

    await sendToN8N(n8nWebhookUrl, safePayload)

    return res.status(200).json({
      success: true,
      message: 'Idea generation request sent successfully',
      data: safePayload
    })

  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
} 