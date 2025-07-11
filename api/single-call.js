export default async function handler(req, res) {
  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { phoneNumber, name, callType, recordId, script, voice, companyId } = req.body

    // Validointi
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nimi on pakollinen' })
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ error: 'Puhelinnumero on pakollinen' })
    }

    if (!callType) {
      return res.status(400).json({ error: 'Puhelun tyyppi on pakollinen' })
    }

    if (!recordId) {
      return res.status(400).json({ error: 'Puhelun tyypin tunniste on pakollinen' })
    }

    if (!script || !script.trim()) {
      return res.status(400).json({ error: 'Skripti on pakollinen' })
    }

    if (!voice) {
      return res.status(400).json({ error: 'Ääni on pakollinen' })
    }

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

    // Lähetä data N8N:ään
    const payload = {
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

    // Palauta onnistumisviesti
    res.status(200).json({
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

  } catch (error) {
    console.error('Single call API virhe:', error)
    res.status(500).json({ 
      error: 'Palvelinvirhe puhelun käynnistyksessä',
      details: error.message 
    })
  }
} 