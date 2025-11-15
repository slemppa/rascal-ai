// api/admin-message-logs.js - Admin endpoint viestilokeille
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

    // Hae kaikki viestiloki käyttäjän tokenilla (RLS-politiikat eivät rajoita adminia)
    const { data: messageLogs, error: messageLogsError } = await req.supabase
      .from('message_logs')
      .select(`
        id,
        phone_number,
        message_type,
        direction,
        status,
        ai_text,
        customer_text,
        created_at,
        user_id,
        users!message_logs_user_id_fkey(contact_person, contact_email)
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

export default withOrganization(handler) 