import { withOrganization } from '../middleware/with-organization.js'

async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client

    const orgId = req.organization.id

    switch (req.method) {
      case 'GET':
        return await getNotifications(req.supabase, orgId, req, res)
      
      case 'POST':
        return await createNotification(req.supabase, orgId, req, res)
      
      case 'PUT':
        return await updateNotification(req.supabase, orgId, req, res)
      
      case 'DELETE':
        return await deleteNotification(req.supabase, orgId, req, res)
      
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Notifications API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)

// Hae organisaation notifikaatiot
async function getNotifications(supabase, orgId, req, res) {
  try {
    const { limit = 50, offset = 0, unread_only = false } = req.query

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', orgId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unread_only === 'true') {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return res.status(500).json({ error: 'Virhe notifikaatioiden haussa' })
    }

    // Hae myös lukemattomien määrä
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', orgId)
      .eq('is_read', false)
      .eq('is_deleted', false)

    if (countError) {
      console.error('Error counting unread notifications:', countError)
    }

    return res.status(200).json({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      total: notifications?.length || 0
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    return res.status(500).json({ error: 'Virhe notifikaatioiden haussa' })
  }
}

// Luo uusi notifikaatio (vain service role)
async function createNotification(supabase, orgId, req, res) {
  try {
    const { type = 'inbound_call', title, message, data = {} } = req.body

    if (!title || !message) {
      return res.status(400).json({ error: 'title ja message ovat pakollisia' })
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: orgId,
        type,
        title,
        message,
        data
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return res.status(500).json({ error: 'Virhe notifikaation luomisessa' })
    }

    return res.status(201).json({ notification })

  } catch (error) {
    console.error('Create notification error:', error)
    return res.status(500).json({ error: 'Virhe notifikaation luomisessa' })
  }
}

// Päivitä notifikaatio (merkitse luetuksi/poistetuksi)
async function updateNotification(supabase, orgId, req, res) {
  try {
    const { notification_id } = req.query
    const { is_read, is_deleted } = req.body

    if (!notification_id) {
      return res.status(400).json({ error: 'notification_id on pakollinen' })
    }

    const updateData = {}
    if (is_read !== undefined) {
      updateData.is_read = is_read
      if (is_read) {
        updateData.read_at = new Date().toISOString()
      }
    }
    if (is_deleted !== undefined) {
      updateData.is_deleted = is_deleted
      if (is_deleted) {
        updateData.deleted_at = new Date().toISOString()
      }
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notification_id)
      .eq('user_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Error updating notification:', error)
      return res.status(500).json({ error: 'Virhe notifikaation päivityksessä' })
    }

    if (!notification) {
      return res.status(404).json({ error: 'Notifikaatio ei löytynyt' })
    }

    return res.status(200).json({ notification })

  } catch (error) {
    console.error('Update notification error:', error)
    return res.status(500).json({ error: 'Virhe notifikaation päivityksessä' })
  }
}

// Poista notifikaatio
async function deleteNotification(supabase, orgId, req, res) {
  try {
    const { notification_id } = req.query

    if (!notification_id) {
      return res.status(400).json({ error: 'notification_id on pakollinen' })
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notification_id)
      .eq('user_id', orgId)

    if (error) {
      console.error('Error deleting notification:', error)
      return res.status(500).json({ error: 'Virhe notifikaation poistamisessa' })
    }

    return res.status(200).json({ success: true })

  } catch (error) {
    console.error('Delete notification error:', error)
    return res.status(500).json({ error: 'Virhe notifikaation poistamisessa' })
  }
}
