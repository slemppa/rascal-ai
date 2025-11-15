// api/admin-data.js - Admin endpoint kaikille admin-tarpeille
import { withOrganization } from './middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.role = käyttäjän rooli ('owner', 'admin', 'member')
    // req.supabase = authenticated Supabase client

    // Tarkista admin-oikeudet: admin tai owner rooli
    const isAdmin = req.organization.role === 'admin' || req.organization.role === 'owner'
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Käytä samaa supabase clientia, RLS-politiikat eivät rajoita adminia

    // Hae data type parametrista
    const { type } = req.query

    let result = {}

    switch (type) {
      case 'users':
        const { data: users, error: usersError } = await req.supabase
          .from('users')
          .select(`
            id,
            contact_email,
            contact_person,
            status,
            role,
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
            crm_connected,
            features,
            subscription_status,
            platforms,
            onboarding_completed,
            vapi_inbound_assistant_id,
            vapi_phone_number
          `)
          .order('created_at', { ascending: false })

        if (usersError) {
          console.error('Error fetching users:', usersError)
          return res.status(500).json({ error: 'Failed to fetch users' })
        }

        result = { users: users || [] }
        break

      case 'content':
        const { data: content, error: contentError } = await req.supabase
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
        const { data: segments, error: segmentsError } = await req.supabase
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
          req.supabase.from('users').select('role, status, created_at'),
          req.supabase.from('content').select('status, type, created_at'),
          req.supabase.from('call_logs').select('call_status, answered, created_at'),
          req.supabase.from('message_logs').select('status, message_type, created_at'),
          req.supabase.from('segments').select('status, created_at')
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

export default withOrganization(handler) 