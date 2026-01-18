// api/monitoring/delete-feed.js - Poista feed Minifluxista
import { withOrganization } from '../_middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../_lib/cors.js'
import axios from 'axios'

async function handler(req, res) {
  setCorsHeaders(res, ['DELETE', 'OPTIONS'], undefined, req)
  
  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const orgId = req.organization.id
    const { feed_id, username } = req.body
    const minifluxUrl = process.env.MINIFLUX_API_URL

    if (!feed_id) {
      return res.status(400).json({ 
        error: 'Missing feed_id',
        details: 'feed_id is required'
      })
    }

    if (!minifluxUrl) {
      console.error('Miniflux URL configuration missing')
      return res.status(500).json({ error: 'Miniflux URL configuration missing' })
    }

    // Hae käyttäjän Miniflux-tunnukset monitoring_entries taulusta
    const { data: monitoringEntry, error: dbError } = await req.supabase
      .from('monitoring_entries')
      .select('username, password, apiKey')
      .eq('user_id', orgId)
      .eq('username', username || '') // Jos username annettu, rajaa sillä
      .maybeSingle()

    if (dbError) {
      console.error('Error fetching monitoring entry:', dbError)
      return res.status(500).json({ 
        error: 'Failed to fetch monitoring entry',
        details: dbError.message 
      })
    }

    if (!monitoringEntry) {
      return res.status(404).json({ 
        error: 'Monitoring entry not found',
        details: 'No monitoring credentials found for this user'
      })
    }

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
      return res.status(400).json({ 
        error: 'No credentials available',
        details: 'No API key or username/password found for this user'
      })
    }

    // Poista feed Minifluxista DELETE /v1/feeds/{feed_id}
    const response = await axios.delete(`${minifluxUrl}/v1/feeds/${feed_id}`, {
      headers: headers
    })

    return res.status(200).json({
      success: true,
      message: 'Feed deleted successfully',
      feed_id: feed_id
    })

  } catch (error) {
    console.error('Error deleting feed from Miniflux:', error)
    
    // Jos feediä ei löydy (404), palautetaan silti success
    if (error.response?.status === 404) {
      return res.status(200).json({
        success: true,
        message: 'Feed not found (may have been already deleted)',
        feed_id: req.body.feed_id
      })
    }

    return res.status(500).json({ 
      error: 'Failed to delete feed',
      details: error.response?.data?.error_message || error.message 
    })
  }
}

export default withOrganization(handler)
