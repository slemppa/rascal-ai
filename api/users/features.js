// GET /api/user-features
// Palauttaa { features: string[] } kirjautuneelle käyttäjälle
import { withOrganization } from '../_middleware/with-organization.js'
import logger from '../_lib/logger.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.organization.data = organisaation tiedot (public.users rivi)
    // req.supabase = authenticated Supabase client

    const orgId = req.organization.id
    const orgData = req.organization.data

    const features = Array.isArray(orgData?.features) ? orgData.features : []
    const crm_connected = Boolean(orgData?.crm_connected)

    // Laske tämän kuun generoitujen sisältöjen määrä organisaatiolle
    let monthly_content_count = 0
    if (orgId) {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const { count, error: countError } = await req.supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId)
        .eq('is_generated', true)
        .gte('created_at', firstDay.toISOString())
      if (!countError && typeof count === 'number') {
        monthly_content_count = count
      }
    }

    return res.status(200).json({ features, crm_connected, monthly_content_count })
  } catch (e) {
    logger.error('user-features error:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)


