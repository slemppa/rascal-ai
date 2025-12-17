import { withOrganization } from '../middleware/with-organization.js'
import logger from '../lib/logger.js'

async function handler(req, res) {
  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { source, sheetUrl, contacts, callType, script, voice, voice_id, scheduledDate, scheduledTime, sms_first, sms_after_call, sms_missed_call, newCampaignId, contactSegmentId } = req.body
    const supabase = req.supabase
    const organization = req.organization

    if (!organization?.id) {
      return res.status(403).json({ error: 'Organisaatiota ei löytynyt' })
    }

    const publicUserId = organization.id

    // Käytä voice_id:tä jos saatavilla, muuten voice:tä
    const voiceToUse = voice_id || voice
    if (!voiceToUse) {
      return res.status(400).json({ error: 'Ääni on pakollinen' })
    }

    if (!callType) {
      return res.status(400).json({ error: 'Puhelun tyyppi on pakollinen' })
    }

    // Hae call_type_id call_types taulusta
    const { data: callTypeData, error: callTypeError } = await supabase
      .from('call_types')
      .select('id')
      .eq('name', callType)
      .eq('user_id', publicUserId)
      .single()

    if (callTypeError || !callTypeData) {
      logger.error('Call type haku epäonnistui:', callTypeError)
      return res.status(400).json({ 
        error: 'Puhelun tyyppiä ei löytynyt',
        details: callTypeError?.message || 'Call type not found'
      })
    }

    const call_type_id = callTypeData.id

    // Määrittele lähde: 'contacts' tai 'sheets' (default)
    const massCallSource = source || (contacts ? 'contacts' : 'sheets')

    if (massCallSource === 'contacts') {
      // CONTACTS-POHJAINEN LOGIIKKA (entinen mika-mass-call.js)
      return await handleContactsBasedMassCall(req, res, {
        contacts,
        callType,
        script,
        voiceToUse,
        publicUserId,
        call_type_id,
        supabase
      })
    } else {
      // SHEETS-POHJAINEN LOGIIKKA (entinen mass-call.js)
      return await handleSheetsBasedMassCall(req, res, {
        sheetUrl,
        callType,
        script,
        voiceToUse,
        publicUserId,
        call_type_id,
        scheduledDate,
        scheduledTime,
        sms_first,
        sms_after_call,
        sms_missed_call,
        newCampaignId,
        contactSegmentId,
        supabase
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

// CONTACTS-POHJAINEN MASS-CALL (entinen mika-mass-call.js logiikka)
async function handleContactsBasedMassCall(req, res, { contacts, callType, script, voiceToUse, publicUserId, call_type_id, supabase }) {
  logger.log('🔍 Contacts-based mass-call endpoint sai dataa:', { 
    contactsCount: contacts?.length, 
    callType, 
    script, 
    voiceToUse
  })

  // Validointi
  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: 'Kontaktidata on pakollinen' })
  }

  if (!script || !script.trim()) {
    return res.status(400).json({ error: 'Skripti on pakollinen' })
  }

  // Valmistellaan puhelut call_logs tauluun
  const callLogs = []
  let errorCount = 0
  
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i]
    
    // Etsi puhelinnumero ja nimi
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
        user_id: publicUserId,
        customer_name: name,
        phone_number: phoneNumber,
        call_type: callType,
        call_type_id: call_type_id,
        voice_id: voiceToUse,
        call_date: new Date().toISOString(),
        call_status: 'pending',
        campaign_id: `mass-call-contacts-${Date.now()}`,
        summary: `Mass-call (contacts): ${script.trim().substring(0, 100)}...`,
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
    logger.error('Supabase insert error:', insertError)
    return res.status(500).json({ 
      error: 'Virhe call_logs kirjoittamisessa',
      details: insertError.message 
    })
  }

  const successCount = insertedLogs.length

  // Palauta tulokset
  res.status(200).json({
    success: true,
    source: 'contacts',
    callType,
    call_type_id,
    voice: voiceToUse,
    totalCalls: callLogs.length,
    startedCalls: successCount,
    failedCalls: errorCount,
    message: `Mass-call (contacts) käynnistetty onnistuneesti. ${successCount} puhelua lisätty call_logs tauluun.`,
    timestamp: new Date().toISOString()
  })
}

