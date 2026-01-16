import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import logger from '../../_lib/logger.js'
import { sendToN8N } from '../../_lib/n8n-client.js'

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * GET /api/auth/google/callback
 * Käsittelee Google OAuth 2.0 -callbackin, vaihtaa tokenin ja sulkee popupin.
 */
export default async function handler(req, res) {
  // Apufunktio, joka palauttaa HTML-scriptin popupin sulkemiseksi ja viestin lähettämiseksi
  const sendResponse = (status, message) => {
    const targetOrigin = process.env.APP_URL || 'https://app.rascalai.fi'
    const payload = {
      type: 'GOOGLE_AUTH_RESULT',
      status,
      message
    }
    // Suojaa < merkki script-kontekstissa
    const safePayload = JSON.stringify(payload).replace(/</g, '\\u003c')
    const safeMessageHtml = escapeHtml(message)

    const html = `
      <html>
        <body>
          <script>
            // Lähetä viesti avaajalle (pääikkunalle)
            (function() {
              try {
                var payload = ${safePayload};
                if (window.opener) {
                  window.opener.postMessage(payload, '${targetOrigin}');
                }
              } catch (e) {
                console.error('Failed to postMessage auth result', e);
              }
              // Sulje tämä popup-ikkuna
              window.close();
            })();
          </script>
          <div style="font-family: sans-serif; text-align: center; padding: 20px;">
            <h2>${status === 'success' ? 'Yhdistetty!' : 'Virhe'}</h2>
            <p>${safeMessageHtml}</p>
            <p>Ikkuna sulkeutuu automaattisesti...</p>
          </div>
        </body>
      </html>
    `
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  };

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code, state, error: oauthError } = req.query

    if (oauthError) {
      logger.error('❌ OAuth error from Google', { error: oauthError })
      return sendResponse('error', 'OAuth-virhe Googlen kanssa');
    }

    if (!code || !state) {
      return sendResponse('error', 'Puuttuvat parametrit (code tai state)');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const n8nWebhookUrl = process.env.N8N_INTEGRATION_WEBHOOK_URL

    if (!clientId || !clientSecret || !redirectUri || !supabaseUrl || !supabaseServiceKey) {
      logger.error('❌ Missing env variables for Google OAuth callback')
      return sendResponse('error', 'Palvelimen asetukset puuttuvat');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Hae ja validoi state
    const { data: stateSecrets, error: stateError } = await supabaseAdmin
      .from('user_secrets')
      .select('id, user_id, metadata')
      .eq('secret_type', 'oauth_state')
      .eq('secret_name', state)
      .eq('is_active', true)
      .single()

    if (stateError || !stateSecrets) {
      logger.warn('Invalid or expired OAuth state', { error: stateError, state })
      return sendResponse('error', 'Istunto vanhentunut tai virheellinen state-arvo');
    }

    // Poista state heti käytön jälkeen
    await supabaseAdmin.from('user_secrets').update({ is_active: false }).eq('id', stateSecrets.id);

    const orgId = stateSecrets.user_id
    const authUserId = stateSecrets.metadata?.auth_user_id

    // 2. Vaihda koodi tokeniin
    try {
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
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )

      const { access_token, refresh_token, expires_in } = tokenResponse.data

      if (!refresh_token) {
        return sendResponse('error', 'Ei refresh tokenia. Yritä uudelleen ja hyväksy kaikki luvat.');
      }

      // 3. Tallenna refresh_token Supabaseen
      const { error: secretError } = await supabaseAdmin.rpc('store_user_secret', {
        p_user_id: orgId,
        p_secret_type: 'google_analytics_credentials',
        p_secret_name: 'Google Analytics Refresh Token',
        p_plaintext_value: refresh_token,
        p_encryption_key: process.env.USER_SECRETS_ENCRYPTION_KEY,
        p_metadata: {
          client_id: clientId,
          access_token: access_token,
          expires_in: expires_in,
          provider: 'google_analytics',
          connected_at: new Date().toISOString()
        }
      })

      if (secretError) {
        logger.error('❌ Error storing Google Analytics token', {
          message: secretError.message,
          code: secretError.code
        })
        return sendResponse('error', 'Tietokantavirhe tokenin tallennuksessa');
      }

      // 4. Lähetä n8n:ään (ei pysäytä prosessia jos epäonnistuu, mutta logitetaan)
      if (n8nWebhookUrl) {
        try {
          let apiBaseUrl = process.env.APP_URL
            || process.env.NEXT_PUBLIC_APP_URL
            || 'https://app.rascalai.fi'

          await sendToN8N(n8nWebhookUrl, {
            action: 'google_analytics_connected',
            integration_type: 'google_analytics_credentials',
            integration_name: 'Google Analytics Refresh Token',
            customer_id: orgId,
            user_id: orgId,
            auth_user_id: authUserId,
            refresh_token: refresh_token,
            client_id: clientId,
            client_secret: clientSecret,
            metadata: {
              access_token: access_token,
              expires_in: expires_in,
              connected_at: new Date().toISOString()
            },
            timestamp: new Date().toISOString(),
            get_secret_url: `${apiBaseUrl}/api/user-secrets-service`,
            get_secret_params: {
              secret_type: 'google_analytics_credentials',
              secret_name: 'Google Analytics Refresh Token',
              user_id: orgId
            }
          }).catch(err => logger.warn('n8n webhook warning', { message: err.message }));
        } catch (e) {
          // Ignorataan n8n virheet käyttäjältä
          logger.warn('n8n webhook error (non-critical)', { message: e.message })
        }
      }

      // 5. Onnistui!
      return sendResponse('success', 'Google Analytics yhdistetty onnistuneesti!');

    } catch (tokenError) {
      logger.error('❌ Token exchange error', {
        message: tokenError.message,
        responseData: tokenError.response?.data
      })
      return sendResponse('error', 'Virhe Googlen yhteydessä. Tarkista Client ID ja Secret.');
    }

  } catch (error) {
    logger.error('❌ General error in Google OAuth callback', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return sendResponse('error', 'Odottamaton palvelinvirhe');
  }
}
