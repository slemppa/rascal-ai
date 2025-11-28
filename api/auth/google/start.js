import { withOrganization } from '../../middleware/with-organization.js'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

/**
 * GET /api/auth/google/start
 * Luo Google OAuth 2.0 -valtuutuslinkin ja tallentaa state-arvon
 */
async function handleGoogleOAuthStart(req, res) {
  try {
    // Tarkista ympäristömuuttujat
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!clientId || !redirectUri) {
      console.error('❌ Missing Google OAuth environment variables')
      return res.status(500).json({ 
        error: 'Google OAuth asetukset puuttuvat',
        details: 'GOOGLE_CLIENT_ID ja GOOGLE_REDIRECT_URI vaaditaan'
      })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      return res.status(500).json({ 
        error: 'Supabase asetukset puuttuvat'
      })
    }

    // Hae käyttäjän organisaatio (middleware on jo hakenut sen)
    const orgId = req.organization?.id
    const authUserId = req.authUser?.id

    if (!orgId || !authUserId) {
      return res.status(400).json({ error: 'Käyttäjän organisaatio ei löytynyt' })
    }

    // Generoi satunnainen ja uniikki state-arvo
    const state = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minuuttia

    // Tallenna state-arvo user_secrets tauluun väliaikaisesti
    // Käytetään service role clientia, jotta voidaan tallentaa ilman RLS-ongelmia
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Käytetään user_secrets taulua OAuth state-arvon tallentamiseen
    // secret_type: 'oauth_state', secret_name: state-arvo, metadata: provider ja expires_at
    const { data: stateData, error: stateError } = await supabaseAdmin.rpc('store_user_secret', {
      p_user_id: orgId,
      p_secret_type: 'oauth_state',
      p_secret_name: state, // State-arvo itse käytetään nimenä
      p_plaintext_value: state, // Tallennetaan myös arvona (ei tarvita salattuna, koska se on väliaikainen)
      p_encryption_key: process.env.USER_SECRETS_ENCRYPTION_KEY || 'temp-key', // Tarvitaan funktiossa
      p_metadata: {
        provider: 'google_analytics',
        auth_user_id: authUserId,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }
    })

    if (stateError) {
      console.error('❌ Error saving OAuth state:', stateError)
      console.error('❌ Error details:', {
        code: stateError.code,
        message: stateError.message,
        details: stateError.details,
        hint: stateError.hint
      })
      
      return res.status(500).json({ 
        error: 'Virhe state-arvon tallennuksessa',
        details: stateError.message,
        errorCode: stateError.code,
        hint: stateError.hint || 'Tarkista Supabase-lokit lisätietoja varten'
      })
    }

    // Konstruoi Google OAuth URL
    const scope = 'https://www.googleapis.com/auth/analytics.readonly'
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent') // Varmistaa että refresh_token saadaan
    authUrl.searchParams.set('state', state)

    console.log('✅ OAuth state saved:', { state, orgId, authUserId })
    console.log('🔗 Generated OAuth URL:', authUrl.toString())

    // Palauta OAuth URL frontendiin
    return res.status(200).json({
      authUrl: authUrl.toString(),
      state: state // Palautetaan myös frontendiin varmistukseksi (ei välttämätöntä)
    })
  } catch (error) {
    console.error('❌ Error in handleGoogleOAuthStart:', error)
    return res.status(500).json({ 
      error: 'Sisäinen palvelinvirhe',
      details: error.message
    })
  }
}

export default withOrganization(handleGoogleOAuthStart)