// SHEETS-POHJAINEN MASS-CALL (entinen mass-call.js logiikka)
async function handleSheetsBasedMassCall(req, res, { 
  sheetUrl, callType, script, voiceToUse, publicUserId, call_type_id, 
  scheduledDate, scheduledTime, sms_first, sms_after_call, sms_missed_call, 
  newCampaignId, contactSegmentId, supabase 
}) {
  logger.log('🔍 Sheets-based mass-call endpoint sai dataa:', { 
    sheetUrl, 
    callType, 
    scriptExists: Boolean(script), 
    voice: voiceToUse, 
    scheduledDate, 
    scheduledTime, 
    sms_first: Boolean(sms_first), 
    sms_after_call: Boolean(sms_after_call), 
    sms_missed_call: Boolean(sms_missed_call), 
    newCampaignId 
  })

  // Validointi
  if (!sheetUrl || !sheetUrl.trim()) {
    return res.status(400).json({ error: 'Google Sheets URL on pakollinen' })
  }

  // Normalisoi newCampaignId: tyhjä string -> null, muuten käytä UUID:ta sellaisenaan
  let normalizedCampaignId = (newCampaignId && typeof newCampaignId === 'string' && newCampaignId.trim()) ? newCampaignId.trim() : null
  logger.log('🔍 Campaign ID debug:', { newCampaignId, normalizedCampaignId, type: typeof newCampaignId })

  // Valmistele päivämäärä ja kellonaika
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const toHHMM = (dateObj) => `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
  const normalizeTime = (t) => {
    if (!t) return null
    let x = String(t).trim()
    x = x.replace(/\./g, ':')
    if (/^\d{2}:\d{2}$/.test(x)) return x
    if (/^\d{2}:\d{2}:\d{2}$/.test(x)) {
      const [h, m] = x.split(':')
      return `${h}:${m}`
    }
    try {
      const [h, m] = x.split(':')
      const hh = String(Number(h)).padStart(2, '0')
      const minutesNum = Number(m || 0)
      const mm = minutesNum >= 30 ? '30' : '00'
      return `${hh}:${mm}`
    } catch {
      return toHHMM(now)
    }
  }

  const isScheduled = Boolean(scheduledDate && scheduledTime)
  const effectiveDate = isScheduled ? String(scheduledDate).slice(0, 10) : today
  const effectiveTime = isScheduled ? normalizeTime(scheduledTime) : toHHMM(now)

  // Tarkista että URL on Google Sheets -muotoa ja poimi sheet ID
  const googleSheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  const match = sheetUrl.trim().match(googleSheetsRegex)
  
  if (!match) {
    return res.status(400).json({ error: 'Virheellinen Google Sheets URL. URL:n tulee olla muotoa: https://docs.google.com/spreadsheets/d/[ID]' })
  }

  const sheetId = match[1]
  const gidMatch = sheetUrl.match(/[?&#]gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : null
  const candidateUrls = gid
    ? [`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`]
    : [
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`
      ]

  // Varmista että kampanja on olemassa jos se on annettu
  if (normalizedCampaignId) {
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', normalizedCampaignId)
      .eq('user_id', publicUserId)
      .single()

    if (campaignError || !campaignData) {
      console.warn('⚠️ Campaign not found or access denied:', { normalizedCampaignId, error: campaignError?.message })
      normalizedCampaignId = null
    } else {
      logger.log('✅ Campaign found:', normalizedCampaignId)
    }
  }

  // Hae tiedot Google Sheets -tiedostosta
  try {
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
        return res.status(400).json({ error: 'Välilehteä ei löytynyt (404). Varmista oikea gid-parametri.' })
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
    let blockedCount = 0
    const blockedReasons = {}
    
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
      
      // Etsi nimi
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
        // Normalisoi suomalainen numero
        const normalized = normalizeFinnishPhone(String(phoneNumber))
        
        // Tarkista estetyt numeroalueet
        const blockedCheck = isBlockedNumber(phoneNumber, normalized)
        if (blockedCheck.blocked) {
          blockedCount++
          const reason = blockedCheck.reason
          blockedReasons[reason] = (blockedReasons[reason] || 0) + 1
          continue
        }
        
        const isValidFinn = normalized ? /^\+358\d{7,11}$/.test(normalized) : false
        if (!isValidFinn) {
          errorCount++
          continue
        }
        
        const callLogEntry = {
          user_id: publicUserId,
          customer_name: name,
          phone_number: normalized,
          email: email,
          call_type: callType,
          call_type_id: call_type_id,
          voice_id: voiceToUse,
          call_date: effectiveDate,
          call_time: effectiveTime,
          call_status: 'pending',
          campaign_id: normalizedCampaignId || `mass-call-${Date.now()}`,
          new_campaign_id: normalizedCampaignId,
          contact_segment_id: contactSegmentId && contactSegmentId.trim() ? contactSegmentId.trim() : null,
          summary: script && script.trim() ? `Mass-call: ${script.trim().substring(0, 100)}...` : `Mass-call: ${callType}`,
          sms_first: Boolean(sms_first),
          after_call_sms_sent: Boolean(sms_after_call),
          missed_call_sms_sent: Boolean(sms_missed_call)
        }
        
        callLogs.push(callLogEntry)
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
      logger.error('Supabase insert error:', insertError)
      return res.status(500).json({ 
        error: 'Virhe call_logs kirjoittamisessa',
        details: insertError.message 
      })
    }

    successCount = insertedLogs.length

    // Palauta tulokset
    res.status(200).json({
      success: true,
      source: 'sheets',
      sheetId,
      callType,
      call_type_id,
      voice: voiceToUse,
      totalCalls: callLogs.length,
      startedCalls: successCount,
      failedCalls: errorCount,
      blockedCalls: blockedCount,
      blockedReasons: blockedReasons,
      message: `Mass-call (sheets) käynnistetty onnistuneesti. ${successCount} puhelua lisätty call_logs tauluun.${blockedCount > 0 ? ` ${blockedCount} numeroa ei lisätty (estettyjen alueiden vuoksi).` : ''}`,
      timestamp: new Date().toISOString()
    })
    
  } catch (csvError) {
    logger.error('CSV-haku epäonnistui:', csvError)
    logger.error('CSV-virheen stack trace:', csvError.stack)
    return res.status(500).json({ 
      error: 'Google Sheets -tiedoston lukeminen epäonnistui',
      details: csvError.message 
    })
  }
}

// Apufunktiot
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isBlockedNumber(originalNumber, normalizedNumber) {
  // Estosuodatus poistettu: sallitaan kaikki numerot
  return { blocked: false, reason: null }
}

function normalizeFinnishPhone(input) {
  if (!input) return null
  let x = String(input).trim()
  x = x.replace(/[\s-]/g, '')
  if (/^0\d+/.test(x)) {
    return '+358' + x.slice(1)
  }
  if (x.startsWith('00358')) {
    return '+358' + x.slice(5)
  }
  if (x.startsWith('358')) {
    return '+358' + x.slice(3)
  }
  if (x.startsWith('+358')) return x
  if (x.startsWith('+')) return x
  if (/^\d{7,12}$/.test(x)) {
    return '+358' + (x.startsWith('0') ? x.slice(1) : x)
  }
  return null
}

export default withOrganization(handler)
