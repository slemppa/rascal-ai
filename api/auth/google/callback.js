import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

/**
 * GET /api/auth/google/callback
 * Käsittelee Google OAuth 2.0 -callbackin, vaihtaa tokenin ja lähettää n8n:ään
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code, state, error: oauthError } = req.query

    // Tarkista OAuth-virheet
    if (oauthError) {
      console.error('❌ OAuth error from Google:', oauthError)
      return res.redirect(`/settings?tab=features&error=${encodeURIComponent('OAuth-virhe: ' + oauthError)}`)
    }

    if (!code || !state) {
      console.error('❌ Missing code or state parameter')
      return res.redirect(`/settings?tab=features&error=${encodeURIComponent('Puuttuvat parametrit')}`)
    }

    // Tarkista ympäristömuuttujat
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const n8nWebhookUrl = process.env.N8N_INTEGRATION_WEBHOOK_URL

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('❌ Missing Google OAuth environment variables')
      return res.redirect(`/settings?tab=features&error=${encodeURIComponent('OAuth-asetukset puuttuvat')}`)
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      return res.redirect(`/settings?tab=features&error=${encodeURIComponent('Supabase-asetukset puuttuvat')}`)
    }

    // Hae state-arvo user_secrets taulusta ja vahvista se
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Hae state-arvo user_secrets taulusta
    const { data: stateSecrets, error: stateError } = await supabaseAdmin
      .from('user_secrets')
      .select('id, user_id, metadata, created_at')
      .eq('secret_type', 'oauth_state')
      .eq('secret_name', state) // State-arvo on secret_name
      .eq('is_active', true)
      .single()

    if (stateError || !stateSecrets) {
      console.error('❌ Invalid or expired state:', stateError)
      return res.redirect(`/settings?tab=features&error=${encodeURIComponent('Virheellinen tai vanhentunut state-arvo')}`)
    }

    // Tarkista että state ei ole vanhentunut (metadata.expires_at)
    const metadata = stateSecrets.metadata || {}
    const expiresAt = new Date(metadata.expires_at)
    if (expiresAt < new Date()) {
      console.error('❌ State expired:', expiresAt)
      // Poista vanhentunut state (merkitse is_active = false)
      await supabaseAdmin
        .from('user_secrets')
        .update({ is_active: false })
        .eq('id', stateSecrets.id)
      return res.redirect(`/settings?tab=features&error=${encodeURIComponent('State-arvo on vanhentunut. Yritä uudelleen.')}`)
    }

    const orgId = stateSecrets.user_id
    const authUserId = metadata.auth_user_id

    console.log('✅ State validated:', { state, orgId, authUserId })

    // Vaihda authorization code refresh tokeniksi
    try {
      // Google OAuth API vaatii URL-encoded format
      const params = new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })

      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      const { access_token, refresh_token, expires_in } = tokenResponse.data

      if (!refresh_token) {
        console.error('❌ No refresh_token in response:', tokenResponse.data)
        return res.redirect(`/settings?tab=features&error=${encodeURIComponent('Refresh token ei saatu. Varmista että prompt=consent on käytössä.')}`)
      }

      console.log('✅ Tokens received:', { 
        has_access_token: !!access_token, 
        has_refresh_token: !!refresh_token,
        expires_in 
      })

      // Poista käytetty state-arvo (merkitse is_active = false)
      await supabaseAdmin
        .from('user_secrets')
        .update({ is_active: false })
        .eq('id', stateSecrets.id)

      // Tallenna refresh_token user_secrets-tauluun
      // Käytetään user-secrets.js:n logiikkaa
      const { data: secretData, error: secretError } = await supabaseAdmin.rpc('store_user_secret', {
        p_user_id: orgId,
        p_secret_type: 'google_analytics_credentials',
        p_secret_name: 'Google Analytics Refresh Token',
        p_plaintext_value: refresh_token,
        p_encryption_key: process.env.USER_SECRETS_ENCRYPTION_KEY,
        p_metadata: {
          client_id: clientId,
          access_token: access_token, // Tallennetaan myös access_token metadataan (voi vanhentua)
          expires_in: expires_in,
          provider: 'google_analytics',
          connected_at: new Date().toISOString()
        }
      })

      if (secretError) {
        console.error('❌ Error storing refresh token:', secretError)
        return res.redirect(`/settings?tab=features&error=${encodeURIComponent('Virhe tokenin tallennuksessa')}`)
      }

      console.log('✅ Refresh token stored:', secretData)

      // Lähetä refresh_token n8n:ään
      if (n8nWebhookUrl) {
        try {
          // Hae API URL ympäristöstä
          let apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL 
            || process.env.VITE_APP_URL
            || 'https://app.rascalai.fi'

          const webhookPayload = {
            action: 'google_analytics_connected',
            integration_type: 'google_analytics_credentials',
            integration_name: 'Google Analytics Refresh Token',
            customer_id: orgId, // Organisaation ID
            user_id: orgId, // Organisaation ID (yhteensopivuus)
            auth_user_id: authUserId, // Auth käyttäjän ID
            refresh_token: refresh_token, // Lähetetään suoraan n8n:ään
            client_id: clientId, // Lähetetään myös client_id n8n:ään
            client_secret: clientSecret, // Lähetetään myös client_secret n8n:ään (jos tarvitaan)
            metadata: {
              access_token: access_token,
              expires_in: expires_in,
              connected_at: new Date().toISOString()
            },
            timestamp: new Date().toISOString(),
            // Endpoint josta voi hakea puretun refresh tokenin tulevaisuudessa
            get_secret_url: `${apiBaseUrl}/api/user-secrets-service`,
            get_secret_params: {
              secret_type: 'google_analytics_credentials',
              secret_name: 'Google Analytics Refresh Token',
              user_id: orgId
            }
          }

          // Muodosta headerit
          const headers = {
            'Content-Type': 'application/json'
          }
          
          // Lisää x-api-key header jos N8N_SECRET_KEY on asetettu
          const n8nSecretKey = process.env.N8N_SECRET_KEY
          if (n8nSecretKey) {
            headers['x-api-key'] = n8nSecretKey
          }

          console.log('📤 Sending Google Analytics webhook to n8n:', n8nWebhookUrl)
          
          await axios.post(n8nWebhookUrl, webhookPayload, {
            headers: headers,
            timeout: 10000 // 10 sekuntia timeout
          })

          console.log('✅ Webhook sent successfully to n8n')
        } catch (webhookError) {
          console.error('❌ Error sending webhook to n8n:', webhookError)
          // Ei palauteta virhettä, koska token on jo tallennettu
          // Webhook on optional
        }
      } else {
        console.warn('⚠️ N8N_INTEGRATION_WEBHOOK_URL not set, skipping webhook')
      }

      // Ohjaa käyttäjä takaisin asetussivulle onnistumisviestillä
      return res.redirect(`/settings?tab=features&success=${encodeURIComponent('Google Analytics yhdistetty onnistuneesti!')}`)
    } catch (tokenError) {
      console.error('❌ Error exchanging token:', tokenError.response?.data || tokenError.message)
      
      // Poista state myös virhetilanteessa (merkitse is_active = false)
      await supabaseAdmin
        .from('user_secrets')
        .update({ is_active: false })
        .eq('id', stateSecrets.id)

      const errorMessage = tokenError.response?.data?.error_description 
        || tokenError.response?.data?.error 
        || tokenError.message 
        || 'Tuntematon virhe tokenin vaihdossa'
      
      return res.redirect(`/settings?tab=features&error=${encodeURIComponent(errorMessage)}`)
    }
  } catch (error) {
    console.error('❌ Error in handleGoogleOAuthCallback:', error)
    return res.redirect(`/settings?tab=features&error=${encodeURIComponent('Sisäinen palvelinvirhe')}`)
  }
}

