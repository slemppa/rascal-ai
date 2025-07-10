const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appeVatHuDQHlYuyX'
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patVf4zHcio3aIeiy.5a7cbd1d2334d16e965010c852499c3e3d8e0a8e2262011aa1b8b5fac50691ce'
const AIRTABLE_TABLE_ID = 'tblSPKx9gGepqdF40'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { companyId } = req.query
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' })
    }

    console.log('Fetching call types for companyId:', companyId)

    // Muodosta Airtable API URL ilman filterByFormula ensin
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Airtable response error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return res.status(response.status).json({ 
        error: `Airtable fetch failed: ${response.status} ${response.statusText}`,
        details: errorText
      })
    }

    const data = await response.json()
    console.log('Airtable response records count:', data.records?.length || 0)
    
    // Suodata client-side companyId:n perusteella
    const callTypes = (data.records || [])
      .filter(rec => {
        const companyField = rec.fields.Company || rec.fields['Company ID']
        return companyField && (
          Array.isArray(companyField) ? 
            companyField.includes(companyId) : 
            companyField === companyId
        )
      })
      .map(rec => ({
        id: rec.id,
        value: rec.fields.Name || rec.fields.Value || '',
        label: rec.fields.Name || rec.fields.Label || '',
        description: rec.fields.Description || '',
        identity: rec.fields.Identity || '',
        style: rec.fields.Style || '',
        guidelines: rec.fields.Guidelines || '',
        goals: rec.fields.Goals || '',
        intro: rec.fields.Intro || '',
        questions: rec.fields.Questions || '',
        outro: rec.fields.Outro || '',
        notes: rec.fields.Notes || '',
        version: rec.fields.Version || 'v1.0',
        status: rec.fields.Status || 'Active',
        company: rec.fields.Company || rec.fields['Company ID'] || ''
      }))

    console.log('Filtered call types count:', callTypes.length)
    res.status(200).json({ callTypes })
  } catch (error) {
    console.error('API error:', error)
    res.status(500).json({ error: error.message })
  }
} 