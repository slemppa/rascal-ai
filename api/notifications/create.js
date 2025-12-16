import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Tarkista service key
    const serviceKey = req.headers['x-service-key']
    if (serviceKey !== supabaseServiceKey) {
      return res.status(401).json({ error: 'Unauthorized: invalid service key' })
    }

    const { user_id, type = 'inbound_call', title, message, data = {} } = req.body

    if (!user_id || !title || !message) {
      return res.status(400).json({ 
        error: 'user_id, title ja message ovat pakollisia' 
      })
    }

    // Luo Supabase-yhteys service key:llä
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Tarkista että käyttäjä on olemassa
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (userError || !userExists) {
      return res.status(404).json({ error: 'Käyttäjä ei löytynyt' })
    }

    // Luo notifikaatio
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
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

    return res.status(201).json({ 
      success: true,
      notification 
    })

  } catch (error) {
    console.error('Create notification error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
