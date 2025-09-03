import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
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

    const { 
      user_id, 
      caller_name, 
      caller_phone, 
      call_duration, 
      call_status,
      call_summary,
      call_transcript,
      call_recording_url,
      timestamp 
    } = req.body

    if (!user_id) {
      return res.status(400).json({ 
        error: 'user_id on pakollinen' 
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

    // Luo notifikaatio inbound-puhelusta
    const notificationData = {
      user_id,
      type: 'inbound_call',
      title: 'Uusi saapuva puhelu',
      message: caller_name 
        ? `${caller_name} soitti numerosta ${caller_phone || 'tuntematon'}`
        : `Puhelu numerosta ${caller_phone || 'tuntematon'}`,
      data: {
        caller_name: caller_name || null,
        caller_phone: caller_phone || null,
        call_duration: call_duration || null,
        call_status: call_status || 'completed',
        call_summary: call_summary || null,
        call_transcript: call_transcript || null,
        call_recording_url: call_recording_url || null,
        timestamp: timestamp || new Date().toISOString()
      }
    }

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (notificationError) {
      console.error('Error creating inbound call notification:', notificationError)
      return res.status(500).json({ error: 'Virhe notifikaation luomisessa' })
    }

    // Lisää myös call_logs-tauluun inbound-puhelu
    const callLogData = {
      user_id,
      customer_name: caller_name || 'Tuntematon soittaja',
      phone_number: caller_phone || null,
      call_type: 'Inbound Call',
      call_type_id: null, // Inbound-puheluille ei ole call_type_id:tä
      voice_id: null,
      call_date: new Date().toISOString().split('T')[0],
      call_time: new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
      call_status: call_status || 'completed',
      answered: call_status === 'completed',
      duration: call_duration || null,
      summary: call_summary || 'Saapuva puhelu',
      created_at: new Date().toISOString(),
      inbound_call: true,
      call_transcript: call_transcript || null,
      call_recording_url: call_recording_url || null
    }

    const { data: callLog, error: callLogError } = await supabase
      .from('call_logs')
      .insert(callLogData)
      .select()
      .single()

    if (callLogError) {
      console.error('Error creating call log:', callLogError)
      // Ei palauta virhettä, koska notifikaatio on jo luotu
    }

    return res.status(201).json({ 
      success: true,
      notification,
      call_log: callLog
    })

  } catch (error) {
    console.error('Inbound call webhook error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
