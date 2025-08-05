// api/admin-message-logs.js - Admin endpoint viestilokeille
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

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

    // Tarkista admin-oikeudet
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('auth_user_id', user.user.id)
      .single()

    if (userError || !userData) {
      return res.status(403).json({ error: 'User not found' })
    }

    // Admin on käyttäjä, jolla on role = 'admin' tai company_id = 1 (pääadmin)
    const isAdmin = userData.role === 'admin' || userData.company_id === 1
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Hae kaikki viestiloki käyttäjän tokenilla (RLS-politiikat eivät rajoita adminia)
    const { data: messageLogs, error: messageLogsError } = await supabase
      .from('message_logs')
      .select(`
        id,
        phone_number,
        message_text,
        message_type,
        direction,
        status,
        media_url,
        media_type,
        created_at,
        users(contact_person, contact_email)
      `)
      .order('created_at', { ascending: false })

    if (messageLogsError) {
      console.error('Error fetching message logs:', messageLogsError)
      return res.status(500).json({ error: 'Failed to fetch message logs' })
    }

    return res.status(200).json({ 
      success: true, 
      data: messageLogs || [],
      count: messageLogs?.length || 0
    })

  } catch (error) {
    console.error('Admin message logs error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 