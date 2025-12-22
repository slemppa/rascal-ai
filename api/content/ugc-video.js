import { withOrganization } from '../middleware/with-organization.js'
import { sendToN8N } from '../lib/n8n-client.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { productName, productDetails, productImageUrl, contentType, styleId, formatId, aspectRatio } = req.body

    // Validoi pakolliset kentät
    if (!productName || !productDetails || !productImageUrl || !contentType || !styleId || !formatId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['productName', 'productDetails', 'productImageUrl', 'contentType', 'styleId', 'formatId']
      })
    }

    // Validoi että contentType on joko 'Kuva' tai 'Video'
    if (contentType !== 'Kuva' && contentType !== 'Video') {
      return res.status(400).json({ 
        error: 'Invalid contentType',
        message: 'contentType must be either "Kuva" or "Video"'
      })
    }

    // Validoi styleId
    const validStyleIds = ['studio_clean', 'lifestyle_home', 'premium_luxury', 'nature_organic', 'urban_street']
    if (!validStyleIds.includes(styleId)) {
      return res.status(400).json({ 
        error: 'Invalid styleId',
        message: `styleId must be one of: ${validStyleIds.join(', ')}`
      })
    }

    // Validoi formatId
    const validFormatIds = ['social_story', 'feed_square', 'web_landscape']
    if (!validFormatIds.includes(formatId)) {
      return res.status(400).json({ 
        error: 'Invalid formatId',
        message: `formatId must be one of: ${validFormatIds.join(', ')}`
      })
    }

    // Hae N8N webhook URL
    const n8nWebhookUrl = process.env.N8N_UGC_VIDEO_URL

    if (!n8nWebhookUrl) {
      return res.status(500).json({ error: 'Webhook configuration missing' })
    }

    // Valmistele payload N8N:ään
    const safePayload = {
      user_id: String(req.organization.id),
      auth_user_id: req.authUser?.id ? String(req.authUser.id) : null,
      productName: String(productName),
      productDetails: String(productDetails),
      productImageUrl: String(productImageUrl),
      contentType: String(contentType), // 'Kuva' tai 'Video'
      styleId: String(styleId), // Visuaalinen tyyli (esim. 'studio_clean')
      formatId: String(formatId), // Kuvan muoto (esim. 'social_story')
      aspectRatio: aspectRatio ? String(aspectRatio) : null, // Kuvasuhde (esim. '9:16', '1:1', '16:9')
      timestamp: new Date().toISOString()
    }

    const data = await sendToN8N(n8nWebhookUrl, safePayload)

    return res.status(200).json({
      success: true,
      message: 'UGC video request sent successfully',
      data: data
    })

  } catch (error) {
    return res.status(500).json({ 
      error: 'UGC video request error', 
      details: error.message 
    })
  }
}

export default withOrganization(handler)

