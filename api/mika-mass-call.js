import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucnBsb3hqaWdveXFham9xZ2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

// Käytä anonyymiä clientia kehitysympäristössä
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { contacts, callType, script, voice, voice_id, user_id } = req.body

    console.log('🔍 Mika mass-call endpoint sai dataa:', { 
      contactsCount: contacts?.length, 
      callType, 
      script, 
      voice, 
      voice_id, 
      user_id 
    })
    
    console.log('🔍 Mika mass-call debug - contacts:', contacts)
    console.log('🔍 Mika mass-call debug - callType:', callType)
    console.log('🔍 Mika mass-call debug - script:', script)
    console.log('🔍 Mika mass-call debug - voice_id:', voice_id)
    console.log('🔍 Mika mass-call debug - user_id:', user_id)

    // Validointi
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Kontaktidata on pakollinen' })
    }

    if (!callType) {
      return res.status(400).json({ error: 'Puhelun tyyppi on pakollinen' })
    }

    if (!script || !script.trim()) {
      return res.status(400).json({ error: 'Skripti on pakollinen' })
    }

    // Käytä voice_id:tä jos saatavilla, muuten voice:tä
    const voiceToUse = voice_id || voice
    if (!voiceToUse) {
      return res.status(400).json({ error: 'Ääni on pakollinen' })
    }

    // Hae ensin public.users.id käyttäen auth_user_id:tä
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user_id)
      .single()

    if (userError || !userData) {
      console.error('User haku epäonnistui:', userError)
      return res.status(400).json({ 
        error: 'Käyttäjää ei löytynyt',
        details: userError?.message || 'User not found'
      })
    }

    const publicUserId = userData.id

    // Hae call_type_id call_types taulusta käyttäen public.users.id:tä
    const { data: callTypeData, error: callTypeError } = await supabase
      .from('call_types')
      .select('id')
      .eq('name', callType)
      .eq('user_id', publicUserId)
      .single()

    if (callTypeError || !callTypeData) {
      console.error('Call type haku epäonnistui:', callTypeError)
      return res.status(400).json({ 
        error: 'Puhelun tyyppiä ei löytynyt',
        details: callTypeError?.message || 'Call type not found'
      })
    }

    const call_type_id = callTypeData.id

    // Valmistellaan puhelut call_logs tauluun
    const callLogs = []
    let successCount = 0
    let errorCount = 0
    
    for (const contact of contacts) {
      const { name, phone, email, company, title, address } = contact
      
      if (phone && name) {
        callLogs.push({
          user_id: publicUserId,
          customer_name: name,
          phone_number: phone,
          call_type: callType,
          call_type_id: call_type_id,
          voice_id: voiceToUse,
          call_date: new Date().toISOString(),
          call_status: 'pending',
          campaign_id: `mika-mass-call-${Date.now()}`,
          summary: `Mika Special mass-call: ${script.trim().substring(0, 100)}...`,
          // Lisätään ylimääräiset tiedot metadata-kenttiin
          metadata: {
            email: email || null,
            company: company || null,
            title: title || null,
            address: address || null
          }
        })
        successCount++
      } else {
        errorCount++
      }
    }
    
    if (callLogs.length === 0) {
      return res.status(400).json({ error: 'Kelvollisia kontakteja ei löytynyt' })
    }
    
    console.log(`📞 Mika mass-call: ${callLogs.length} puhelua valmisteltu`)
    
    // Kirjoita call_logs tauluun Supabaseen
    const { data: insertedLogs, error: insertError } = await supabase
      .from('call_logs')
      .insert(callLogs)
      .select()

    if (insertError) {
      console.error('Call logs kirjoitus epäonnistui:', insertError)
      return res.status(500).json({ 
        error: 'Virhe call_logs kirjoittamisessa',
        details: insertError.message 
      })
    }

    console.log(`✅ Mika mass-call onnistui: ${insertedLogs.length} puhelua lisätty`)

    return res.status(200).json({
      success: true,
      message: 'Mika Special mass-call käynnistetty onnistuneesti',
      data: {
        totalContacts: contacts.length,
        successfulCalls: insertedLogs.length,
        failedCalls: errorCount,
        callLogs: insertedLogs
      }
    })

  } catch (error) {
    console.error('Mika mass-call virhe:', error)
    return res.status(500).json({ 
      error: 'Mika mass-call virhe',
      details: error.message 
    })
  }
} 