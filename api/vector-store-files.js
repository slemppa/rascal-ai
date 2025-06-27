const N8N_VECTOR_STORE_FILES_URL = process.env.N8N_VECTOR_STORE_FILES_URL || 'https://samikiias.app.n8n.cloud/webhook/vector-store-files8989'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const response = await fetch(N8N_VECTOR_STORE_FILES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_SECRET_KEY
      },
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: 'Virhe tiedostojen haussa' })
  }
} 