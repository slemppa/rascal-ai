const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_TABLE_ID = 'tblSPKx9gGepqdF40'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Tarkista että ympäristömuuttujat on asetettu
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    console.error('Missing Airtable environment variables')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const { companyId } = req.query
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId parameter is required' })
    }

    console.log('Fetching call types for company:', companyId)

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Airtable fetch error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return res.status(response.status).json({ 
        error: `Airtable fetch failed: ${response.status} ${response.statusText}`,
        details: errorText
      })
    }

    const data = await response.json()
    console.log('Call types fetched successfully:', data.records?.length || 0, 'records')

    // Suodata companyId:n mukaan client-puolella
    const filteredRecords = data.records?.filter(record => {
      const companyField = record.fields?.Company
      return companyField && Array.isArray(companyField) && companyField.includes(companyId)
    }) || []

    res.status(200).json({ 
      records: filteredRecords,
      message: 'Puhelutyypit haettu onnistuneesti'
    })
  } catch (error) {
    console.error('API error:', error)
    res.status(500).json({ error: error.message })
  }
} 