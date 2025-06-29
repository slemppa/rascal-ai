const N8N_VECTOR_STORE_FILES_URL = process.env.N8N_VECTOR_STORE_FILES_URL
const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  try {
    const { companyId } = req.body
    if (!companyId) {
      return res.status(400).json({ error: 'companyId puuttuu' })
    }

    if (!N8N_VECTOR_STORE_FILES_URL) {
      console.error('N8N_VECTOR_STORE_FILES_URL puuttuu')
      return res.status(500).json({ error: 'Webhook URL ei ole konfiguroitu' })
    }

    if (!N8N_SECRET_KEY) {
      console.error('N8N_SECRET_KEY puuttuu')
      return res.status(500).json({ error: 'API-avain ei ole konfiguroitu' })
    }

    console.log('Kutsu N8N webhookia:', N8N_VECTOR_STORE_FILES_URL)
    console.log('Payload:', { companyId })
    
    const response = await fetch(N8N_VECTOR_STORE_FILES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_SECRET_KEY
      },
      body: JSON.stringify({ companyId })
    })
    
    if (!response.ok) {
      console.error('N8N webhook vastasi virheellä:', response.status, response.statusText)
      return res.status(response.status).json({ 
        error: 'Webhook-virhe', 
        status: response.status,
        statusText: response.statusText
      })
    }
    
    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (e) {
    console.error('Virhe vector-store-files endpointissa:', e)
    res.status(500).json({ error: 'Virhe tiedostojen haussa', details: e.message })
  }
} 