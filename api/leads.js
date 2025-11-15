import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY 
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validoi käyttäjä
    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Hae käyttäjän tiedot
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser(token)
    if (authError || !authUser) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Hae public.users.id
    const { data: userData, error: userError } = await userClient
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (userError || !userData) {
      return res.status(403).json({ error: 'User profile not found' })
    }

    const publicUserId = userData.id

    // Hae query parametrit
    const currentPage = parseInt(req.query.page) || 1
    const resultsPerPage = parseInt(req.query.perPage) || 20

    // Hae liidit Supabasesta käyttäen userClientia (käyttäjän tokenilla)
    const { data: leadsData, error: leadsError, count } = await userClient
      .from('scraped_leads')
      .select('*', { count: 'exact' })
      .eq('user_id', publicUserId)
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage - 1)

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return res.status(500).json({ error: 'Failed to fetch leads', details: leadsError.message })
    }

    return res.status(200).json({
      success: true,
      leads: leadsData || [],
      total: count || 0,
      page: currentPage,
      perPage: resultsPerPage,
      totalPages: Math.ceil((count || 0) / resultsPerPage)
    })

  } catch (error) {
    console.error('Error in leads endpoint:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    })
  }
}

