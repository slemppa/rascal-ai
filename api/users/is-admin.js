// api/users/is-admin.js - HTTP endpoint admin-statuksen tarkistukseen
// HUOM: Älä käytä tätä React-frontendissä! Käytä AuthContext.user.systemRole sijaan.
// Tämä on tarkoitettu vain backend-integraatioihin tai erikoistapauksiin.

import { withOrganization } from '../_middleware/with-organization.js'
import { checkAdminStatus } from '../_lib/check-admin-status.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const isAdmin = await checkAdminStatus(req.supabase, req.authUser.id)

    console.log('[is-admin] Check result:', {
      email: req.authUser.email,
      isAdmin
    })

    return res.status(200).json({ isAdmin })
  } catch (error) {
    console.error('[is-admin] Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)

