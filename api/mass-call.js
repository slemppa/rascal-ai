import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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
    const { sheetUrl, callType, script, voice, voice_id, user_id } = req.body

    console.log('🔍 Mass-call endpoint sai dataa:', { sheetUrl, callType, script, voice, voice_id, user_id })

    // Validointi
    if (!sheetUrl || !sheetUrl.trim()) {
      return res.status(400).json({ error: 'Google Sheets URL on pakollinen' })
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
      .eq('Toiminnot', callType)
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

    // Tarkista että URL on Google Sheets -muotoa ja poimi sheet ID
    const googleSheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    const match = sheetUrl.trim().match(googleSheetsRegex)
    
    if (!match) {
      return res.status(400).json({ error: 'Virheellinen Google Sheets URL. URL:n tulee olla muotoa: https://docs.google.com/spreadsheets/d/[ID]' })
    }

    const sheetId = match[1]
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`

    // Hae tiedot Google Sheets -tiedostosta
    try {
      const csvResponse = await fetch(csvUrl)
      if (!csvResponse.ok) {
        throw new Error(`CSV-haku epäonnistui: ${csvResponse.status}`)
      }
      
      const csvText = await csvResponse.text()
      const lines = csvText.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        return res.status(400).json({ error: 'Google Sheets -tiedosto on tyhjä' })
      }
      
      // Parsitaan CSV-data
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const dataRows = lines.slice(1).filter(line => line.trim())
      
      // Etsitään puhelinnumerosarakkeet
      const phoneColumns = headers.filter(header => 
        header.toLowerCase().includes('phone') || 
        header.toLowerCase().includes('puhelin') || 
        header.toLowerCase().includes('numero') ||
        header.toLowerCase().includes('tel')
      )
      
      if (phoneColumns.length === 0) {
        return res.status(400).json({ error: 'Puhelinnumerosarakkeita ei löytynyt. Tarkista että tiedostossa on sarake nimeltä "phone", "puhelin", "numero" tai "tel".' })
      }
      
      // Valmistellaan puhelut call_logs tauluun - vain Nimi ja Puhelinnumero
      const callLogs = []
      let successCount = 0
      let errorCount = 0
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
        
        // Etsi puhelinnumero ja nimi
        let phoneNumber = null
        let name = null
        
        // Etsi puhelinnumero
        for (const phoneCol of phoneColumns) {
          const colIndex = headers.indexOf(phoneCol)
          if (colIndex >= 0 && values[colIndex]) {
            phoneNumber = values[colIndex]
            break
          }
        }
        
        // Etsi nimi (etsi sarake nimeltä "name", "nimi", "etunimi" jne.)
        const nameColumns = headers.filter(header => 
          header.toLowerCase().includes('name') || 
          header.toLowerCase().includes('nimi') ||
          header.toLowerCase().includes('etunimi') ||
          header.toLowerCase().includes('sukunimi')
        )
        
        for (const nameCol of nameColumns) {
          const colIndex = headers.indexOf(nameCol)
          if (colIndex >= 0 && values[colIndex]) {
            name = values[colIndex]
            break
          }
        }
        
        // Jos nimeä ei löytynyt, käytä ensimmäistä ei-tyhjää saraketta
        if (!name) {
          for (let j = 0; j < values.length; j++) {
            if (values[j] && !phoneColumns.includes(headers[j])) {
              name = values[j]
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
            call_type: callType, // Teksti "Toiminnot" kentästä
            call_type_id: call_type_id, // ID call_types taulusta
            voice_id: voiceToUse, // Käytä voice_id:tä tai voice:tä
            call_date: new Date().toISOString(),
            call_status: 'pending',
            campaign_id: `mass-call-${Date.now()}`,
            summary: `Mass-call: ${script.trim().substring(0, 100)}...`
          })
        } else {
          errorCount++
        }
      }
      
      if (callLogs.length === 0) {
        return res.status(400).json({ error: 'Puhelinnumeroita ei löytynyt tiedostosta' })
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

      successCount = insertedLogs.length

      // Palauta tulokset
      res.status(200).json({
        success: true,
        sheetId,
        callType,
        call_type_id,
        voice: voiceToUse,
        totalCalls: callLogs.length,
        startedCalls: successCount,
        failedCalls: errorCount,
        message: `Mass-call käynnistetty onnistuneesti. ${successCount} puhelua lisätty call_logs tauluun.`,
        timestamp: new Date().toISOString()
      })
      
    } catch (csvError) {
      console.error('CSV-haku epäonnistui:', csvError)
      console.error('CSV-virheen stack trace:', csvError.stack)
      return res.status(500).json({ 
        error: 'Google Sheets -tiedoston lukeminen epäonnistui',
        details: csvError.message 
      })
    }

  } catch (error) {
    console.error('Mass call API virhe:', error)
    console.error('Virheen stack trace:', error.stack)
    res.status(500).json({ 
      error: 'Palvelinvirhe mass-call käynnistyksessä',
      details: error.message 
    })
  }
} 