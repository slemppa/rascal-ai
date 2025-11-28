import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Environment variables check:')
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'EXISTS' : 'MISSING')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'EXISTS' : 'MISSING')
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'EXISTS' : 'MISSING')
console.log('Using supabaseUrl:', supabaseUrl ? 'FOUND' : 'MISSING')

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { contacts, callType, script, voice, voice_id } = req.body

    console.log('🔍 Mika mass-call endpoint sai dataa:', { 
      contactsCount: contacts?.length, 
      callType, 
      script, 
      voice, 
      voice_id
    })
    console.log('📞 Contacts data:', contacts)
    console.log('🎤 Voice data:', { voice, voice_id, selectedVoice: voice_id || voice })

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
    console.log('🔊 Voice validation:', { voice, voice_id, voiceToUse })
    if (!voiceToUse) {
      return res.status(400).json({ error: 'Ääni on pakollinen' })
    }

    // Käytä samaa logiikkaa kuin mass-call.js - ei tokenia
    // Jos service role key on saatavilla, käytä sitä. Muuten käytä anonyymiä key:tä.
    
    // Hae käyttäjän tiedot request bodysta (frontend lähettää user_id:n)
    const { user_id } = req.body
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }
    
    console.log('🔍 User ID from request:', user_id)

    // Hae public.users.id käyttäen auth_user_id:tä
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

    // Valmistellaan puhelut call_logs tauluun - samalla tavalla kuin mass-call.js
    const callLogs = []
    let errorCount = 0
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]
      
      // Etsi puhelinnumero ja nimi - samalla logiikalla kuin mass-call.js
      let phoneNumber = null
      let name = null
      
      // Etsi puhelinnumero (tarkista eri kentät)
      if (contact.phone) {
        phoneNumber = contact.phone
      } else if (contact.phones && contact.phones[0]) {
        phoneNumber = contact.phones[0]
      } else if (contact.phone_number) {
        phoneNumber = contact.phone_number
      } else if (contact.tel) {
        phoneNumber = contact.tel
      }
      
      // Etsi nimi (tarkista eri kentät)
      if (contact.name) {
        name = contact.name
      } else if (contact.customer_name) {
        name = contact.customer_name
      } else if (contact.first_name && contact.last_name) {
        name = `${contact.first_name} ${contact.last_name}`
      } else if (contact.etunimi && contact.sukunimi) {
        name = `${contact.etunimi} ${contact.sukunimi}`
      }
      
      // Jos nimeä ei löytynyt, käytä ensimmäistä ei-tyhjää kenttää
      if (!name) {
        const possibleNameFields = ['title', 'company', 'organization', 'email']
        for (const field of possibleNameFields) {
          if (contact[field]) {
            name = contact[field]
            break
          }
        }
      }
      
      // Jos nimeä ei vieläkään löytynyt, käytä "Asiakas X"
      if (!name) {
        name = `Asiakas ${i + 1}`
      }
      
      if (phoneNumber) {
        callLogs.push({
          user_id: publicUserId, // Käytä public.users.id
          customer_name: name,
          phone_number: phoneNumber,
          call_type: callType, // Teksti "name" kentästä
          call_type_id: call_type_id, // ID call_types taulusta
          voice_id: voiceToUse, // Käytä voice_id:tä tai voice:tä
          call_date: new Date().toISOString(),
          call_status: 'pending',
          campaign_id: `mika-mass-call-${Date.now()}`,
          summary: `Mika Special mass-call: ${script.trim().substring(0, 100)}...`,
          crm_id: contact.id || null
        })
      } else {
        errorCount++
      }
    }
    
    if (callLogs.length === 0) {
      return res.status(400).json({ error: 'Puhelinnumeroita ei löytynyt kontaktidatasta' })
    }
    
    // Kirjoita call_logs tauluun Supabaseen
    const { data: insertedLogs, error: insertError } = await supabase
      .from('call_logs')
      .insert(callLogs)
      .select()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return res.status(500).json({ 
        error: 'Virhe call_logs kirjoittamisessa',
        details: insertError.message 
      })
    }

    const successCount = insertedLogs.length

    // Palauta tulokset samassa muodossa kuin mass-call.js
    res.status(200).json({
      success: true,
      callType,
      call_type_id,
      voice: voiceToUse,
      totalCalls: callLogs.length,
      startedCalls: successCount,
      failedCalls: errorCount,
      message: `Mika Special mass-call käynnistetty onnistuneesti. ${successCount} puhelua lisätty call_logs tauluun.`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Mika mass-call API virhe:', error)
    console.error('Virheen stack trace:', error.stack)
    res.status(500).json({ 
      error: 'Palvelinvirhe Mika mass-call käynnistyksessä',
      details: error.message 
    })
  }
} 