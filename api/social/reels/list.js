import { sendToN8N } from '../../_lib/n8n-client.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { companyId } = req.query

  if (!companyId) {
    return res.status(400).json({ error: 'Company ID puuttuu' })
  }

  try {
    // Haetaan data N8N webhookista
    const n8nUrl = process.env.N8N_GET_REELS
    if (!n8nUrl) {
      return res.status(500).json({ error: 'N8N webhook URL ei ole määritelty' })
    }

    let data
    try {
      // Käytä sendToN8N-funktiota HMAC-allekirjoituksella
      data = await sendToN8N(n8nUrl, { companyId })
      
      // Jos N8N palauttaa tyhjän tai virheen, palauta tyhjä array
      if (!data || !Array.isArray(data)) {
        data = []
      }
    } catch (error) {
      // Jos N8N workflow ei ole aktiivinen (404) tai muu virhe, palauta tyhjä array
      if (error.message && (error.message.includes('404') || error.message.includes('failed'))) {
        return res.status(200).json([])
      }
      // Jos on jokin muu virhe (esim. N8N_SECRET_KEY puuttuu), heitä virhe eteenpäin
      throw error
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
          'Record ID': item['Record ID'], // Lisätään Record ID myös tähän
          'Type (from Variables) (from Companies)': item['Type (from Variables) (from Companies)'] || []
        }
      })
      .filter(item => {
        // Filtteröidään pois itemit joilla ei ole otsikkoa eikä kuvausta
        const hasContent = item.title || item.caption || item.voiceover
        return hasContent
      })

    res.status(200).json(reelsData)
  } catch (e) {
    console.error('Virhe N8N reels haussa:', e)
    res.status(500).json({ error: 'Virhe reels haussa', details: e.message })
  }
} 