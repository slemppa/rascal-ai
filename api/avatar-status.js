import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Käytä ympäristömuuttujaa jos saatavilla, muuten oletusarvoa
  const N8N_AVATAR_STATUS_ENDPOINT = process.env.N8N_GET_REELS || 'https://samikiias.app.n8n.cloud/webhook/get-reels'
  const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY // header tarvitsee tämän, mutta jätetään tyhjäksi jos ei asetettu

  try {
    // Välitä kutsu N8N webhookiin
    const response = await axios.post(N8N_AVATAR_STATUS_ENDPOINT, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_SECRET_KEY
      }
    })
    
    return res.status(200).json(response.data)
  } catch (error) {
    console.error('Avatar status proxy error:', error.response?.data || error.message)
    return res.status(500).json({ 
      error: 'Avatar status proxy error', 
      details: error.response?.data || error.message 
    })
  }
} 