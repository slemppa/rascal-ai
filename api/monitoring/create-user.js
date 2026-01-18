// api/monitoring/create-user.js - Luo uusi mediaseuranta-käyttäjä
import { withOrganization } from '../_middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../_lib/cors.js'
import { sendToN8N } from '../_lib/n8n-client.js'

async function handler(req, res) {
  setCorsHeaders(res, ['POST', 'OPTIONS'], undefined, req)
  
  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { entry_id, username, password } = req.body

    if (!entry_id || !username || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'entry_id, username, and password are required'
      })
    }

    const orgId = req.organization.id
    const orgData = req.organization.data

    // Tarkista onko tämä entry_id jo olemassa tälle käyttäjälle
    const { data: existingEntry, error: checkError } = await req.supabase
      .from('monitoring_entries')
      .select('id')
      .eq('entry_id', entry_id)
      .eq('user_id', orgId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing entry:', checkError)
      return res.status(500).json({ 
        error: 'Failed to check existing entry',
        details: checkError.message 
      })
    }

    if (existingEntry) {
      return res.status(409).json({ 
        error: 'Entry already exists for this user',
        details: 'This monitoring entry is already registered'
      })
    }

    // Tallenna monitoring_entries tauluun
    const { data: newEntry, error: insertError } = await req.supabase
      .from('monitoring_entries')
      .insert({
        entry_id: entry_id,
        username: username,
        password: password,
        user_id: orgId,
        status: 'unread'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting monitoring entry:', insertError)
      return res.status(500).json({ 
        error: 'Failed to create monitoring entry',
        details: insertError.message 
      })
    }

    // Lähetä N8N:ään public.users.id env-muuttujalla N8N_MEDIA_MONITORING_USER
    const n8nWebhookUrl = process.env.N8N_MEDIA_MONITORING_USER

    if (n8nWebhookUrl) {
      try {
        await sendToN8N(n8nWebhookUrl, {
          action: 'create_monitoring_user',
          user_id: orgId, // public.users.id
          entry_id: entry_id,
          username: username,
          company_id: orgData?.company_id || null,
          company_name: orgData?.company_name || null,
          timestamp: new Date().toISOString()
        })
        console.log('Media monitoring user creation sent to N8N')
      } catch (webhookError) {
        console.error('Error sending N8N webhook:', webhookError)
        // Jatketaan silti, entry on jo luotu
      }
    } else {
      console.log('N8N_MEDIA_MONITORING_USER not configured, skipping webhook')
    }

    return res.status(201).json({
      success: true,
      entry: newEntry
    })

  } catch (error) {
    console.error('Error creating monitoring user:', error)
    return res.status(500).json({ 
      error: 'Failed to create monitoring user',
      details: error.message 
    })
  }
}

export default withOrganization(handler)
