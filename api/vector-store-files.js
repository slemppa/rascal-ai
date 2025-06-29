const N8N_VECTOR_STORE_FILES_URL = process.env.N8N_VECTOR_STORE_FILES_URL
const N8N_ASSISTANT_KNOWLEDGE_URL = process.env.N8N_ASSISTANT_KNOWLEDGE_URL

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Hae tiedostot companyId-parametrilla
    const { companyId } = req.query
    if (!companyId) return res.status(400).json({ error: 'companyId puuttuu' })
    try {
      const response = await fetch(N8N_VECTOR_STORE_FILES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      })
      const data = await response.json()
      return res.status(response.status).json(data)
    } catch (e) {
      return res.status(500).json({ error: 'Virhe tiedostojen haussa' })
    }
  }
  if (req.method !== 'POST') return res.status(405).end()
  try {
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
      // JSON-payload (esim. poisto)
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