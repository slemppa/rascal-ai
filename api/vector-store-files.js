const N8N_VECTOR_STORE_FILES_URL = process.env.N8N_VECTOR_STORE_FILES_URL

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  try {
    const { companyId } = req.body
    if (!companyId) {
      return res.status(400).json({ error: 'companyId puuttuu' })
    }

    const response = await fetch(N8N_VECTOR_STORE_FILES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId })
    })
    
    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (e) {
    res.status(500).json({ error: 'Virhe tiedostojen haussa' })
  }
} 