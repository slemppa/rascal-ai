// Tarkista onko numero estettyjen alueiden joukossa
function isBlockedNumber(originalNumber, normalizedNumber) {
  // Estettyjen alkuperäisten numeroiden tarkistus
  const blockedPrefixes = ['020', '010', '09']
  for (const prefix of blockedPrefixes) {
    if (String(originalNumber).startsWith(prefix)) {
      return { blocked: true, reason: `Estetty numeroalue: ${prefix}` }
    }
  }
  
  // Estettyjen normalisoitujen numeroiden tarkistus
  const blockedNormalized = ['+35820', '+35810', '+3589']
  for (const blocked of blockedNormalized) {
    if (normalizedNumber && normalizedNumber.startsWith(blocked)) {
      return { blocked: true, reason: `Estetty numeroalue: ${blocked}` }
    }
  }
  
  return { blocked: false, reason: null }
}

// Normalisoi suomalaiset puhelinnumerot yhtenäiseen muotoon +358...
function normalizeFinnishPhone(input) {
  if (!input) return null
  let x = String(input).trim()
  // Poista välilyönnit ja yhdysmerkit
  x = x.replace(/[\s-]/g, '')
  // Korvaa alkunolla +358:lla: 050... -> +35850...
  if (/^0\d+/.test(x)) {
    return '+358' + x.slice(1)
  }
  // 00358... -> +358...
  if (x.startsWith('00358')) {
    return '+358' + x.slice(5)
  }
  // 358... -> +358...
  if (x.startsWith('358')) {
    return '+358' + x.slice(3)
  }
  // Jos alkaa jo +, varmista että +358...
  if (x.startsWith('+358')) return x
  // Muut maat: palauta sellaisenaan, tai null jos ei numeroita
  if (x.startsWith('+')) return x
  // Viimeinen yritys: jos pelkkiä numeroita ja pituus näyttää suomalaiselta (9-12), lisää +358
  if (/^\d{7,12}$/.test(x)) {
    return '+358' + (x.startsWith('0') ? x.slice(1) : x)
  }
  return null
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { sheetUrl, user_id } = req.body

    console.log('🔍 Validate-sheet endpoint sai dataa:', { sheetUrl, user_id })

    // Validointi
    if (!sheetUrl || !sheetUrl.trim()) {
      return res.status(400).json({ error: 'Google Sheets URL on pakollinen' })
    }

    // Tarkista että URL on Google Sheets -muotoa ja poimi sheet ID
    const googleSheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    const match = sheetUrl.trim().match(googleSheetsRegex)
    
    if (!match) {
      return res.status(400).json({ error: 'Virheellinen Google Sheets URL. URL:n tulee olla muotoa: https://docs.google.com/spreadsheets/d/[ID]' })
    }

    const sheetId = match[1]
    // Poimi gid, jos se on annettu URL:ssa; muuten yritä ilman gid-paramia ja varalla gid=0
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
      // Apufunktio: yritä hakea CSV yhdestä url:sta
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

      // Yritä kandidaattien läpi, hyväksy ensimmäinen ok ja ei-HTML vastaus
      let csvText = null
      let contentType = ''
      let lastStatus = null
      for (const url of candidateUrls) {
        const result = await attemptFetchCsv(url)
        lastStatus = result.status
        if (result.ok && !result.isHtml) {
          csvText = result.text
          contentType = result.contentType
          break
        }
      }

      // Jos mikään yritys ei onnistunut, palauta mahdollisimman informatiivinen virhe
      if (csvText === null) {
        if (lastStatus === 403) {
          return res.status(400).json({
            error: 'Pääsy estetty (403) – jaa Google Sheets "Anyone with the link can view" -asetuksella tai varmista, että linkki on julkinen.'
          })
        }
        if (lastStatus === 404) {
          return res.status(400).json({
            error: 'Välilehteä ei löytynyt (404). Tarkista, että URL:ssa oleva gid vastaa olemassa olevaa sheet-välilehteä.'
          })
        }
        if (lastStatus === 400) {
          return res.status(400).json({
            error: 'Virheellinen CSV-pyyntö (400). Kokeile: (1) käytä “Copy link to this sheet” jolloin URL sisältää gid-parametrin, tai (2) varmista julkinen lukuoikeus (Anyone with the link can view).'
          })
        }
        if (lastStatus && lastStatus >= 500) {
          return res.status(502).json({
            error: 'Google palasi virheellä (5xx). Yritä uudelleen hetken kuluttua.'
          })
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
        header.toLowerCase().includes('puhelinnumero') ||
        header.toLowerCase().includes('puhelin') || 
        header.toLowerCase().includes('numero') ||
        header.toLowerCase().includes('tel')
      )
      
      // Etsitään sähköpostisarakkeet (tiukempi tunnistus)
      const emailColumns = headers.filter(header => {
        const h = header.toLowerCase()
        return (
          h === 'email' ||
          h === 'e-mail' ||
          h.includes('email') ||
          h.includes('sähköposti') ||
          h.includes('sahkoposti')
        )
      })
      
      if (phoneColumns.length === 0) {
        return res.status(400).json({ error: 'Puhelinnumerosarakkeita ei löytynyt. Tarkista että tiedostossa on sarake nimeltä "phone", "puhelin", "numero" tai "tel".' })
      }
      
      // Etsitään relevantit sarakkeet
      const relevantColumns = headers.filter(header => 
        header.toLowerCase().includes('name') || 
        header.toLowerCase().includes('nimi') || 
        header.toLowerCase().includes('phone') || 
        header.toLowerCase().includes('puhelinnumero') ||
        header.toLowerCase().includes('puhelin') ||
        header.toLowerCase().includes('email') ||
        header.toLowerCase().includes('sähköposti')
      )
      
      // Lasketaan estetyt numerot ja virheelliset numerot
      let blockedCount = 0
      let invalidCount = 0
      const blockedReasons = {}
      
      // Tarkistetaan jokainen puhelinnumero
      for (const row of dataRows) {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
        
        // Etsi puhelinnumero
        let phoneNumber = null
        for (const phoneCol of phoneColumns) {
          const colIndex = headers.indexOf(phoneCol)
          if (colIndex >= 0 && values[colIndex]) {
            phoneNumber = values[colIndex]
            break
          }
        }
        
        if (phoneNumber) {
          // Normalisoi numero
          const normalized = normalizeFinnishPhone(String(phoneNumber))
          
          // Tarkista estetyt numeroalueet
          const blockedCheck = isBlockedNumber(phoneNumber, normalized)
          if (blockedCheck.blocked) {
            blockedCount++
            const reason = blockedCheck.reason
            blockedReasons[reason] = (blockedReasons[reason] || 0) + 1
            continue
          }
          
          // Tarkista onko numero validi suomalainen numero
          const isValidFinn = normalized ? /^\+358\d{7,11}$/.test(normalized) : false
          if (!isValidFinn) {
            invalidCount++
          }
        }
      }
      
      const validPhoneCount = dataRows.length - blockedCount - invalidCount

      // Parsitaan kaikki rivit objekteiksi
      const rows = dataRows.map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
        const obj = {}
        headers.forEach((header, idx) => {
          obj[header] = values[idx] || ''
        })
        return obj
      })

      // Laske todellinen emailCount vain kelvollisista sähköposteista
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i
      let emailCount = 0
      if (emailColumns.length > 0) {
        for (const row of rows) {
          let hasValidEmail = false
          for (const col of emailColumns) {
            const val = row[col]
            if (val && emailRegex.test(String(val).trim())) {
              hasValidEmail = true
              break
            }
          }
          if (hasValidEmail) emailCount++
        }
      }

      return res.status(200).json({
        success: true,
        sheetId,
        phoneCount: validPhoneCount,
        emailCount,
        totalRows: dataRows.length,
        blockedCount,
        invalidCount,
        blockedReasons,
        columns: headers,
        phoneColumns: relevantColumns,
        emailColumns: emailColumns,
        rows, // kaikki rivit objekteina
        message: `Google Sheets -tiedosto validioitu onnistuneesti. Löydetty ${validPhoneCount} kelvollista puhelinnumeroa ja ${emailCount} sähköpostia.${blockedCount > 0 ? ` ${blockedCount} numeroa estetty (estettyjen alueiden vuoksi).` : ''}${invalidCount > 0 ? ` ${invalidCount} numeroa virheellisiä.` : ''}`,
        timestamp: new Date().toISOString()
      })
      
    } catch (csvError) {
      console.error('CSV-haku epäonnistui:', csvError)
      console.error('CSV-virheen stack trace:', csvError.stack)
      const isAbort = csvError && (csvError.name === 'AbortError' || csvError.code === 'ABORT_ERR')
      if (isAbort) {
        return res.status(504).json({ error: 'CSV-haku aikakatkaistiin (timeout). Yritä uudelleen.' })
      }
      return res.status(500).json({ 
        error: 'Google Sheets -tiedoston lukeminen epäonnistui',
        details: csvError && (csvError.message || String(csvError))
      })
    }

  } catch (error) {
    console.error('Validate sheet API virhe:', error)
    console.error('Virheen stack trace:', error.stack)
    res.status(500).json({ 
      error: 'Palvelinvirhe validate-sheet käynnistyksessä',
      details: error.message 
    })
  }
} 