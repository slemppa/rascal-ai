import { withOrganization } from '../../_middleware/with-organization.js'
import { sendToN8N } from '../../_lib/n8n-client.js'

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

    // Validoi että N8N webhook URL on määritelty
    if (!n8nWebhookUrl) {
      return res.status(500).json({
        error: 'N8N webhook URL ei ole määritelty',
        hint: 'Aseta N8N_AIRTABLE_CAROUSEL ympäristömuuttujaksi'
      })
    }

    // Valmistele payload N8N:ään
    const safePayload = {
      action: String(action), // 'get' = haku, 'approve' = hyväksyntä
      user_id: String(orgId), // public.users.id (organisaation ID)
      base_id: base_id ? String(base_id) : null,
      table_name: table_name ? String(table_name) : null,
      verify_only: verify_only ? Boolean(verify_only) : false,
      timestamp: new Date().toISOString(),
      ...(updates && { updates: updates }) // Lisää updates jos se on annettu
    }

    const data = await sendToN8N(n8nWebhookUrl, safePayload)

    // Palauta N8N:n vastaus
    return res.status(200).json({
      success: true,
      message: 'Airtable-karusellit haettu onnistuneesti',
      data: data
    })

  } catch (error) {
    return res.status(500).json({
      error: 'Sisäinen palvelinvirhe',
      details: error.message
    })
  }
}

export default withOrganization(handler)
