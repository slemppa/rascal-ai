export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { companyId } = req.query

  if (!companyId) {
    return res.status(400).json({ error: 'Company ID puuttuu' })
  }

  try {
    // Debug: tarkistetaan ympäristömuuttujat
    console.log('N8N_GET_REELS:', process.env.N8N_GET_REELS)
    console.log('N8N_SECRET_KEY:', process.env.N8N_SECRET_KEY ? 'LÖYTYI' : 'PUUTTUU')
    console.log('Kaikki env muuttujat:', Object.keys(process.env).filter(key => key.includes('N8N')))

    // Haetaan data N8N webhookista
    const n8nUrl = process.env.N8N_GET_REELS
    if (!n8nUrl) {
      return res.status(500).json({ error: 'N8N webhook URL ei ole määritelty' })
    }

    console.log('DEBUG: Kutsutaan N8N webhookia:', n8nUrl)
    console.log('DEBUG: Company ID:', companyId)
    console.log('DEBUG: API Key saatavilla:', !!process.env.N8N_SECRET_KEY)

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_SECRET_KEY
      },
      body: JSON.stringify({
        companyId: companyId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('N8N error response:', errorText)
      if (response.status === 404) {
        console.log('N8N workflow ei ole aktiivinen, palautetaan tyhjä array')
        return res.status(200).json([])
      }
      throw new Error(`N8N webhook error: ${response.status} - ${errorText}`)
    }

    const responseText = await response.text()


    if (responseText.includes('Workflow was started')) {
      console.log('DEBUG: N8N workflow käynnistyi, palautetaan tyhjä array')
      return res.status(200).json([])
    }

    // Jos N8N palauttaa oikeaa dataa, käsitellään se
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response was not valid JSON:', responseText)
      data = []
    }
    if (!Array.isArray(data)) {
      console.log('Data ei ole array, muunnetaan:', data)
      data = []
    }
    const reelsData = data
      .map(item => {
        // Käytetään Idea-kenttää otsikkona, jos Caption ei ole saatavilla
        const title = item.Idea || (item.Caption ? item.Caption.substring(0, 100) + '...' : '')
        
        // Käytetään Caption-kenttää kuvausta varten
        const caption = item.Caption || item.Idea || ''
        
        // Käytetään Voiceover-kenttää voiceover-tekstinä
        const voiceover = item.Voiceover || ''
        
        // Status-mappaus
        const statusMap = {
          'Draft': 'Kesken',
          'In Progress': 'Kesken',
          'Under Review': 'Tarkistuksessa',
          'Scheduled': 'Aikataulutettu',
          'Published': 'Julkaistu'
        }
        const status = statusMap[item.Status] || 'Kesken'
        
        console.log('DEBUG: Processing Airtable item:', {
          'Record ID': item['Record ID'],
          'Idea': item.Idea,
          'Caption': item.Caption,
          'Status': item.Status,
          'title': title,
          'caption': caption
        })
        
        return {
          id: item.id || item['Record ID'] || `reels-${Date.now()}-${Math.random()}`,
          title: title,
          caption: caption,
          media_urls: [], // Media URL:t tulevat myöhemmin
          status: status,
          created_at: item.createdTime || item.Created || new Date().toISOString(),
          publish_date: null,
          hashtags: [],
          voiceover: voiceover,
          user_id: null,
          source: 'reels',
          'Record ID': item['Record ID'] // Lisätään Record ID myös tähän
        }
      })
      .filter(item => {
        // Filtteröidään pois itemit joilla ei ole otsikkoa eikä kuvausta
        const hasContent = item.title || item.caption || item.voiceover
        if (!hasContent) {
          console.log('DEBUG: Skipping empty reels item:', item.id)
        }
        return hasContent
      })

    console.log('DEBUG: Palautetaan reelsData:', reelsData)
    res.status(200).json(reelsData)
  } catch (e) {
    console.error('Virhe N8N reels haussa:', e)
    res.status(500).json({ error: 'Virhe reels haussa', details: e.message })
  }
} 