// api/monitoring/feeds.js - Hae feedit Minifluxista
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

    // Hae jokaiselta Miniflux-käyttäjältä feedit
    const feedsPromises = monitoringEntries.map(async (monitoringEntry) => {
      try {
        // Rakenna headers-objekti: käytetään apiKey:ta jos saatavilla, muuten Basic Auth
        const headers = {
          'Content-Type': 'application/json'
        }
        
        if (monitoringEntry.apiKey) {
          headers['X-Auth-Token'] = monitoringEntry.apiKey
        } else if (monitoringEntry.username && monitoringEntry.password) {
          const authString = Buffer.from(`${monitoringEntry.username}:${monitoringEntry.password}`).toString('base64')
          headers['Authorization'] = `Basic ${authString}`
        } else {
          console.warn(`No credentials for monitoring entry ${monitoringEntry.username}, skipping`)
          return []
        }

        // Hae feedit Minifluxista käyttäen /v1/feeds endpointtia
        const response = await axios.get(`${minifluxUrl}/v1/feeds`, {
          headers: headers
        })

        if (!response.data || !Array.isArray(response.data)) {
          return []
        }

        // Palauta feedit yhdistettynä käyttäjänimellä
        return response.data.map(feed => ({
          ...feed,
          username: monitoringEntry.username // Tallenna käyttäjänimi jotta tiedetään mistä feed poistetaan
        }))
      } catch (entryError) {
        console.error(`Error fetching feeds for user ${monitoringEntry.username} from Miniflux:`, entryError.message)
        return []
      }
    })

    // Odota kaikki pyynnöt valmiiksi
    const feedsArrays = await Promise.all(feedsPromises)
    
    // Yhdistä kaikki käyttäjien feedit yhdeksi taulukoksi
    const allFeeds = feedsArrays.flat()

    // Järjestä feedit nimen mukaan
    allFeeds.sort((a, b) => {
      const nameA = (a.title || a.feed_url || '').toLowerCase()
      const nameB = (b.title || b.feed_url || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return res.status(200).json(allFeeds)

  } catch (error) {
    console.error('Error fetching Miniflux feeds:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch feeds',
      details: error.message 
    })
  }
}

export default withOrganization(handler)
