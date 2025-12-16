import { withOrganization } from '../../middleware/with-organization.js'
import axios from 'axios'

/**
 * POST /api/airtable-carousels
 * Lähettää POST-kutsun N8N webhookiin Airtable-karusellien hakemiseksi
 * 
 * Body parametrit:
 * - action: Toiminto ('get' = haku, 'approve' = hyväksyntä)
 * - base_id: Airtable base ID (vapaaehtoinen)
 * - table_name: Airtable taulun nimi (vapaaehtoinen)
 * - verify_only: Jos true, vain vahvistaa yhteyden ilman datan hakua (vapaaehtoinen)
 * - updates: Array muutoksista (tarvitaan kun action = 'approve')
 *   [{ recordId, carouselRecordId, text, approved }, ...]
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { action = 'get', base_id, table_name, verify_only, updates } = req.body
    const orgId = req.organization.id // public.users.id (organisaation ID)
    const n8nWebhookUrl = process.env.N8N_AIRTABLE_CAROUSEL
    const n8nSecretKey = process.env.N8N_SECRET_KEY

    console.log('🔍 Airtable carousels request:', {
      action,
      orgId,
      base_id: base_id || 'ei annettu',
      table_name: table_name || 'ei annettu',
      verify_only: verify_only || false,
      updatesCount: updates ? updates.length : 0
    })

    // Validoi että N8N webhook URL on määritelty
    if (!n8nWebhookUrl) {
      console.error('❌ N8N_AIRTABLE_CAROUSEL webhook URL not configured')
      return res.status(500).json({
        error: 'N8N webhook URL ei ole määritelty',
        hint: 'Aseta N8N_AIRTABLE_CAROUSEL ympäristömuuttujaksi'
      })
    }

    if (!n8nSecretKey) {
      console.error('❌ N8N_SECRET_KEY not configured')
      return res.status(500).json({
        error: 'N8N secret key ei ole määritelty',
        hint: 'Aseta N8N_SECRET_KEY ympäristömuuttujaksi'
      })
    }

    // Valmistele payload N8N:ään
    const webhookPayload = {
      action: action, // 'get' = haku, 'approve' = hyväksyntä
      user_id: orgId, // public.users.id (organisaation ID)
      base_id: base_id || null,
      table_name: table_name || null,
      verify_only: verify_only || false,
      timestamp: new Date().toISOString(),
      ...(updates && { updates: updates }) // Lisää updates jos se on annettu
    }

    console.log('📤 Sending to N8N webhook:', {
      url: n8nWebhookUrl,
      user_id: orgId,
      hasApiKey: !!n8nSecretKey
    })

    // Lähetä POST-kutsu N8N webhookiin
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': n8nSecretKey
    }

    const response = await axios.post(n8nWebhookUrl, webhookPayload, {
      headers,
      timeout: 30000 // 30 sekuntia timeout
    })

    console.log('✅ N8N webhook response:', response.status, response.data)

    // Palauta N8N:n vastaus
    return res.status(200).json({
      success: true,
      message: 'Airtable-karusellit haettu onnistuneesti',
      data: response.data
    })

  } catch (error) {
    console.error('❌ Error in airtable-carousels endpoint:', error)
    
    // Jos axios-virhe, palauta sen tiedot
    if (error.response) {
      return res.status(error.response.status || 500).json({
        error: 'N8N webhook virhe',
        details: error.response.data || error.message,
        status: error.response.status
      })
    }

    return res.status(500).json({
      error: 'Sisäinen palvelinvirhe',
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
  }
}

export default withOrganization(handler)
