import { createClient } from '@supabase/supabase-js'

// GET /api/user-features
// Palauttaa { features: string[] } kirjautuneelle käyttäjälle
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return res.status(401).json({ error: 'Missing token' })
    }

    // Luo käyttäjän tokenilla authenticated client (RLS hoitaa näkyvyyden)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: authData, error: authError } = await userClient.auth.getUser(token)
    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const userId = authData.user.id

    // Hae features ja crm_connected public.users-taulusta auth_user_id:n perusteella
    const { data, error } = await userClient
      .from('users')
      .select('features, crm_connected')
      .eq('auth_user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned for single() — tulkitaan tyhjäksi
      return res.status(500).json({ error: error.message })
    }

    const features = Array.isArray(data?.features) ? data.features : []
    const crm_connected = Boolean(data?.crm_connected)
    return res.status(200).json({ features, crm_connected })
  } catch (e) {
    console.error('user-features error:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


