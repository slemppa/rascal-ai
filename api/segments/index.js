import { withOrganization } from '../middleware/with-organization.js'
import logger from '../lib/logger.js'
import { setCorsHeaders, handlePreflight } from '../lib/cors.js'

async function handler(req, res) {
  setCorsHeaders(res, ['GET', 'OPTIONS'])
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client

    const idParam = req.query.user_id
    if (!idParam) {
      return res.status(400).json({ error: 'user_id puuttuu kyselystä' })
    }

    // Mapataan mahdollinen auth.users.id → public.users.id
    let publicUserId = null
    const { data: directUser } = await req.supabase
      .from('users')
      .select('id')
      .eq('id', idParam)
      .maybeSingle()
    if (directUser?.id) publicUserId = directUser.id

    if (!publicUserId) {
      // Tarkista onko idParam auth_user_id ja hae org_id org_members kautta
      const { data: orgMember } = await req.supabase
        .from('org_members')
        .select('org_id')
        .eq('auth_user_id', idParam)
        .maybeSingle()
      if (orgMember?.org_id) publicUserId = orgMember.org_id
    }

    if (!publicUserId) {
      // Jos ei löydy, käytetään käyttäjän omaa organisaatiota
      publicUserId = req.organization.id
    }

    const { data: segments, error } = await req.supabase
      .from('contact_segments')
      .select('*')
      .eq('user_id', publicUserId)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch segments', details: error.message })
    }

    res.status(200).json(segments || [])
  } catch (error) {
    logger.error('Unhandled error /api/segments:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

export default withOrganization(handler)


