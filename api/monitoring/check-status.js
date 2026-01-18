// api/monitoring/check-status.js - Tarkista onko käyttäjällä mediaseuranta-riviä
import { withOrganization } from '../_middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../_lib/cors.js'

async function handler(req, res) {
  setCorsHeaders(res, ['GET', 'OPTIONS'], undefined, req)
  
  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const orgId = req.organization.id

    // Tarkista onko käyttäjällä mediaseuranta-rivejä
    const { data: monitoringEntries, error: dbError } = await req.supabase
      .from('monitoring_entries')
      .select('id')
      .eq('user_id', orgId)
      .limit(1)

    if (dbError) {
      console.error('Error checking monitoring status:', dbError)
      return res.status(500).json({ 
        error: 'Failed to check monitoring status',
        details: dbError.message 
      })
    }

    const hasMonitoring = monitoringEntries && monitoringEntries.length > 0

    return res.status(200).json({
      hasMonitoring: hasMonitoring
    })

  } catch (error) {
    console.error('Error checking monitoring status:', error)
    return res.status(500).json({ 
      error: 'Failed to check monitoring status',
      details: error.message 
    })
  }
}

export default withOrganization(handler)
