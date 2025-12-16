import axios from 'axios'
import { withOrganization } from './middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { productName, productDetails, productImageUrl, contentType } = req.body

    // Validoi pakolliset kentät
    if (!productName || !productDetails || !productImageUrl || !contentType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['productName', 'productDetails', 'productImageUrl', 'contentType']
      })
    }

    // Validoi että contentType on joko 'Kuva' tai 'Video'
    if (contentType !== 'Kuva' && contentType !== 'Video') {
      return res.status(400).json({ 
        error: 'Invalid contentType',
        message: 'contentType must be either "Kuva" or "Video"'
      })
    }

    // Hae N8N webhook URL
    const n8nWebhookUrl = process.env.N8N_UGC_VIDEO_URL
    const n8nSecretKey = process.env.N8N_SECRET_KEY

    if (!n8nWebhookUrl) {
      console.error('N8N_UGC_VIDEO_URL webhook URL not configured')
      return res.status(500).json({ error: 'Webhook configuration missing' })
    }

    // Valmistele payload N8N:ään
    const webhookData = {
      user_id: req.organization.id,
      auth_user_id: req.authUser?.id,
      productName,
      productDetails,
      productImageUrl,
      contentType, // 'Kuva' tai 'Video'
      timestamp: new Date().toISOString()
    }

    console.log('Sending UGC video request to N8N:', {
      user_id: req.organization.id,
      webhookUrl: n8nWebhookUrl,
      hasApiKey: !!n8nSecretKey
    })

    // Lähetä N8N:ään
    const headers = {
      'Content-Type': 'application/json'
    }

    if (n8nSecretKey) {
      headers['x-api-key'] = n8nSecretKey
    }

    const response = await axios.post(n8nWebhookUrl, webhookData, {
      headers,
      timeout: 30000 // 30 sekuntia timeout
    })

    console.log('N8N webhook response:', response.status, response.data)

    return res.status(200).json({
      success: true,
      message: 'UGC video request sent successfully',
      data: response.data
    })

  } catch (error) {
    console.error('Error in ugc-video endpoint:', error)
    const status = error.response?.status || 500
    const data = error.response?.data || { message: error.message }
    return res.status(status).json({ 
      error: 'UGC video request error', 
      status, 
      details: data 
    })
  }
}

export default withOrganization(handler)

