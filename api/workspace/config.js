import { withOrganization } from './middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client
    const orgId = req.organization.id

    // Hae organisaation workspace konfiguraatio
    const { data: workspaceConfig, error: configError } = await req.supabase
      .from('user_mixpost_config')
      .select('mixpost_api_token, mixpost_workspace_uuid, is_active')
      .eq('user_id', orgId)
      .single()

    if (configError) {
      console.error('Error fetching workspace config:', configError)
      return res.status(404).json({ error: 'Workspace configuration not found' })
    }

    if (!workspaceConfig || !workspaceConfig.is_active) {
      return res.status(404).json({ error: 'Workspace not connected' })
    }

    // Palauta workspace konfiguraatio (ei API tokenia turvallisuuden vuoksi)
    return res.status(200).json({
      mixpost_workspace_uuid: workspaceConfig.mixpost_workspace_uuid,
      is_active: workspaceConfig.is_active
    })

  } catch (error) {
    console.error('Workspace config API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler) 