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
      
      // Etsitään relevantit sarakkeet
      const relevantColumns = headers.filter(header => 
        header.toLowerCase().includes('name') || 
        header.toLowerCase().includes('nimi') || 
        header.toLowerCase().includes('phone') || 
        header.toLowerCase().includes('puhelin') ||
        header.toLowerCase().includes('email') ||
        header.toLowerCase().includes('sähköposti')
      )
      
      const phoneCount = dataRows.length
      const emailCount = emailColumns.length > 0 ? dataRows.length : 0

      // Parsitaan kaikki rivit objekteiksi
      const rows = dataRows.map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
        const obj = {}
        headers.forEach((header, idx) => {
          obj[header] = values[idx] || ''
        })
        return obj
      })

      return res.status(200).json({
        success: true,
        sheetId,
        phoneCount,
        emailCount,
        totalRows: dataRows.length,
        columns: headers,
        phoneColumns: relevantColumns,
        emailColumns: emailColumns,
        rows, // kaikki rivit objekteina
        message: `Google Sheets -tiedosto validioitu onnistuneesti. Löydetty ${phoneCount} puhelinnumeroa ja ${emailCount} sähköpostia.`,
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
    console.error('Validate sheet API virhe:', error)
    console.error('Virheen stack trace:', error.stack)
    res.status(500).json({ 
      error: 'Palvelinvirhe validate-sheet käynnistyksessä',
      details: error.message 
    })
  }
} 