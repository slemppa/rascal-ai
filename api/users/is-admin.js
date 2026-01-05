// api/users/is-admin.js - Tarkista onko käyttäjä admin users.role perusteella
import { withOrganization } from '../../middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // HUOM: Admin-oikeudet tulevat AINA users.role === 'admin', EI org_members.role === 'admin'
    // Tarkista admin-oikeudet users-taulusta
    const { data: userRow, error: userError } = await req.supabase
      .from('users')
      .select('role, company_id')
      .eq('auth_user_id', req.authUser.id)
      .maybeSingle()

    if (userError) {
      console.error('[is-admin] Error fetching user:', userError)
      return res.status(500).json({ error: 'Failed to check admin status' })
    }

    // Admin-oikeudet: users.role === 'admin' tai company_id === 1
    const isAdmin = userRow?.role === 'admin' || userRow?.company_id === 1

    console.log('[is-admin] Check result:', {
      email: req.authUser.email,
      users_role: userRow?.role,
      company_id: userRow?.company_id,
      isAdmin
    })

    return res.status(200).json({ isAdmin })
  } catch (error) {
    console.error('[is-admin] Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)

