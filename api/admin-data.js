// api/admin-data.js - Admin endpoint kaikille admin-tarpeille
import { withOrganization } from './middleware/with-organization.js'
import { createClient } from '@supabase/supabase-js'

// Service role -clienti, jotta RLS ei rajoita admin-kyselyitä (esim. integraatiot)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabaseAdmin = null
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
} else {
  console.warn('[admin-data] ⚠️ Supabase service role env muuttujat puuttuvat – käytetään RLS-rajoitettua clientia')
}

async function handler(req, res) {
  try {
    // req.organization.role = käyttäjän rooli ('owner', 'admin', 'member')
    // req.supabase = authenticated Supabase client

    // Tarkista admin/moderator-oikeudet: admin, moderator tai owner rooli
    const isAdmin = req.organization.role === 'admin' || req.organization.role === 'owner' || req.organization.role === 'moderator'
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin or moderator access required' })
    }

    // Käytä service role -clientia jos saatavilla, muuten fallback RLS-clienttiin
    const db = supabaseAdmin || req.supabase

    // POST-pyyntö features-päivitykselle
    if (req.method === 'POST') {
      const { type, user_id, features } = req.body

      if (type === 'update-features') {
        if (!user_id || !Array.isArray(features)) {
          return res.status(400).json({ error: 'user_id and features array required' })
        }

        const { error } = await db
          .from('users')
          .update({ features })
          .eq('id', user_id)

        if (error) {
          console.error('[admin-data] Error updating features:', error)
          return res.status(500).json({ error: 'Failed to update features', details: error.message })
        }

        return res.status(200).json({ success: true, message: 'Features updated successfully' })
      }

      return res.status(400).json({ error: 'Invalid type for POST request' })
    }

    // GET-pyyntö datan hakemiseen
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Hae data type parametrista
    const { type } = req.query

    let result = {}

    switch (type) {
      case 'users':
        const { data: users, error: usersError } = await db
          .from('users')
          .select(`
            id,
            contact_email,
            contact_person,
            status,
            role,
            webhook_url,
            created_at,
            auth_user_id,
            company_name,
            thread_id,
            vapi_number_id,
            vapi_assistant_id,
            vector_store_id,
            voice_id,
            assistant_id,
            crm_connected,
            features,
            subscription_status,
            platforms,
            onboarding_completed,
            vapi_inbound_assistant_id,
            vapi_phone_number
          `)
          .order('created_at', { ascending: false })

        if (usersError) {
          console.error('Error fetching users:', usersError)
          return res.status(500).json({ error: 'Failed to fetch users' })
        }

        result = { users: users || [] }
        break

      case 'content':
        const { data: content, error: contentError } = await db
          .from('content')
          .select(`
            id,
            idea,
            type,
            status,
            created_at,
            user_id,
            users(contact_person, contact_email)
          `)
          .order('created_at', { ascending: false })

        if (contentError) {
          console.error('Error fetching content:', contentError)
          return res.status(500).json({ error: 'Failed to fetch content' })
        }

        result = { content: content || [] }
        break

      case 'segments':
        const { data: segments, error: segmentsError } = await db
          .from('segments')
          .select(`
            id,
            slide_no,
            text,
            media_urls,
            status,
            created_at,
            users(contact_person, contact_email)
          `)
          .order('created_at', { ascending: false })

        if (segmentsError) {
          console.error('Error fetching segments:', segmentsError)
          return res.status(500).json({ error: 'Failed to fetch segments' })
        }

        result = { segments: segments || [] }
        break

      case 'stats':
        // Hae kaikki data samanaikaisesti tilastojen laskemista varten
        const [usersData, contentData, callLogsData, messageLogsData, segmentsData] = await Promise.all([
          db.from('users').select('role, status, created_at'),
          db.from('content').select('status, type, created_at'),
          db.from('call_logs').select('call_status, answered, created_at'),
          db.from('message_logs').select('status, message_type, created_at'),
          db.from('segments').select('status, created_at')
        ])

        const stats = {
          totalUsers: usersData.data?.length || 0,
          adminUsers: usersData.data?.filter(u => u.role === 'admin').length || 0,
          activeUsers: usersData.data?.filter(u => u.status === 'Active').length || 0,
          totalContent: contentData.data?.length || 0,
          publishedContent: contentData.data?.filter(c => c.status === 'Published').length || 0,
          totalCalls: callLogsData.data?.length || 0,
          answeredCalls: callLogsData.data?.filter(c => c.answered).length || 0,
          totalMessages: messageLogsData.data?.length || 0,
          totalSegments: segmentsData.data?.length || 0,
          recentActivity: {
            users: usersData.data?.slice(0, 5) || [],
            content: contentData.data?.slice(0, 5) || [],
            calls: callLogsData.data?.slice(0, 5) || []
          }
        }

        result = { stats }
        break

      case 'integrations':
        // Hae integraatiot tietyn käyttäjän/organisaation ID:llä
        // Admin/moderator voi hakea minkä tahansa käyttäjän integraatiot
        const { user_id } = req.query
        
        if (!user_id) {
          return res.status(400).json({ error: 'user_id parameter required' })
        }

        let socialAccounts = []
        
        // 1. Hae Mixpost-konfiguraatio user_mixpost_config taulusta
        const { data: mixpostConfig, error: configError } = await db
          .from('user_mixpost_config')
          .select('mixpost_workspace_uuid, mixpost_api_token')
          .eq('user_id', user_id)
          .maybeSingle()

        // 2. Jos Mixpost-konfiguraatio löytyi, hae somet-tilit Mixpostista
        if (!configError && mixpostConfig?.mixpost_workspace_uuid && mixpostConfig?.mixpost_api_token) {
          try {
            const axios = (await import('axios')).default
            const mixpostUrl = `https://mixpost.mak8r.fi/mixpost/api/${mixpostConfig.mixpost_workspace_uuid}/accounts`
            
            const mixpostResponse = await axios.get(mixpostUrl, {
              headers: {
                'Authorization': `Bearer ${mixpostConfig.mixpost_api_token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (mixpostResponse.data?.data && Array.isArray(mixpostResponse.data.data)) {
              // Muunna Mixpost-tilit samaan muotoon kuin user_social_accounts
              socialAccounts = mixpostResponse.data.data.map(account => ({
                id: account.id,
                mixpost_account_uuid: account.id,
                provider: account.provider,
                account_name: account.name || account.username,
                username: account.username,
                profile_image_url: account.profile_image_url || account.image || account.picture,
                is_authorized: true,
                visibility: 'public',
                account_data: account,
                last_synced_at: new Date().toISOString(),
                created_at: account.created_at || new Date().toISOString()
              }))
            }
          } catch (mixpostError) {
            console.error('[admin-data] Error fetching Mixpost accounts:', mixpostError)
          }
        }

        // 3. Hae myös tallennetut tilit Supabasesta (fallback)
        const { data: savedAccounts, error: savedError } = await db
          .from('user_social_accounts')
          .select('*')
          .eq('user_id', user_id)
          .eq('is_authorized', true)
          .order('last_synced_at', { ascending: false })
        
        if (savedError) {
          console.error('[admin-data] Error fetching saved social accounts:', savedError)
        }

        // Yhdistä Mixpost-tilit ja tallennetut tilit (poista duplikaatit)
        if (savedAccounts && savedAccounts.length > 0) {
          const mixpostIds = new Set(socialAccounts.map(acc => acc.mixpost_account_uuid))
          const uniqueSavedAccounts = savedAccounts.filter(acc => !mixpostIds.has(acc.mixpost_account_uuid))
          socialAccounts = [...socialAccounts, ...uniqueSavedAccounts]
        } else if (socialAccounts.length === 0) {
          // Jos ei löytynyt Mixpostista eikä Supabasesta, yritä hakea ilman is_authorized-filtteriä
          const { data: allAccounts, error: allError } = await db
            .from('user_social_accounts')
            .select('*')
            .eq('user_id', user_id)
            .order('last_synced_at', { ascending: false })
          
          if (allError) {
            console.error('[admin-data] Error fetching all social accounts:', allError)
          } else if (allAccounts && allAccounts.length > 0) {
            socialAccounts = allAccounts
          }
        }

        // Hae muut integraatiot (user_secrets)
        const { data: secrets, error: secretsError } = await db
          .from('user_secrets')
          .select('id, user_id, secret_type, secret_name, metadata, is_active, created_at, updated_at')
          .eq('user_id', user_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (secretsError) {
          console.error('[admin-data] Error fetching secrets:', secretsError)
          return res.status(500).json({ error: 'Failed to fetch secrets', details: secretsError.message })
        }

        result = {
          socialAccounts: socialAccounts || [],
          secrets: secrets || []
        }
        break

      default:
        return res.status(400).json({ error: 'Invalid type parameter. Use: users, content, segments, stats, or integrations' })
    }

    return res.status(200).json({ 
      success: true, 
      ...result
    })

  } catch (error) {
    console.error('Admin data error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler) 