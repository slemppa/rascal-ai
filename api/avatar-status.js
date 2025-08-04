import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { companyId } = req.body

  if (!companyId) {
    return res.status(400).json({ error: 'Company ID puuttuu' })
  }

  // Käytä oikeaa avatar-status endpointia
  const N8N_AVATAR_STATUS_ENDPOINT = process.env.N8N_AVATAR_STATUS || 'https://samikiias.app.n8n.cloud/webhook/get-avatar-status'
  const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

  console.log('Avatar status: Haetaan kuvia companyId:llä:', companyId)
  console.log('Avatar status: Käytetään endpointia:', N8N_AVATAR_STATUS_ENDPOINT)
  console.log('Avatar status: N8N_SECRET_KEY saatavilla:', !!N8N_SECRET_KEY)
  console.log('Avatar status: Kaikki env muuttujat:', Object.keys(process.env).filter(key => key.includes('N8N')))

  try {
    // Välitä kutsu N8N webhookiin
    console.log('Avatar status: Lähetetään kutsu N8N:ään...')
    const response = await axios.post(N8N_AVATAR_STATUS_ENDPOINT, {
      companyId: companyId
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_SECRET_KEY
      }
    })
    
    console.log('Avatar status: N8N vastaus status:', response.status)
    console.log('Avatar status: N8N vastaus data:', response.data)
    return res.status(200).json(response.data)
  } catch (error) {
    console.error('Avatar status proxy error:', error.response?.status, error.response?.data || error.message)
    
    // Jos N8N ei vastaa, palauta dummy dataa testausta varten
    if (error.response?.status === 404) {
      console.log('Avatar status: N8N workflow ei ole aktiivinen, palautetaan dummy dataa')
      const dummyData = [
        {
          id: 'avatar-1',
          Media: [
            {
              id: 'media-1',
              url: '/placeholder.png',
              thumbnails: {
                full: { url: '/placeholder.png' },
                large: { url: '/placeholder.png' }
              }
            }
          ],
          "Variable ID": 'var-1'
        }
      ]
      return res.status(200).json(dummyData)
    }
    
    return res.status(500).json({ 
      error: 'Avatar status proxy error', 
      details: error.response?.data || error.message 
    })
  }
} 