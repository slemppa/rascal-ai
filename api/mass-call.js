import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL
// Käytä ensin service role -avainta; jos puuttuu, käytetään anon key:tä ja pyydetään Authorization header käyttäjältä
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
  || process.env.SUPABASE_SERVICE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
  console.error('❌ Missing Supabase envs in mass-call', {
    has_SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    has_VITE_SUPABASE_URL: Boolean(process.env.VITE_SUPABASE_URL),
    has_NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    has_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    has_SERVICE_KEY: Boolean(process.env.SUPABASE_SERVICE_KEY),
    has_ANON: Boolean(supabaseAnonKey)
  })
  throw new Error('Missing Supabase environment variables')
}

// Luodaan Supabase client vasta handlerissa (valitaan service/anon + token siellä)

export default async function handler(req, res) {
  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { sheetUrl, callType, script, voice, voice_id, user_id, scheduledDate, scheduledTime } = req.body
    const access_token = req.headers['authorization']?.replace('Bearer ', '')

    console.log('🔍 Mass-call endpoint sai dataa:', { sheetUrl, callType, scriptExists: Boolean(script), voice, voice_idExists: Boolean(voice_id), user_id, scheduledDate, scheduledTime, hasAccessToken: Boolean(access_token), usingServiceRole: Boolean(supabaseServiceKey) })

    // Luo Supabase client
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey,
      access_token && !supabaseServiceKey ? { global: { headers: { Authorization: `Bearer ${access_token}` } } } : undefined
    )

    // Validointi
    if (!sheetUrl || !sheetUrl.trim()) {
      return res.status(400).json({ error: 'Google Sheets URL on pakollinen' })
    }

    if (!callType) {
      return res.status(400).json({ error: 'Puhelun tyyppi on pakollinen' })
    }

    // Skripti on nykyisessä virrassa vapaaehtoinen (käytetään summaryssa jos annettu)

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

    // Valmistele päivämäärä ja kellonaika
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const toHHMMSS = (dateObj) => `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`
    const normalizeTime = (t) => {
      if (!t) return null
      let x = String(t).trim()
      // Vaihda mahdolliset pisteet kaksoispisteiksi
      x = x.replace(/\./g, ':')
      // Lisää sekunnit jos puuttuu
      if (/^\d{2}:\d{2}$/.test(x)) return `${x}:00`
      // Jos jo HH:MM:SS muodossa, palauta sellaisenaan
      if (/^\d{2}:\d{2}:\d{2}$/.test(x)) return x
      // Viimeinen yritys: jos vain tunnit/minuutit, yritä parsia
      try {
        const [h, m, s] = x.split(':')
        const hh = String(Number(h)).padStart(2, '0')
        // Pyöristä 00 tai 30
        const minutesNum = Number(m || 0)
        const mm = minutesNum >= 30 ? '30' : '00'
        const ss = String(Number(s || 0)).padStart(2, '0')
        return `${hh}:${mm}:${ss}`
      } catch {
        return toHHMMSS(now)
      }
    }

    const isScheduled = Boolean(scheduledDate && scheduledTime)
    const effectiveDate = isScheduled ? String(scheduledDate).slice(0, 10) : today
    const effectiveTime = isScheduled ? normalizeTime(scheduledTime) : normalizeTime(toHHMMSS(now))

    // Tarkista että URL on Google Sheets -muotoa ja poimi sheet ID
    const googleSheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    const match = sheetUrl.trim().match(googleSheetsRegex)
    
    if (!match) {
      return res.status(400).json({ error: 'Virheellinen Google Sheets URL. URL:n tulee olla muotoa: https://docs.google.com/spreadsheets/d/[ID]' })
    }

    const sheetId = match[1]
    // Poimi gid, jos annettu. Muuten yritä ilman gid-paramia ja varalla gid=0
    const gidMatch = sheetUrl.match(/[?&#]gid=(\d+)/)
    const gid = gidMatch ? gidMatch[1] : null
    const candidateUrls = gid
      ? [
          `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
        ]
      : [
          `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
          `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`
        ]

    // Hae tiedot Google Sheets -tiedostosta
    try {
      // Sama kestävä haku kuin validate-sheet: yritä useampaa URL:ia ja vältä HTML-redirectteja
      const attemptFetchCsv = async (url) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000)
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'RascalAI/1.0 (+https://rascal-ai)',
              'Accept': 'text/csv, */*'
            },
            signal: controller.signal
          })
          const contentType = response.headers.get('content-type') || ''
          const text = await response.text()
          return {
            ok: response.ok,
            status: response.status,
            contentType,
            text,
            isHtml: contentType.includes('text/html') || text.trim().startsWith('<')
          }
        } finally {
          clearTimeout(timeoutId)
        }
      }

      let csvText = null
      let lastStatus = null
      for (const url of candidateUrls) {
        const result = await attemptFetchCsv(url)
        lastStatus = result.status
        if (result.ok && !result.isHtml) {
          csvText = result.text
          break
        }
      }

      if (csvText === null) {
        if (lastStatus === 403) {
          return res.status(400).json({ error: 'Pääsy estetty (403) – jaa Google Sheets julkiseksi (Anyone with the link can view).' })
        }
        if (lastStatus === 404) {
          return res.status(400).json({ error: 'Välilehteä ei löytynyt (404). Varmista oikea gid-parameteri.' })
        }
        if (lastStatus && lastStatus >= 500) {
          return res.status(502).json({ error: 'Google palautti virheen (5xx). Yritä hetken kuluttua.' })
        }
        return res.status(500).json({ error: 'CSV-haku epäonnistui.' })
      }

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
      
      // Etsitään sähköpostisarakkeet
      const emailColumns = headers.filter(header => 
        header.toLowerCase().includes('email') || 
        header.toLowerCase().includes('sähköposti') || 
        header.toLowerCase().includes('e-mail') ||
        header.toLowerCase().includes('mail')
      )
      
      if (phoneColumns.length === 0) {
        return res.status(400).json({ error: 'Puhelinnumerosarakkeita ei löytynyt. Tarkista että tiedostossa on sarake nimeltä "phone", "puhelin", "numero" tai "tel".' })
      }
      
      // Valmistellaan puhelut call_logs tauluun - Nimi, Puhelinnumero ja Sähköposti
      const callLogs = []
      let successCount = 0
      let errorCount = 0
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
        
        // Etsi puhelinnumero, nimi ja sähköposti
        let phoneNumber = null
        let name = null
        let email = null
        
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
        
        // Etsi sähköposti
        for (const emailCol of emailColumns) {
          const colIndex = headers.indexOf(emailCol)
          if (colIndex >= 0 && values[colIndex]) {
            const emailValue = values[colIndex]
            // Validoi sähköposti
            if (isValidEmail(emailValue)) {
              email = emailValue.toLowerCase().trim()
              break
            }
          }
        }
        
        // Jos nimeä ei löytynyt, käytä ensimmäistä ei-tyhjää saraketta
        if (!name) {
          for (let j = 0; j < values.length; j++) {
            if (values[j] && !phoneColumns.includes(headers[j]) && !emailColumns.includes(headers[j])) {
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
            email: email, // Lisää sähköposti
            call_type: callType, // Teksti "Toiminnot" kentästä
            call_type_id: call_type_id, // ID call_types taulusta
            voice_id: voiceToUse, // Käytä voice_id:tä tai voice:tä
            call_date: effectiveDate,
            call_time: effectiveTime,
            call_status: 'pending',
            campaign_id: `mass-call-${Date.now()}`,
            summary: script && script.trim() ? `Mass-call: ${script.trim().substring(0, 100)}...` : `Mass-call: ${callType}`
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

// Apufunktio sähköpostin validoimiseen
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
} 