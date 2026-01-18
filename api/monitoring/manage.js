// api/monitoring/manage.js - Yhdistetty endpoint mediaseurannan hallintaan
// Actions: create (luo käyttäjä), add (lisää lähde), remove (poista lähde)
import { withOrganization } from '../_middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../_lib/cors.js'
import { sendToN8N } from '../_lib/n8n-client.js'
import axios from 'axios'

async function handler(req, res) {
  setCorsHeaders(res, ['POST', 'DELETE', 'OPTIONS'], undefined, req)
  
  if (handlePreflight(req, res)) {
    return
  }

  // Tuki sekä POST että DELETE metodille (remove voi olla DELETE)
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { action, feed_url, feed_id } = req.body

    if (!action || !['create', 'add', 'remove'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid or missing action',
        details: 'action must be one of: create, add, remove'
      })
    }

    const orgId = req.organization.id
    const orgData = req.organization.data

    // ACTION: create - Lähetä alustus N8N:ään (N8N hoitaa Miniflux-käyttäjän luonnin)
    if (action === 'create') {
      try {
        // Lähetä N8N:ään public.users.id env-muuttujalla N8N_MEDIA_MONITORING_USER
        const n8nWebhookUrl = process.env.N8N_MEDIA_MONITORING_USER

        if (!n8nWebhookUrl) {
          return res.status(500).json({ 
            error: 'N8N webhook URL not configured',
            details: 'N8N_MEDIA_MONITORING_USER environment variable is missing'
          })
        }

        // Lähetä perustiedot N8N:ään HMAC-allekirjoituksella - N8N hoitaa kaiken taian
        await sendToN8N(n8nWebhookUrl, {
          action: 'create_monitoring_user',
          user_id: orgId, // public.users.id (organisaation ID)
          auth_user_id: req.authUser?.id || null, // auth.users.id
          company_id: orgData?.company_id || null,
          company_name: orgData?.company_name || null,
          timestamp: new Date().toISOString()
        })
        
        console.log('Media monitoring initialization sent to N8N')

        return res.status(200).json({
          success: true,
          action: 'create',
          message: 'Media monitoring initialization sent to N8N'
        })
      } catch (webhookError) {
        console.error('Error sending N8N webhook:', webhookError)
        return res.status(500).json({ 
          error: 'Failed to send initialization to N8N',
          details: webhookError.message 
        })
      }
    }

    // ACTION: add - Lähetä lähdelisäys N8N:ään (N8N hoitaa feedin lisäämisen Minifluxiin)
    if (action === 'add') {
      try {
        // Lähetä N8N:ään public.users.id env-muuttujalla N8N_MEDIA_MONITORING_USER
        const n8nWebhookUrl = process.env.N8N_MEDIA_MONITORING_USER

        if (!n8nWebhookUrl) {
          return res.status(500).json({ 
            error: 'N8N webhook URL not configured',
            details: 'N8N_MEDIA_MONITORING_USER environment variable is missing'
          })
        }

        // Lähetä feed URL mukana N8N:ään HMAC-allekirjoituksella - N8N hoitaa lähteen lisäämisen
        await sendToN8N(n8nWebhookUrl, {
          action: 'add_monitoring_feed',
          user_id: orgId, // public.users.id (organisaation ID)
          auth_user_id: req.authUser?.id || null, // auth.users.id
          company_id: orgData?.company_id || null,
          company_name: orgData?.company_name || null,
          feed_url: feed_url || null, // Feed URL jota lisätään
          timestamp: new Date().toISOString()
        })
        
        console.log('Media monitoring feed addition sent to N8N')

        return res.status(200).json({
          success: true,
          action: 'add',
          message: 'Feed addition request sent to N8N'
        })
      } catch (webhookError) {
        console.error('Error sending N8N webhook:', webhookError)
        return res.status(500).json({ 
          error: 'Failed to send feed addition request to N8N',
          details: webhookError.message 
        })
      }
    }

    // ACTION: remove - Poista feed seurannasta
    if (action === 'remove') {
      if (!feed_id && !feed_url) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: 'feed_id or feed_url is required for remove action'
        })
      }

      try {
        let feedIdToRemove = feed_id

        // Jos annettu vain feed_url, hae feed_id Minifluxista
        if (!feedIdToRemove && feed_url) {
          // Hae kaikki käyttäjän feeds ja etsi oikea feed_id
          // Tämä vaatii käyttäjän tokenin, joten yksinkertaistetaan: vaaditaan feed_id
          return res.status(400).json({ 
            error: 'feed_id required',
            details: 'Please provide feed_id to remove feed'
          })
        }

        // Poista feed Minifluxista
        await axios.delete(
          `${minifluxUrl}/v1/feeds/${feedIdToRemove}`,
          {
            headers: {
              'X-Auth-Token': minifluxKey,
              'Content-Type': 'application/json'
            }
          }
        )

        // Poista feed monitoring_entries taulusta
        const { data: deletedEntry, error: deleteError } = await req.supabase
          .from('monitoring_entries')
          .delete()
          .eq('entry_id', feedIdToRemove)
          .eq('user_id', orgId)
          .select()
          .maybeSingle()

        if (deleteError) {
          console.error('Error deleting feed entry:', deleteError)
          // Feed on jo poistettu Minifluxista, mutta tietokanta epäonnistui
          return res.status(500).json({ 
            error: 'Failed to delete feed entry from database',
            details: deleteError.message,
            feed_id: feedIdToRemove
          })
        }

        if (!deletedEntry) {
          // Feed poistettiin Minifluxista, mutta sitä ei löytynyt tietokannasta
          console.warn('Feed removed from Miniflux but not found in database:', feedIdToRemove)
        }

        return res.status(200).json({
          success: true,
          action: 'remove',
          feed_id: feedIdToRemove,
          message: 'Feed removed successfully'
        })
      } catch (minifluxError) {
        console.error('Error removing feed from Miniflux:', minifluxError)
        
        // Jos feediä ei löydy Minifluxista (404), tarkista onko se tietokannassa
        if (minifluxError.response?.status === 404) {
          // Poista silti tietokannasta jos se siellä on
          const { data: deletedEntry } = await req.supabase
            .from('monitoring_entries')
            .delete()
            .eq('entry_id', feed_id)
            .eq('user_id', orgId)
            .select()
            .maybeSingle()

          return res.status(200).json({
            success: true,
            action: 'remove',
            feed_id: feed_id,
            message: 'Feed not found in Miniflux, removed from database',
            removed_from_db: !!deletedEntry
          })
        }

        return res.status(500).json({ 
          error: 'Failed to remove feed from Miniflux',
          details: minifluxError.response?.data?.error_message || minifluxError.message 
        })
      }
    }

    // Ei pitäisi päästä tänne
    return res.status(400).json({ error: 'Invalid action' })

  } catch (error) {
    console.error('Error in monitoring manage:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
}

export default withOrganization(handler)
