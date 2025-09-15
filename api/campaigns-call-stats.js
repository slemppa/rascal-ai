// api/campaigns-call-stats.js - Call logs tilastot campaigns-sivua varten
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // JWT token validointi
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    // Luo Supabase client käyttäjän tokenilla
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Hae käyttäjän tiedot
    const { data: user, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Hae käyttäjän users-taulun id
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.user.id)
      .single()

    if (userError || !userProfile) {
      return res.status(403).json({ error: 'User not found' })
    }

    // Hae kaikki call_logs käyttäjälle
    const { data: allCallLogs, error: allLogsError } = await supabase
      .from('call_logs')
      .select('call_status')
      .eq('user_id', userProfile.id)

    if (allLogsError) {
      console.error('Error fetching all call logs:', allLogsError)
      return res.status(500).json({ error: 'Failed to fetch call logs' })
    }

    // Laske tilastot
    const totalCalls = allCallLogs?.length || 0
    
    // Soitetut = ne jotka eivät ole pending tai in progress
    const calledCalls = allCallLogs?.filter(log => 
      log.call_status !== 'pending' && log.call_status !== 'in progress'
    ).length || 0

    return res.status(200).json({
      success: true,
      data: {
        totalCalls,
        calledCalls
      }
    })

  } catch (error) {
    console.error('Campaigns call stats error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
