import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { companyId, avatarId } = req.body

  if (!companyId || !avatarId) {
    return res.status(400).json({ error: 'Company ID ja Avatar ID vaaditaan' })
  }

  // Käytä ympäristömuuttujaa jos saatavilla, muuten oletusarvoa
  const N8N_AVATAR_DELETE_ENDPOINT = process.env.N8N_AVATAR_DELETE || 'https://samikiias.app.n8n.cloud/webhook/avatar-delete'
  const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

  try {
    // Välitä kutsu N8N webhookiin
    const response = await axios.post(N8N_AVATAR_DELETE_ENDPOINT, {
      companyId,
      avatarId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_SECRET_KEY
      }
    })
    
    return res.status(200).json({ success: true, data: response.data })
  } catch (error) {
    console.error('Avatar delete proxy error:', error.response?.data || error.message)
    return res.status(500).json({ 
      success: false,
      error: 'Avatar delete proxy error', 
      details: error.response?.data || error.message 
    })
  }
} 