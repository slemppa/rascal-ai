import { withOrganization } from '../middleware/with-organization.js'

/**
 * GET /api/leads
 * Hakee kaikki käyttäjän liidit Supabasesta
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client
    const orgId = req.organization.id

    const page = parseInt(req.query.page || '1', 10)
    const perPage = parseInt(req.query.perPage || '100', 10)
    const offset = (page - 1) * perPage

    // Hae liidit Supabasesta käyttäen organisaation ID:tä
    // RLS-politiikat varmistavat että käyttäjä näkee vain oman organisaationsa datan
    const { data: leads, error: leadsError, count } = await req.supabase
      .from('scraped_leads')
      .select('*', { count: 'exact' })
      .eq('user_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1)

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return res.status(500).json({ 
        error: 'Failed to fetch leads', 
        details: leadsError.message 
      })
    }

    return res.status(200).json({
      success: true,
      leads: leads || [],
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage)
    })

  } catch (error) {
    console.error('Error in leads endpoint:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    })
  }
}

export default withOrganization(handler)
