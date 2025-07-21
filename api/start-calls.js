export default async function handler(req, res) {
  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { sheetUrl, phoneNumber, name, callType, script, voice, companyId, recordId } = req.body

    // Tarkista onko kyseessä yksittäinen puhelu vai mass-soitot
    const isSingleCall = phoneNumber && name && !sheetUrl
    const isMassCall = sheetUrl && !phoneNumber && !name

    if (!isSingleCall && !isMassCall) {
      return res.status(400).json({ error: 'Anna joko yksittäisen puhelun tiedot (phoneNumber, name) tai Google Sheets URL mass-soitoille' })
    }

    // Yhteiset validointit
    if (!callType) {
      return res.status(400).json({ error: 'Puhelun tyyppi on pakollinen' })
    }

    if (!script || !script.trim()) {
      return res.status(400).json({ error: 'Skripti on pakollinen' })
    }

    if (!voice) {
      return res.status(400).json({ error: 'Ääni on pakollinen' })
    }

    // Yksittäisen puhelun validointit
    if (isSingleCall) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nimi on pakollinen' })
      }

      if (!phoneNumber || !phoneNumber.trim()) {
        return res.status(400).json({ error: 'Puhelinnumero on pakollinen' })
      }

      if (!recordId) {
        return res.status(400).json({ error: 'Puhelun tyypin tunniste on pakollinen' })
      }
    }

    // Mass-soittojen validointit
    if (isMassCall) {
      if (!sheetUrl || !sheetUrl.trim()) {
        return res.status(400).json({ error: 'Google Sheets URL on pakollinen' })
      }
    }

    // Käsittele yksittäinen puhelu
    if (isSingleCall) {
      // N8N webhook URL ja API key ympäristömuuttujista
      const webhookUrl = process.env.N8N_SINGLE_CALL
      const secretKey = process.env.N8N_SECRET_KEY
      
      if (!webhookUrl) {
        console.error('N8N_SINGLE_CALL ympäristömuuttuja puuttuu')
        return res.status(500).json({ error: 'Palvelun konfiguraatio puuttuu' })
      }

      if (!secretKey) {
        console.error('N8N_SECRET_KEY ympäristömuuttuja puuttuu')
        return res.status(500).json({ error: 'API-avain puuttuu' })
      }

      // Lähetä yksittäinen puhelu N8N:ään
      const payload = {
        action: 'single-call',
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        callType,
        recordId,
        script: script.trim(),
        voice,
        companyId,
        timestamp: new Date().toISOString(),
        source: 'rascal-ai-dashboard'
      }

      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': secretKey
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('N8N webhook epäonnistui:', response.status, errorText)
        return res.status(500).json({ 
          error: 'Puhelun käynnistys epäonnistui',
          details: `HTTP ${response.status}: ${errorText}`
        })
      }

      const result = await response.json()

      // Palauta onnistumisviesti yksittäiselle puhelulle
      return res.status(200).json({
        success: true,
        message: `Puhelu henkilölle ${name.trim()} (${phoneNumber.trim()}) käynnistetty onnistuneesti`,
        callId: result.callId || null,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        callType,
        recordId,
        voice,
        timestamp: payload.timestamp
      })
    }

    // Käsittele mass-soitot (Google Sheets)
    // Tarkista että URL on Google Sheets -muotoa ja poimi sheet ID
    const googleSheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    const match = sheetUrl.trim().match(googleSheetsRegex)
    
    if (!match) {
      return res.status(400).json({ error: 'Virheellinen Google Sheets URL. URL:n tulee olla muotoa: https://docs.google.com/spreadsheets/d/[ID]' })
    }

    const sheetId = match[1]
    
    // Koska tiedostot ovat julkisia, voimme hakea tiedot suoraan
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`

    // Käytä mass-call endpointia mass-soitoille
    const massCallResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:5173'}/api/mass-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sheetUrl: sheetUrl.trim(),
        callType,
        script: script.trim(),
        voice,
        companyId
      })
    })

    if (!massCallResponse.ok) {
      const errorText = await massCallResponse.text()
      console.error('Mass-call endpoint epäonnistui:', massCallResponse.status, errorText)
      return res.status(500).json({ 
        error: 'Soittojen käynnistys epäonnistui',
        details: `HTTP ${massCallResponse.status}: ${errorText}`
      })
    }

    const result = await massCallResponse.json()

    // Palauta käynnistystulokset
    return res.status(200).json({
      success: true,
      sheetId,
      callType,
      voice,
      totalCalls: result.totalCalls || 0,
      startedCalls: result.startedCalls || 0,
      failedCalls: result.failedCalls || 0,
      message: result.message || 'Soittojen käynnistys aloitettu onnistuneesti',
      timestamp: result.timestamp,
      batchId: result.batchId || null
    })

  } catch (error) {
    console.error('Start calls API virhe:', error)
    res.status(500).json({ 
      error: 'Palvelinvirhe soittojen käynnistyksessä',
      details: error.message 
    })
  }
} 