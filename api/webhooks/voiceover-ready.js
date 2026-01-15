import { withOrganization } from '../_middleware/with-organization.js'
import { sendToN8N } from '../_lib/n8n-client.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { recordId, voiceover, voiceoverReady, selectedAvatarId, action } = req.body

    // Validoi pakolliset kentät
    if (!recordId) {
      return res.status(400).json({ error: 'recordId is required' })
    }

    // Tarkista että middleware on asettanut organization
    if (!req.organization || !req.organization.id) {
      return res.status(500).json({ error: 'Organization context missing' })
    }

    // Tässä vaiheessa lähetetään data N8N webhookiin
    const n8nWebhookUrl = process.env.N8N_VOICEOVER_READY
    
    if (!n8nWebhookUrl) {
      console.error('N8N_VOICEOVER_READY webhook URL not configured')
      return res.status(500).json({ error: 'Webhook configuration missing' })
    }

    // Muodosta safe payload: käytä luotettavia arvoja middlewaresta
    const safePayload = {
      recordId: String(recordId),
      companyId: String(req.organization.id), // Luotettu middlewaresta
      authUserId: req.authUser?.id || null,   // Luotettu middlewaresta
      voiceover: voiceover || null,
      voiceoverReady: voiceoverReady !== undefined ? Boolean(voiceoverReady) : false,
      selectedAvatarId: selectedAvatarId !== undefined && selectedAvatarId !== null ? String(selectedAvatarId) : null,
      timestamp: new Date().toISOString(),
      action: action || 'voiceover_ready'
    }

    await sendToN8N(n8nWebhookUrl, safePayload)
    res.json({ 
      success: true, 
      message: 'Voiceover status updated successfully'
    })
  } catch (error) {
    console.error('Voiceover ready webhook error:', error)
    return res.status(500).json({ 
      error: 'Failed to send data to workflow',
      details: error.message 
    })
  }
}

export default withOrganization(handler) 