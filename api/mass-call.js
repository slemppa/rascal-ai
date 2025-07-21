export default async function handler(req, res) {
  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { sheetUrl, callType, script, voice, companyId } = req.body

    console.log('🔍 Mass-call endpoint sai dataa:', { sheetUrl, callType, script, voice, companyId })

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

    if (!voice) {
      return res.status(400).json({ error: 'Ääni on pakollinen' })
    }

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
      
      // Valmistellaan puhelut
      const calls = []
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
          calls.push({
            name,
            phoneNumber,
            callType,
            script: script.trim(),
            voice,
            companyId,
            rowIndex: i + 1,
            timestamp: new Date().toISOString()
          })
        } else {
          errorCount++
        }
      }
      
      if (calls.length === 0) {
        return res.status(400).json({ error: 'Puhelinnumeroita ei löytynyt tiedostosta' })
      }
      
      // Lähetä puhelut N8N:ään batchina
      const webhookUrl = process.env.N8N_MASS_CALL
      const secretKey = process.env.N8N_SECRET_KEY
      
      if (!webhookUrl) {
        console.error('N8N_MASS_CALL ympäristömuuttuja puuttuu')
        return res.status(500).json({ error: 'Palvelun konfiguraatio puuttuu' })
      }

      if (!secretKey) {
        console.error('N8N_SECRET_KEY ympäristömuuttuja puuttuu')
        return res.status(500).json({ error: 'API-avain puuttuu' })
      }
      
      const payload = {
        action: 'mass-call',
        calls,
        sheetId,
        sheetUrl: sheetUrl.trim(),
        csvUrl,
        callType,
        script: script.trim(),
        voice,
        companyId,
        totalCalls: calls.length,
        timestamp: new Date().toISOString(),
        source: 'rascal-ai-dashboard'
      }

      const requestHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': secretKey
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('N8N webhook epäonnistui:', response.status, errorText)
        return res.status(500).json({ 
          error: 'Mass-call käynnistys epäonnistui',
          details: `HTTP ${response.status}: ${errorText}`
        })
      }

      const result = await response.json()

      // Palauta tulokset
      res.status(200).json({
        success: true,
        sheetId,
        callType,
        voice,
        totalCalls: calls.length,
        startedCalls: result.startedCalls || calls.length,
        failedCalls: errorCount,
        message: `Mass-call käynnistetty onnistuneesti. ${calls.length} puhelua lisätty jonoon.`,
        timestamp: payload.timestamp,
        batchId: result.batchId || null
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