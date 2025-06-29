const N8N_VECTOR_STORE_FILES_URL = process.env.N8N_VECTOR_STORE_FILES_URL || 'https://samikiias.app.n8n.cloud/webhook/vector-store-files8989'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Hae tiedostot companyId-parametrilla
    const { companyId } = req.query
    if (!companyId) return res.status(400).json({ error: 'companyId puuttuu' })
    try {
      const response = await fetch(N8N_VECTOR_STORE_FILES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.N8N_SECRET_KEY
        },
        body: JSON.stringify({ companyId })
      })
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]?.data)) {
        res.status(200).json({ files: data[0].data })
      } else if (data && Array.isArray(data.data)) {
        res.status(200).json({ files: data.data })
      } else {
        res.status(200).json({ files: data })
      }
    } catch (e) {
      res.status(500).json({ error: 'Virhe tiedostojen haussa' })
    }
    return
  }
  if (req.method !== 'POST') return res.status(405).end()
  try {
    console.log('vector-store-files: Lähetetään kutsu N8N:lle:', req.body)
    
    const response = await fetch(N8N_VECTOR_STORE_FILES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_SECRET_KEY
      },
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    
    console.log('vector-store-files: N8N palautti datan:', JSON.stringify(data, null, 2))
    
    // Jos data on muodossa [ { data: [...] } ], palauta suoraan data-array
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]?.data)) {
      console.log('vector-store-files: Palautetaan data[0].data:', data[0].data.length, 'tiedostoa')
      res.status(200).json(data[0].data)
    }
    // Jos data on muodossa { data: [...] }, palauta suoraan data-array
    else if (data && Array.isArray(data.data)) {
      console.log('vector-store-files: Palautetaan data.data:', data.data.length, 'tiedostoa')
      res.status(200).json(data.data)
    } else {
      console.log('vector-store-files: Palautetaan data sellaisenaan')
      res.status(200).json(data)
    }
  } catch (e) {
    console.error('vector-store-files: Virhe:', e)
    res.status(500).json({ error: 'Virhe tiedostojen haussa' })
  }
} 