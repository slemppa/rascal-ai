// api/org-members.js - Hae organisaation jäsenet
import { withOrganization } from '../_middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.organization.role = käyttäjän rooli ('owner', 'admin', 'member')
    // req.supabase = authenticated Supabase client

    const orgId = req.organization.id
    const userRole = req.organization.role

    // Vain owner ja admin voivat nähdä jäsenet
    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Admin or owner access required' })
    }

    // Hae organisaation jäsenet
    // Email on nyt org_members taulussa, joten ei tarvita join:ia auth.users tauluun
    const { data: members, error } = await req.supabase
      .from('org_members')
      .select('org_id, auth_user_id, role, created_at, email')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching org members:', error)
      return res.status(500).json({ error: 'Failed to fetch members', details: error.message })
    }

    // Muotoillaan vastaus samaan muotoon kuin ennen
    const membersWithAuthData = (members || []).map((member) => ({
      ...member,
      auth_users: {
        id: member.auth_user_id,
        email: member.email,
        user_metadata: null
      }
    }))

    return res.status(200).json({ 
      success: true,
      members: membersWithAuthData
    })

  } catch (error) {
    console.error('org-members error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)

