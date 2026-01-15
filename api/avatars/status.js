import { sendToN8N } from '../_lib/n8n-client.js'

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

  try {
    // Välitä kutsu N8N webhookiin HMAC-allekirjoituksella
    const responseData = await sendToN8N(N8N_AVATAR_STATUS_ENDPOINT, {
      companyId: companyId
    })
    return res.status(200).json(responseData)
  } catch (error) {
    console.error('Avatar status proxy error:', error.message)
    
    // Jos N8N ei vastaa, palauta dummy dataa testausta varten
    if (error.message && error.message.includes('404')) {
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
      details: error.message 
    })
  }
} 