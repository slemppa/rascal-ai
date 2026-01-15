import { withOrganization } from '../_middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client
    const orgId = req.organization.id

    const { leadIds } = req.body

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds array is required' })
    }

    // Poista liidit Supabasesta käyttäen organisaation ID:tä
    // RLS-politiikat varmistavat että käyttäjä voi poistaa vain oman organisaationsa datan
    const { error: deleteError } = await req.supabase
      .from('scraped_leads')
      .delete()
      .eq('user_id', orgId)
      .in('id', leadIds)

    if (deleteError) {
      console.error('Error deleting leads:', deleteError)
      return res.status(500).json({ 
        error: 'Failed to delete leads', 
        details: deleteError.message 
      })
    }

    return res.status(200).json({
      success: true,
      message: `Poistettu ${leadIds.length} liidiä`,
      deletedCount: leadIds.length
    })

  } catch (error) {
    console.error('Error in leads-delete endpoint:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    })
  }
}

export default withOrganization(handler)

