import { withOrganization } from '../_middleware/with-organization.js'
import { sendToN8N } from '../_lib/n8n-client.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const safePayload = {
      userId: req.authUser.id,         // Luotettu
      data: req.body.data              // Epäluotettu
    }

    await sendToN8N(process.env.N8N_WORKFLOW_URL, safePayload)
    res.json({ ok: true })
  } catch (error) {
    console.error('N8N test endpoint error:', error)
    
    // Tarkista onko ympäristömuuttujat määritelty
    const hasWorkflowUrl = !!process.env.N8N_WORKFLOW_URL
    const hasSecretKey = !!process.env.N8N_SECRET_KEY
    
    // Älä paljasta ympäristömuuttujien arvoja edes osittain tuotannossa
    const isDevelopment = process.env.NODE_ENV === 'development'
    return res.status(500).json({ 
      error: 'Failed to send to N8N', 
      message: isDevelopment ? error.message : 'Internal server error',
      config: {
        hasWorkflowUrl,
        hasSecretKey,
        // Älä näytä workflowUrl:ia tuotannossa
        ...(isDevelopment && hasWorkflowUrl && { workflowUrl: process.env.N8N_WORKFLOW_URL.substring(0, 50) + '...' })
      }
    })
  }
}

export default withOrganization(handler)
