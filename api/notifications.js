import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const access_token = req.headers['authorization']?.replace('Bearer ', '')
    
    if (!access_token) {
      return res.status(401).json({ error: 'Unauthorized: access token puuttuu' })
    }

    // Luo Supabase-yhteys käyttäjän tokenilla
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${access_token}` } }
    })

    // Hae käyttäjän tiedot
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized: käyttäjä ei löytynyt' })
    }

    // Hae public.users.id käyttäen auth_user_id:tä
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (userDataError || !userData) {
      return res.status(401).json({ error: 'Unauthorized: käyttäjätiedot ei löytynyt' })
    }

    const userId = userData.id

    switch (req.method) {
      case 'GET':
        return await getNotifications(supabase, userId, req, res)
      
      case 'POST':
        return await createNotification(supabase, userId, req, res)
      
      case 'PUT':
        return await updateNotification(supabase, userId, req, res)
      
      case 'DELETE':
        return await deleteNotification(supabase, userId, req, res)
      
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Notifications API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Hae käyttäjän notifikaatiot
async function getNotifications(supabase, userId, req, res) {
  try {
    const { limit = 50, offset = 0, unread_only = false } = req.query

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
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
      .eq('user_id', userId)
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
async function createNotification(supabase, userId, req, res) {
  try {
    const { type = 'inbound_call', title, message, data = {} } = req.body

    if (!title || !message) {
      return res.status(400).json({ error: 'title ja message ovat pakollisia' })
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
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
async function updateNotification(supabase, userId, req, res) {
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
      .eq('user_id', userId)
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
async function deleteNotification(supabase, userId, req, res) {
  try {
    const { notification_id } = req.query

    if (!notification_id) {
      return res.status(400).json({ error: 'notification_id on pakollinen' })
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notification_id)
      .eq('user_id', userId)

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
