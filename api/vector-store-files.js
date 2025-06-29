const N8N_VECTOR_STORE_FILES_URL = process.env.N8N_VECTOR_STORE_FILES_URL
const N8N_ASSISTANT_KNOWLEDGE_URL = process.env.N8N_ASSISTANT_KNOWLEDGE_URL

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    // Jos bodyssa on vain companyId, tee tiedostolistaus
    if (req.body && req.body.companyId && Object.keys(req.body).length === 1) {
      const response = await fetch(N8N_VECTOR_STORE_FILES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: req.body.companyId })
      })
      const data = await response.json()
      return res.status(response.status).json(data)
    }
    // Jos kyseessä on tiedostojen lisäys, käytetään FormDataa
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      // Forwardaa suoraan N8N:lle (esim. tiedostojen lisäys)
      const response = await fetch(N8N_ASSISTANT_KNOWLEDGE_URL, {
        method: 'POST',
        headers: {
          ...req.headers,
          host: undefined // Vercel/Node lisää tämän automaattisesti
        },
        body: req,
      })
      const data = await response.json()
      return res.status(response.status).json(data)
    } else {
      // JSON-payload (esim. poisto, action feed/delete)
      const response = await fetch(N8N_ASSISTANT_KNOWLEDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
      })
      const data = await response.json()
      return res.status(response.status).json(data)
    }
  } catch (e) {
    res.status(500).json({ error: 'Virhe tiedostojen käsittelyssä' })
  }
} 