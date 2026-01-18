// api/monitoring/feed.js - Hae uutiset Minifluxista monitoring_entries taulusta
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
    const orgId = req.organization.id
    const minifluxUrl = process.env.MINIFLUX_API_URL

    if (!minifluxUrl) {
      console.error('Miniflux URL configuration missing')
      return res.status(500).json({ error: 'Miniflux URL configuration missing' })
    }

    // Hae käyttäjän mediaseuranta-merkinnät monitoring_entries taulusta
    // Haetaan username, password ja apiKey
    const { data: monitoringEntries, error: dbError } = await req.supabase
      .from('monitoring_entries')
      .select('username, password, apiKey')
      .eq('user_id', orgId)
      .not('username', 'is', null)

    if (dbError) {
      console.error('Error fetching monitoring entries:', dbError)
      return res.status(500).json({ 
        error: 'Failed to fetch monitoring entries',
        details: dbError.message 
      })
    }

    if (!monitoringEntries || monitoringEntries.length === 0) {
      return res.status(200).json([])
    }

    // Hae jokaiselta Miniflux-käyttäjältä uutisvirta
    const entriesPromises = monitoringEntries.map(async (monitoringEntry) => {
      try {
        // Rakenna headers-objekti: käytetään apiKey:ta jos saatavilla, muuten Basic Auth
        const headers = {
          'Content-Type': 'application/json'
        }
        
        if (monitoringEntry.apiKey) {
          // Käytetään API tokenia (suositeltu tapa)
          headers['X-Auth-Token'] = monitoringEntry.apiKey
        } else if (monitoringEntry.username && monitoringEntry.password) {
          // Fallback Basic Authiin username:password:lla
          const authString = Buffer.from(`${monitoringEntry.username}:${monitoringEntry.password}`).toString('base64')
          headers['Authorization'] = `Basic ${authString}`
        } else {
          console.warn(`No credentials for monitoring entry ${monitoringEntry.username}, skipping`)
          return []
        }

        // Hae LUKEMATTOMAT uutiset Minifluxista käyttäen /v1/entries endpointtia
        const response = await axios.get(`${minifluxUrl}/v1/entries`, {
          params: {
            status: 'unread',
            direction: 'desc',
            limit: 50
          },
          headers: headers
        })

        if (!response.data || !response.data.entries) {
          return []
        }

        // Muunna Miniflux entries frontendille sopivaan muotoon
        return response.data.entries.map(entry => {
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
            entryId: entry.id, // Miniflux entry ID
            title: entry.title || 'Ei otsikkoa',
            url: entry.url || '',
            contentSnippet: contentText,
            feedTitle: entry.feed?.title || 'Tuntematon lähde',
            imageUrl: imageUrl,
            publishedAt: entry.published_at || entry.created_at || null,
            status: entry.status || 'unread', // Status Minifluxista (unread, read, removed, starred)
            username: monitoringEntry.username
          }
        })
      } catch (entryError) {
        console.error(`Error fetching feed for user ${monitoringEntry.username} from Miniflux:`, entryError.message)
        // Jos haku epäonnistui, palauta tyhjä taulukko
        return []
      }
    })

    // Odota kaikki pyynnöt valmiiksi
    const entriesArrays = await Promise.all(entriesPromises)
    
    // Yhdistä kaikki käyttäjien entries yhdeksi taulukoksi
    const allEntries = entriesArrays.flat()

    // Järjestä laskevasti päivämäärän mukaan
    allEntries.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0)
      const dateB = new Date(b.publishedAt || 0)
      return dateB - dateA
    })

    return res.status(200).json(allEntries)

  } catch (error) {
    console.error('Error fetching Miniflux feed:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch feed',
      details: error.message 
    })
  }
}

export default withOrganization(handler)
