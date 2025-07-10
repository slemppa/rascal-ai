const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appeVatHuDQHlYuyX'
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patVf4zHcio3aIeiy.5a7cbd1d2334d16e965010c852499c3e3d8e0a8e2262011aa1b8b5fac50691ce'
const AIRTABLE_TABLE_ID = 'tblSPKx9gGepqdF40'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fields } = req.body
    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ error: 'fields object is required' })
    }

    // Company pitää olla mukana (Airtable vaatii)
    if (!fields.Company || !Array.isArray(fields.Company) || fields.Company.length === 0) {
      return res.status(400).json({ error: 'Company field is required and must be an array' })
    }

    console.log('Creating call type with fields:', fields)

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [
          {
            fields: fields
          }
        ]
      })
    })

    if (!response.ok) {
      console.error('Airtable create error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return res.status(response.status).json({ 
        error: `Airtable create failed: ${response.status} ${response.statusText}`,
        details: errorText
      })
    }

    const data = await response.json()
    console.log('Call type created successfully:', data)

    res.status(200).json({ 
      success: true, 
      record: data.records?.[0],
      message: 'Puhelutyyppi lisätty onnistuneesti'
    })
  } catch (error) {
    console.error('API error:', error)
    res.status(500).json({ error: error.message })
  }
} 