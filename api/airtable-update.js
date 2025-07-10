const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appeVatHuDQHlYuyX'
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST sallittu' })
  }

  const { recordId, type, data } = req.body

  if (!recordId || !type || !data) {
    return res.status(400).json({ error: 'recordId, type ja data vaaditaan' })
  }

  if (!AIRTABLE_API_KEY) {
    console.error('AIRTABLE_API_KEY puuttuu')
    return res.status(500).json({ error: 'Airtable API-avain ei ole konfiguroitu' })
  }

  console.log('Airtable update debug:')
  console.log('AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID)
  console.log('AIRTABLE_API_KEY available:', !!AIRTABLE_API_KEY)
  console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('AIRTABLE')))

  try {
    let tableName, fieldName, updateData

    if (type === 'icp') {
      tableName = 'Companies'
      fieldName = 'ICP Summary'
      updateData = { [fieldName]: data }
    } else if (type === 'strategy') {
      tableName = 'Content Strategy'
      fieldName = 'Strategy'
      updateData = { [fieldName]: data }
    } else {
      return res.status(400).json({ error: 'Virheellinen type. Käytä "icp" tai "strategy"' })
    }

    console.log(`Päivitetään ${type}:`, { recordId, tableName, fieldName, baseId: AIRTABLE_BASE_ID })

    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}/${recordId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: updateData
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Airtable API error:', response.status, errorText)
      return res.status(response.status).json({ 
        error: 'Airtable päivitys epäonnistui', 
        details: errorText 
      })
    }

    const result = await response.json()
    console.log('Airtable päivitys onnistui:', result)
    
    res.status(200).json({ 
      success: true, 
      message: `${type} päivitetty onnistuneesti`,
      data: result 
    })

  } catch (error) {
    console.error('Airtable update error:', error)
    res.status(500).json({ 
      error: 'Virhe Airtable-päivityksessä', 
      details: error.message 
    })
  }
} 