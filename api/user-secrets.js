import { createClient } from '@supabase/supabase-js'
import { withOrganization } from './middleware/with-organization.js'
import axios from 'axios'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase envs in user-secrets')
  throw new Error('Missing Supabase environment variables')
}

// Salausavain ympäristömuuttujasta
// HUOM: Tämä pitää asettaa Vercelin ympäristömuuttujaksi
const ENCRYPTION_KEY = process.env.USER_SECRETS_ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  console.warn('⚠️ USER_SECRETS_ENCRYPTION_KEY not set. Encryption will fail.')
}

// Service role client salausavaimen hallintaan
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/user-secrets
 * Hakee käyttäjän salaisuudet (ei purettuja arvoja, vain metadata)
 */
async function handleGet(req, res) {
  const { secret_type, secret_name } = req.query

  try {
    // Hae käyttäjän organisaatio
    const orgId = req.organization?.id
    if (!orgId) {
      return res.status(400).json({ error: 'Käyttäjän organisaatio ei löytynyt' })
    }

    let query = req.supabase
      .from('user_secrets')
      .select('id, user_id, secret_type, secret_name, metadata, is_active, created_at, updated_at')
      .eq('user_id', orgId)
      .eq('is_active', true)

    if (secret_type) {
      query = query.eq('secret_type', secret_type)
    }

    if (secret_name) {
      query = query.eq('secret_name', secret_name)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user secrets:', error)
      return res.status(500).json({ error: 'Virhe salaisuuksien haussa' })
    }

    return res.status(200).json({ secrets: data || [] })
  } catch (error) {
    console.error('Error in handleGet:', error)
    return res.status(500).json({ error: 'Sisäinen palvelinvirhe' })
  }
}

/**
 * GET /api/user-secrets/decrypt
 * Hakee ja puraa tietyn salaisuuden arvon
 */
async function handleGetDecrypt(req, res) {
  const { secret_type, secret_name } = req.query

  if (!secret_type || !secret_name) {
    return res.status(400).json({ error: 'secret_type ja secret_name vaaditaan' })
  }

  if (!ENCRYPTION_KEY) {
    return res.status(500).json({ error: 'Salausavain ei ole konfiguroitu' })
  }

  try {
    // Hae käyttäjän organisaatio
    const orgId = req.organization?.id
    if (!orgId) {
      return res.status(400).json({ error: 'Käyttäjän organisaatio ei löytynyt' })
    }

    // Kutsutaan Supabase-funktiota, joka puraa arvon
    const { data, error } = await supabaseAdmin.rpc('get_user_secret', {
      p_user_id: orgId,
      p_secret_type: secret_type,
      p_secret_name: secret_name,
      p_encryption_key: ENCRYPTION_KEY
    })

    if (error) {
      console.error('Error decrypting secret:', error)
      return res.status(500).json({ error: 'Virhe salaisuuden purussa' })
    }

    if (!data) {
      return res.status(404).json({ error: 'Salaisuus ei löytynyt' })
    }

    return res.status(200).json({ 
      secret_type,
      secret_name,
      value: data // Purettu arvo
    })
  } catch (error) {
    console.error('Error in handleGetDecrypt:', error)
    return res.status(500).json({ error: 'Sisäinen palvelinvirhe' })
  }
}

/**
 * POST /api/user-secrets
 * Tallentaa uuden salaisuuden tai päivittää olemassa olevan
 */
