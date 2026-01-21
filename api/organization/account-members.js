// api/account-org-members.js - Hae organisaation käyttäjät account manager -näkymää varten
// Tämä endpoint on eri kuin org-members.js koska se ottaa vastaan org_id parametrin
// eikä käytä käyttäjän omaa organisaatiota

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Tarkista ympäristömuuttujat
    if (!supabaseUrl) {
      return res.status(500).json({ error: 'Supabase URL missing' })
    }

    if (!supabaseAnonKey) {
      return res.status(500).json({ error: 'Supabase anon key missing' })
    }

    // Tarkista että käyttäjä on kirjautunut
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Luo Supabase client käyttäjän tokenilla
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Tarkista käyttäjä
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Hae käyttäjän rooli
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role, company_id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (userError || !userData) {
      return res.status(403).json({ error: 'User not found' })
    }

    // Tarkista että käyttäjä on admin, superadmin tai moderator
    const isAdmin = userData.role === 'admin'
    const isSuperAdmin = userData.role === 'superadmin'
    const isModerator = userData.role === 'moderator'

    if (!isAdmin && !isSuperAdmin && !isModerator) {
      return res.status(403).json({ error: 'Admin or moderator access required' })
    }

    // Hae org_id parametri
    const { org_id } = req.query
    if (!org_id) {
      return res.status(400).json({ error: 'org_id is required' })
    }

    // Admin/superadmin käyttää Service Role clientia (ohittaa RLS:n)
    // Moderator/muut käyttää käyttäjän omaa tokenia (RLS voimassa)
    let dbClient = supabase

    if (isAdmin || isSuperAdmin) {
      // Admin/superadmin: käytä Service Role clientia
      if (!supabaseServiceKey) {
        return res.status(500).json({ error: 'Service role key not configured' })
      }
      dbClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      })
      console.log('[account-members] Using Service Role client for admin/superadmin')
    } else {
      // Moderator: tarkista että on account manager tälle organisaatiolle
      const { data: accountCheck, error: accountError } = await supabase
        .from('users')
        .select('account_manager_id')
        .eq('id', org_id)
        .single()

      if (accountError || !accountCheck) {
        return res.status(404).json({ error: 'Organization not found' })
      }

      if (accountCheck.account_manager_id !== userData.id) {
        return res.status(403).json({ error: 'Access denied' })
      }
      console.log('[account-members] Using RLS client for moderator')
    }

    // Hae organisaation käyttäjät org_members taulusta
    console.log('[account-members] Fetching members for org_id:', org_id)
    const { data: orgMembers, error: orgError } = await dbClient
      .from('org_members')
      .select('auth_user_id, role, email, created_at')
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })

    console.log('[account-members] Query result:', {
      count: orgMembers?.length,
      error: orgError?.message
    })

    if (orgError) {
      console.error('Error fetching org members:', orgError)
      return res.status(500).json({ error: 'Failed to fetch members', details: orgError.message })
    }

    if (!orgMembers || orgMembers.length === 0) {
      return res.status(200).json({ 
        success: true,
        members: []
      })
    }

    // Hae käyttäjien last_sign_in_at auth.users taulusta käyttäen Service Role Keyta
    const authUserIds = orgMembers.map(m => m.auth_user_id).filter(Boolean)
    
    let signInData = []
    if (authUserIds.length > 0 && supabaseServiceKey) {
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      })
      
      // Käytetään RPC-funktiota hakemaan last_sign_in_at
      const { data: signInResult, error: signInError } = await serviceClient
        .rpc('get_users_last_sign_in', { user_ids: authUserIds })

      if (signInError) {
        console.warn('Error fetching sign in data:', signInError)
      } else {
        signInData = signInResult || []
      }
    }

    // Yhdistä tiedot
    const membersWithSignIn = orgMembers.map(member => {
      const signIn = signInData.find(s => s.id === member.auth_user_id)
      return {
        auth_user_id: member.auth_user_id,
        email: member.email,
        role: member.role,
        created_at: member.created_at,
        last_sign_in_at: signIn?.last_sign_in_at || null
      }
    })

    return res.status(200).json({ 
      success: true,
      members: membersWithSignIn
    })

  } catch (error) {
    console.error('account-org-members error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
