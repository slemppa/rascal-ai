// api/monitoring/feed.js - Hae uutiset Minifluxista
import { withOrganization } from '../_middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../_lib/cors.js'
import axios from 'axios'

async function handler(req, res) {
  setCorsHeaders(res, ['GET', 'OPTIONS'], undefined, req)
  
  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const minifluxUrl = process.env.MINIFLUX_API_URL
    const minifluxKey = process.env.MINIFLUX_API_KEY

    if (!minifluxUrl || !minifluxKey) {
      console.error('Miniflux configuration missing')
      return res.status(500).json({ error: 'Miniflux configuration missing' })
    }

    // Hae uutiset Minifluxista (lukemattomat, laskeva järjestys, max 50)
    const response = await axios.get(`${minifluxUrl}/v1/entries`, {
      params: {
        status: 'unread',
        direction: 'desc',
        limit: 50
      },
      headers: {
        'X-Auth-Token': minifluxKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.data || !response.data.entries) {
      return res.status(200).json([])
    }

    // Siistitään data frontendille sopivaan muotoon
    const entries = response.data.entries.map(entry => {
      // Poista HTML-tagit contentista ja ota ensimmäiset 200 merkkiä
      const contentText = entry.content 
        ? entry.content.replace(/<[^>]*>/g, '').trim().substring(0, 200)
        : ''
      
      // Hae kuva enclosures-taulukosta jos saatavilla
      const imageUrl = entry.enclosures && entry.enclosures.length > 0
        ? entry.enclosures[0].url
        : null

      return {
        id: entry.id,
        title: entry.title || 'Ei otsikkoa',
        url: entry.url || '',
        contentSnippet: contentText,
        feedTitle: entry.feed?.title || 'Tuntematon lähde',
        imageUrl: imageUrl,
        publishedAt: entry.published_at || entry.created_at || null
      }
    })

    return res.status(200).json(entries)

  } catch (error) {
    console.error('Error fetching Miniflux feed:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch feed',
      details: error.message 
    })
  }
}

export default withOrganization(handler)