async function handlePost(req, res) {
  const { secret_type, secret_name, plaintext_value, metadata } = req.body

  if (!secret_type || !secret_name || !plaintext_value) {
    return res.status(400).json({ 
      error: 'secret_type, secret_name ja plaintext_value vaaditaan' 
    })
  }

  if (!ENCRYPTION_KEY) {
    console.error('❌ USER_SECRETS_ENCRYPTION_KEY not set - encryption will fail')
    return res.status(500).json({ 
      error: 'Salausavain ei ole konfiguroitu',
      details: 'USER_SECRETS_ENCRYPTION_KEY ympäristömuuttuja puuttuu. Ota yhteyttä ylläpitoon.',
      hint: 'Aseta USER_SECRETS_ENCRYPTION_KEY Vercelin ympäristömuuttujaksi'
    })
  }

  try {
    // Hae käyttäjän organisaatio
    const orgId = req.organization?.id
    if (!orgId) {
      return res.status(400).json({ error: 'Käyttäjän organisaatio ei löytynyt' })
    }

    // Kutsutaan Supabase-funktiota, joka salaava ja tallentaa
    const { data, error } = await supabaseAdmin.rpc('store_user_secret', {
      p_user_id: orgId,
      p_secret_type: secret_type,
      p_secret_name: secret_name,
      p_plaintext_value: plaintext_value,
      p_encryption_key: ENCRYPTION_KEY,
      p_metadata: metadata || {}
    })

    if (error) {
      console.error('Error storing secret:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return res.status(500).json({ 
        error: 'Virhe salaisuuden tallennuksessa',
        details: error.message || 'Tuntematon virhe'
      })
    }

    // Lähetä webhook-ilmoitus uudesta integraatiosta (esim. Maken/N8N)
    // HUOM: Ei lähetetä purettua API-avainta webhookissa turvallisuussyistä
    // Automaatio voi hakea avaimen erikseen /api/user-secrets-service endpointista
    try {
      const webhookUrl = process.env.MAKE_INTEGRATION_WEBHOOK_URL || process.env.N8N_INTEGRATION_WEBHOOK_URL
      console.log('🔍 Webhook URL check:', {
        MAKE_INTEGRATION_WEBHOOK_URL: process.env.MAKE_INTEGRATION_WEBHOOK_URL ? 'SET' : 'NOT SET',
        N8N_INTEGRATION_WEBHOOK_URL: process.env.N8N_INTEGRATION_WEBHOOK_URL ? 'SET' : 'NOT SET',
        resolvedUrl: webhookUrl || 'NOT FOUND'
      })
      
      if (!webhookUrl) {
        console.warn('⚠️ No webhook URL configured (MAKE_INTEGRATION_WEBHOOK_URL or N8N_INTEGRATION_WEBHOOK_URL not set)')
        console.warn('   Webhook notification will be skipped')
      } else {
        // Hae API URL ympäristöstä (production URL)
        // Production URL: app.rascalai.fi
        let apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL 
          || process.env.VITE_APP_URL
          || 'https://app.rascalai.fi'
        
        console.log('🔗 API Base URL:', apiBaseUrl)

        const webhookPayload = {
          action: 'integration_created',
          integration_type: secret_type,
          integration_name: secret_name,
          user_id: orgId,
          auth_user_id: req.authUser?.id,
          metadata: metadata || {},
          secret_id: data,
          timestamp: new Date().toISOString(),
          // Endpoint josta voi hakea puretun API-avaimen
          get_secret_url: `${apiBaseUrl}/api/user-secrets-service`,
          get_secret_params: {
            secret_type: secret_type,
            secret_name: secret_name,
            user_id: orgId
          },
          // Autentikointi: tarvitsee x-api-key headerin (N8N_SECRET_KEY tai MAKE_WEBHOOK_SECRET)
          requires_auth: true,
          auth_header: 'x-api-key'
        }

        console.log('📤 Sending integration webhook to:', webhookUrl)
        console.log('📦 Webhook payload:', JSON.stringify(webhookPayload, null, 2))

        // Muodosta headerit - Make-webhookit eivät vaadi autentikointia
        const headers = {
          'Content-Type': 'application/json'
        }

        console.log('🚀 Starting webhook POST request (SYNC)...')
        console.log('   URL:', webhookUrl)
        console.log('   Headers:', headers)
        
        // Lähetä webhook SYNKRONISESTI, jotta se ehditään lähettää ennen kuin vastaus palautetaan
        // HUOM: Make-webhookit eivät vaadi autentikointia
        try {
          const webhookResponse = await axios.post(webhookUrl, webhookPayload, {
            headers: headers,
            timeout: 10000 // 10 sekuntia timeout
          })
          console.log('✅ Webhook notification sent successfully')
          console.log('   Status:', webhookResponse.status)
          console.log('   Response:', JSON.stringify(webhookResponse.data))
        } catch (webhookErr) {
          if (webhookErr.response) {
            // Palvelin vastasi, mutta virheellisellä status-koodilla
            console.error('❌ Webhook notification failed:')
            console.error('   Status:', webhookErr.response.status)
            console.error('   Response:', JSON.stringify(webhookErr.response.data))
            console.error('   Headers:', webhookErr.response.headers)
          } else if (webhookErr.request) {
            // Pyyntö tehtiin, mutta vastausta ei saatu
            console.error('❌ Webhook notification failed: No response received')
            console.error('   Error:', webhookErr.message)
            console.error('   Code:', webhookErr.code)
          } else {
            // Jokin muu virhe
            console.error('❌ Webhook notification failed:', webhookErr.message)
            console.error('   Error details:', webhookErr)
          }
          // Ei palauteta virhettä, koska webhook on optional
        }
      } // end if (webhookUrl)
    } catch (webhookError) {
      console.error('Error sending webhook notification (non-critical):', webhookError)
      // Ei palauteta virhettä, koska webhook on optional
    }

    return res.status(200).json({ 
      success: true,
      secret_id: data,
      message: 'Salaisuus tallennettu onnistuneesti'
    })
  } catch (error) {
    console.error('Error in handlePost:', error)
    console.error('Error stack:', error.stack)
    return res.status(500).json({ 
      error: 'Sisäinen palvelinvirhe',
      details: error.message || 'Tuntematon virhe',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
  }
}

/**
 * DELETE /api/user-secrets
 * Poistaa salaisuuden (merkitsee is_active = false)
 */
async function handleDelete(req, res) {
  const { secret_type, secret_name } = req.query

  if (!secret_type || !secret_name) {
    return res.status(400).json({ error: 'secret_type ja secret_name vaaditaan' })
  }

  try {
    // Hae käyttäjän organisaatio
    const orgId = req.organization?.id
    if (!orgId) {
      return res.status(400).json({ error: 'Käyttäjän organisaatio ei löytynyt' })
    }

    // Päivitä is_active = false (soft delete)
    const { error } = await req.supabase
      .from('user_secrets')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', orgId)
      .eq('secret_type', secret_type)
      .eq('secret_name', secret_name)

    if (error) {
      console.error('Error deleting secret:', error)
      return res.status(500).json({ error: 'Virhe salaisuuden poistossa' })
    }

    return res.status(200).json({ 
      success: true,
      message: 'Salaisuus poistettu onnistuneesti'
    })
  } catch (error) {
    console.error('Error in handleDelete:', error)
    return res.status(500).json({ error: 'Sisäinen palvelinvirhe' })
  }
}

/**
 * GET /api/user-secrets/get-decrypted
 * Service-to-service endpoint: palauttaa puretun salaisuuden
 * Tämä on suojattu N8N_SECRET_KEY:llä, jotta Maken/N8N automaatiot voivat hakea avaimen
 * HUOM: Tätä endpointia voi kutsua vain service-avaimella, ei käyttäjien tokeneilla
 */
async function handleGetDecryptedService(req, res) {
  const { secret_type, secret_name, user_id } = req.query

  if (!secret_type || !secret_name || !user_id) {
    return res.status(400).json({ 
      error: 'secret_type, secret_name ja user_id vaaditaan' 
    })
  }

  // Tarkista service key (sallii vain service-to-service kutsut)
  const serviceKey = req.headers['x-api-key'] || req.headers['x-service-key']
  const expectedKey = process.env.N8N_SECRET_KEY || process.env.MAKE_WEBHOOK_SECRET

  if (!serviceKey || serviceKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized - service key required' })
  }

  if (!ENCRYPTION_KEY) {
    return res.status(500).json({ error: 'Salausavain ei ole konfiguroitu' })
  }

  try {
    // Kutsutaan Supabase-funktiota, joka puraa arvon
    const { data, error } = await supabaseAdmin.rpc('get_user_secret', {
      p_user_id: user_id,
      p_secret_type: secret_type,
      p_secret_name: secret_name,
      p_encryption_key: ENCRYPTION_KEY
    })

    if (error) {
      console.error('Error decrypting secret (service):', error)
      return res.status(500).json({ error: 'Virhe salaisuuden purussa' })
    }

    if (!data) {
      return res.status(404).json({ error: 'Salaisuus ei löytynyt' })
    }

    return res.status(200).json({ 
      secret_type,
      secret_name,
      user_id,
      value: data, // Purettu arvo
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in handleGetDecryptedService:', error)
    return res.status(500).json({ error: 'Sisäinen palvelinvirhe' })
  }
}

export default withOrganization(async (req, res) => {
  if (req.method === 'GET') {
    // Tarkista onko kyseessä decrypt-pyyntö käyttäjälle
    if (req.query.decrypt === 'true') {
      return handleGetDecrypt(req, res)
    }
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handlePost(req, res)
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
})

