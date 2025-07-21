export default async function handler(req, res) {
  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { sheetUrl, companyId } = req.body

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
    
    // Koska tiedostot ovat julkisia, voimme hakea tiedot suoraan Google Sheets API:sta
    // tai käyttää CSV-export URL:ia
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`

    // Kokeillaan ensin suoraa CSV-hakua
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
      
      // Parsitaan CSV-header ja lasketaan rivit
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const dataRows = lines.slice(1).filter(line => line.trim())
      
      // Etsitään puhelinnumerosarakkeet
      const phoneColumns = headers.filter(header => 
        header.toLowerCase().includes('phone') || 
        header.toLowerCase().includes('puhelin') || 
        header.toLowerCase().includes('numero') ||
        header.toLowerCase().includes('tel')
      )
      
      // Jos ei löydy puhelinnumerosarakkeita, käytetään kaikkia sarakkeita
      const relevantColumns = phoneColumns.length > 0 ? phoneColumns : headers
      
      // Lasketaan puhelinnumerot (rivit joilla on dataa)
      const phoneCount = dataRows.length
      
      return res.status(200).json({
        success: true,
        sheetId,
        phoneCount,
        totalRows: dataRows.length,
        columns: headers,
        phoneColumns: relevantColumns,
        message: `Google Sheets -tiedosto validioitu onnistuneesti. Löydetty ${phoneCount} puhelinnumeroa.`,
        timestamp: new Date().toISOString()
      })
      
    } catch (csvError) {
      console.log('CSV-haku epäonnistui, käytetään N8N:ää:', csvError.message)
      
      // Fallback N8N:ään
      const webhookUrl = process.env.N8N_VALIDATE_SHEET
      const secretKey = process.env.N8N_SECRET_KEY
      
      if (!webhookUrl) {
        console.error('N8N_VALIDATE_SHEET ympäristömuuttuja puuttuu')
        return res.status(500).json({ error: 'Palvelun konfiguraatio puuttuu' })
      }

      if (!secretKey) {
        console.error('N8N_SECRET_KEY ympäristömuuttuja puuttuu')
        return res.status(500).json({ error: 'API-avain puuttuu' })
      }
    }

    // Käytä companyId:tä joka tuli frontendistä
    // Jos companyId ei ole annettu, se voi olla null

    // Lähetä data N8N:ään
    const payload = {
      sheetUrl: sheetUrl.trim(),
      sheetId,
      csvUrl,
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
        error: 'Google Sheets -tiedoston validointi epäonnistui',
        details: `HTTP ${response.status}: ${errorText}`
      })
    }

    const result = await response.json()

    // Palauta validointitulokset
    res.status(200).json({
      success: true,
      sheetId,
      phoneCount: result.phoneCount || 0,
      totalRows: result.totalRows || 0,
      columns: result.columns || [],
      message: result.message || 'Google Sheets -tiedosto validioitu onnistuneesti',
      timestamp: payload.timestamp
    })

  } catch (error) {
    console.error('Validate sheet API virhe:', error)
    res.status(500).json({ 
      error: 'Palvelinvirhe Google Sheets -tiedoston validoinnissa',
      details: error.message 
    })
  }
} 