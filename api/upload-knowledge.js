const N8N_ASSISTANT_KNOWLEDGE_URL = process.env.N8N_ASSISTANT_KNOWLEDGE_URL
const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  try {
    if (!N8N_ASSISTANT_KNOWLEDGE_URL) {
      console.error('N8N_ASSISTANT_KNOWLEDGE_URL puuttuu')
      return res.status(500).json({ error: 'Webhook URL ei ole konfiguroitu' })
    }

    if (!N8N_SECRET_KEY) {
      console.error('N8N_SECRET_KEY puuttuu')
      return res.status(500).json({ error: 'API-avain ei ole konfiguroitu' })
    }

    console.log('Kutsu N8N webhookia:', N8N_ASSISTANT_KNOWLEDGE_URL)
    console.log('Headers:', req.headers)
    console.log('Body keys:', Object.keys(req.body || {}))

    // Jos kyseessä on FormData, forwardaa se suoraan N8N:lle
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      const response = await fetch(N8N_ASSISTANT_KNOWLEDGE_URL, {
        method: 'POST',
        headers: {
          ...req.headers,
          'x-api-key': N8N_SECRET_KEY,
          host: undefined // Vercel/Node lisää tämän automaattisesti
        },
        body: req,
        duplex: 'half',
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
    } else {
      // JSON-payload (esim. action feed)
      const response = await fetch(N8N_ASSISTANT_KNOWLEDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': N8N_SECRET_KEY
        },
        body: JSON.stringify(req.body)
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
    }
  } catch (e) {
    console.error('Virhe upload-knowledge endpointissa:', e)
    res.status(500).json({ error: 'Virhe tiedostojen käsittelyssä', details: e.message })
  }
} 