import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Idea-generation endpoint kutsuttu')
    console.log('Request body:', req.body)
    
    const { idea, type, companyId } = req.body

    // Validoi pakolliset kentät
    console.log('Validoitut kentät:', { idea, type, companyId })
    
    if (!idea || !type || !companyId) {
      console.log('Puuttuvia kenttiä:', { 
        hasIdea: !!idea, 
        hasType: !!type, 
        hasCompanyId: !!companyId
      })
      return res.status(400).json({ 
        error: 'Puuttuvia kenttiä: idea, type tai companyId' 
      })
    }

    // Validoi idea-tyyppi
    const validTypes = ['blog', 'image', 'carousel', 'avatar']
    if (!validTypes.includes(type)) {
      console.log('Virheellinen idea-tyyppi:', type)
      return res.status(400).json({ 
        error: 'Virheellinen idea-tyyppi. Sallitut tyypit: blog, image, carousel, avatar' 
      })
    }

    // Hae N8N webhook URL ja secret key ympäristömuuttujista
    const n8nWebhookUrl = process.env.N8N_IDEA_GENERATION
    const n8nSecretKey = process.env.N8N_SECRET_KEY
    
    console.log('N8N webhook URL löytyy:', !!n8nWebhookUrl)
    console.log('N8N secret key löytyy:', !!n8nSecretKey)
    
    if (!n8nWebhookUrl) {
      console.error('N8N_IDEA_GENERATION webhook URL puuttuu ympäristömuuttujista')
      return res.status(500).json({ error: 'Palvelin konfiguraatiovirhe - N8N webhook URL puuttuu' })
    }
    
    if (!n8nSecretKey) {
      console.error('N8N_SECRET_KEY puuttuu ympäristömuuttujista')
      return res.status(500).json({ error: 'Palvelin konfiguraatiovirhe - N8N secret key puuttuu' })
    }

    // Valmistele data N8N:lle
    const n8nPayload = {
      idea: idea.trim(),
      type: type,
      companyId: companyId,
      timestamp: new Date().toISOString(),
      source: 'rascal-ai-web'
    }

    console.log('Lähetetään N8N:lle:', n8nPayload)
    console.log('N8N URL:', n8nWebhookUrl)

    // Lähetä data N8N webhookiin
    const n8nResponse = await axios.post(n8nWebhookUrl, n8nPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': n8nSecretKey
      },
      timeout: 30000 // 30 sekuntia timeout
    })

    console.log(`Idea lähetetty N8N:lle onnistuneesti. Tyyppi: ${type}, CompanyId: ${companyId}`)
    console.log('N8N vastaus status:', n8nResponse.status)

    return res.status(200).json({ 
      success: true, 
      message: 'Idea lähetetty onnistuneesti',
      data: {
        type: type,
        companyId: companyId,
        timestamp: n8nPayload.timestamp
      }
    })

  } catch (error) {
    console.error('Virhe idea-generation endpointissa:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    
    if (error.response) {
      // N8N palautti virheen
      console.error('N8N vastaus status:', error.response.status)
      console.error('N8N vastaus data:', error.response.data)
      return res.status(error.response.status).json({ 
        error: 'Virhe idean käsittelyssä: ' + (error.response.data?.message || error.response.statusText)
      })
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      console.error('Timeout virhe')
      return res.status(408).json({ error: 'Pyyntö aikakatkaistiin. Yritä uudelleen.' })
    } else {
      // Muu virhe
      console.error('Yleinen virhe:', error.message)
      return res.status(500).json({ error: 'Sisäinen palvelinvirhe: ' + error.message })
    }
  }
} 