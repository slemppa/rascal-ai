import { withOrganization } from '../middleware/with-organization.js'
import { sendToN8N } from '../lib/n8n-client.js'
import { setCorsHeaders, handlePreflight } from '../lib/cors.js'

/**
 * POST /api/personal-images/upload
 * Lähettää kuvan N8N webhookiin N8N_PERSONAL_IMAGES
 * Kuva on jo temp-ingest bucketissa, lähetetään vain polku ja user_id
 */
async function handler(req, res) {
  // CORS headers
  setCorsHeaders(res, ['POST', 'OPTIONS'])
  
  // Handle preflight requests
  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageUrl, imagePath, userId } = req.body

    if (!imageUrl || !imagePath || !userId) {
      return res.status(400).json({ 
        error: 'imageUrl, imagePath ja userId vaaditaan' 
      })
    }

    // Tarkista että userId vastaa organisaation ID:tä
    if (userId !== req.organization.id) {
      return res.status(403).json({ 
        error: 'Forbidden: userId ei vastaa organisaation ID:tä' 
      })
    }

    // Hae N8N webhook URL ympäristömuuttujasta
    const webhookUrl = process.env.N8N_PERSONAL_IMAGES

    if (!webhookUrl) {
      console.error('N8N_PERSONAL_IMAGES webhook URL not configured')
      return res.status(500).json({ 
        error: 'N8N webhook URL not configured',
        hint: 'N8N_PERSONAL_IMAGES environment variable is required'
      })
    }

    // Valmistele payload N8N:ään
    // image_path pitää sisältää bucketin nimi: content-media/{userId}/kuvapankki/{filename}
    const fullImagePath = `content-media/${imagePath}`
    
    const payload = {
      action: 'upload_personal_image',
      user_id: userId,
      image_url: imageUrl,
      image_path: fullImagePath,
      timestamp: new Date().toISOString()
    }

    console.log('Sending personal image to N8N:', {
      webhookUrl,
      userId,
      imageUrl,
      imagePath
    })

    // Lähetä N8N:ään HMAC-allekirjoituksella
    const result = await sendToN8N(webhookUrl, payload)

    console.log('N8N webhook response:', result)

    return res.status(200).json({ 
      success: true,
      webhookResponse: result
    })

  } catch (error) {
    console.error('Error in personal-images/upload:', error)
    
    let errorMessage = 'Virhe kuvan lähetyksessä'
    let status = 500

    if (error.message && error.message.includes('N8N webhook failed')) {
      errorMessage = 'N8N webhook virhe'
      status = error.message.includes('403') ? 403 : 500
    }

    return res.status(status).json({ 
      error: errorMessage,
      details: error.message,
      hint: status === 403 ? 'N8N workflow ei vielä tue HMAC-allekirjoitusta. Tarkista N8N workflow konfiguraatio.' : undefined
    })
  }
}

export default withOrganization(handler)

