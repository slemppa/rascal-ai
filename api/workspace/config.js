import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // JWT token validointi
    const token = req.headers.authorization?.replace('Bearer ', '')
    let authUser = null
    
    if (token) {
      // Luo Supabase client käyttäjän tokenilla
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      })

      // Hae käyttäjän tiedot
      const { data: user, error: authError } = await supabase.auth.getUser(token)
      if (!authError && user) {
        authUser = user
      }
    }
    
    if (!authUser) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Hae käyttäjän workspace konfiguraatio
    const { data: workspaceConfig, error: configError } = await supabase
      .from('user_mixpost_config')
      .select('mixpost_api_token, mixpost_workspace_uuid, is_active')
      .eq('user_id', authUser.user.id)
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