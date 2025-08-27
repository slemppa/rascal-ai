// api/admin-data.js - Admin endpoint kaikille admin-tarpeille
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

    // Käytä samaa supabase clientia, RLS-politiikat eivät rajoita adminia

    // Hae data type parametrista
    const { type } = req.query

    let result = {}

    switch (type) {
      case 'users':
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select(`
            id,
            contact_email,
            contact_person,
            role,
            company_id,
            webhook_url,
            created_at,
            auth_user_id,
            company_name,
            thread_id,
            vapi_number_id,
            vapi_assistant_id,
            vector_store_id,
            voice_id,
            assistant_id,
            crm_connected
          `)
          .order('created_at', { ascending: false })

        if (usersError) {
          console.error('Error fetching users:', usersError)
          return res.status(500).json({ error: 'Failed to fetch users' })
        }

        result = { users: users || [] }
        break

      case 'content':
        const { data: content, error: contentError } = await supabase
          .from('content')
          .select(`
            id,
            idea,
            type,
            status,
            created_at,
            user_id,
            users(contact_person, contact_email)
          `)
          .order('created_at', { ascending: false })

        if (contentError) {
          console.error('Error fetching content:', contentError)
          return res.status(500).json({ error: 'Failed to fetch content' })
        }

        result = { content: content || [] }
        break

      case 'segments':
        const { data: segments, error: segmentsError } = await supabase
          .from('segments')
          .select(`
            id,
            slide_no,
            text,
            media_urls,
            status,
            created_at,
            users(contact_person, contact_email)
          `)
          .order('created_at', { ascending: false })

        if (segmentsError) {
          console.error('Error fetching segments:', segmentsError)
          return res.status(500).json({ error: 'Failed to fetch segments' })
        }

        result = { segments: segments || [] }
        break

      case 'stats':
        // Hae kaikki data samanaikaisesti tilastojen laskemista varten
        const [usersData, contentData, callLogsData, messageLogsData, segmentsData] = await Promise.all([
          supabase.from('users').select('role, status, created_at'),
          supabase.from('content').select('status, type, created_at'),
          supabase.from('call_logs').select('call_status, answered, created_at'),
          supabase.from('message_logs').select('status, message_type, created_at'),
          supabase.from('segments').select('status, created_at')
        ])

        const stats = {
          totalUsers: usersData.data?.length || 0,
          adminUsers: usersData.data?.filter(u => u.role === 'admin').length || 0,
          activeUsers: usersData.data?.filter(u => u.status === 'Active').length || 0,
          totalContent: contentData.data?.length || 0,
          publishedContent: contentData.data?.filter(c => c.status === 'Published').length || 0,
          totalCalls: callLogsData.data?.length || 0,
          answeredCalls: callLogsData.data?.filter(c => c.answered).length || 0,
          totalMessages: messageLogsData.data?.length || 0,
          totalSegments: segmentsData.data?.length || 0,
          recentActivity: {
            users: usersData.data?.slice(0, 5) || [],
            content: contentData.data?.slice(0, 5) || [],
            calls: callLogsData.data?.slice(0, 5) || []
          }
        }

        result = { stats }
        break

      default:
        return res.status(400).json({ error: 'Invalid type parameter. Use: users, content, segments, or stats' })
    }

    return res.status(200).json({ 
      success: true, 
      ...result
    })

  } catch (error) {
    console.error('Admin data error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 