import { createClient } from '@supabase/supabase-js'
import { withOrganization } from '../_middleware/with-organization.js'
import { sendToN8N } from '../_lib/n8n-client.js'
import logger from '../_lib/logger.js'
import { encrypt, decrypt } from '../_lib/crypto.js'

// Salausavain ympäristömuuttujasta (käytetään vain Node.js-kerroksessa)
// HUOM: Tämä pitää asettaa Vercelin ympäristömuuttujaksi
const ENCRYPTION_KEY = process.env.USER_SECRETS_ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  logger.warn('⚠️ USER_SECRETS_ENCRYPTION_KEY not set. Encryption/decryption will fail.')
}

function getSupabaseAdmin(res) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    logger.error('❌ Missing Supabase envs in user-secrets')
    res.status(500).json({
      error: 'Supabase asetukset puuttuvat',
      hint: 'Tarkista SUPABASE_URL ja SUPABASE_SERVICE_ROLE_KEY Vercelistä'
    })
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

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
      logger.error('Error fetching user secrets:', { message: error.message, code: error.code })
      return res.status(500).json({ error: 'Virhe salaisuuksien haussa' })
    }

    return res.status(200).json({ secrets: data || [] })
  } catch (error) {
    logger.error('Error in handleGet:', { message: error.message, stack: error.stack, name: error.name })
    return res.status(500).json({ error: 'Sisäinen palvelinvirhe' })
  }
}

/**
 * GET /api/user-secrets/decrypt
 * Hakee ja puraa tietyn salaisuuden arvon Node.js-kerroksessa.
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
    const supabaseAdmin = getSupabaseAdmin(res)
    if (!supabaseAdmin) return

    // Hae käyttäjän organisaatio
    const orgId = req.organization?.id
    if (!orgId) {
      return res.status(400).json({ error: 'Käyttäjän organisaatio ei löytynyt' })
    }

    // Haetaan salattu arvo suoraan taulusta
    // Tarkista ensin secret_value (uusissa tietueissa), sitten encrypted_value (vanhat pgcrypto-tietueet)
    const { data, error } = await supabaseAdmin
      .from('user_secrets')
      .select('secret_value, encrypted_value')
      .eq('user_id', orgId)
      .eq('secret_type', secret_type)
      .eq('secret_name', secret_name)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching encrypted secret for decrypt:', { message: error.message, code: error.code })
      return res.status(500).json({ error: 'Virhe salaisuuden haussa' })
    }

    if (!data || (!data.secret_value && !data.encrypted_value)) {
      return res.status(404).json({ error: 'Salaisuus ei löytynyt' })
    }

    try {
      // Käytä secret_value jos saatavilla (uusissa Node.js-salatut), muuten encrypted_value (vanhat pgcrypto-salatut)
      let encryptedString
      if (data.secret_value) {
        // secret_value on TEXT → käytetään suoraan
        encryptedString = data.secret_value
      } else if (data.encrypted_value) {
        // encrypted_value on BYTEA → muunnetaan UTF-8 merkkijonoksi
        encryptedString = Buffer.isBuffer(data.encrypted_value)
          ? data.encrypted_value.toString('utf8')
          : String(data.encrypted_value)
      } else {
        return res.status(404).json({ error: 'Salaisuus ei löytynyt' })
      }

      const decryptedValue = decrypt(encryptedString, ENCRYPTION_KEY)

      return res.status(200).json({ 
        secret_type,
        secret_name,
        value: decryptedValue
      })
    } catch (decErr) {
      logger.error('Error decrypting secret in handleGetDecrypt', { message: decErr.message })
      return res.status(500).json({ error: 'Virhe salaisuuden purussa' })
    }
  } catch (error) {
    logger.error('Error in handleGetDecrypt:', { message: error.message, stack: error.stack, name: error.name })
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
    logger.error('❌ USER_SECRETS_ENCRYPTION_KEY not set - encryption will fail')
    return res.status(500).json({ 
      error: 'Salausavain ei ole konfiguroitu',
      hint: 'Aseta USER_SECRETS_ENCRYPTION_KEY ympäristömuuttujaksi Verceliin'
    })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin(res)
    if (!supabaseAdmin) return

    // Hae käyttäjän organisaatio
    const orgId = req.organization?.id
    if (!orgId) {
      logger.error('handlePost: Organization ID missing', { 
        hasOrganization: !!req.organization,
        authUserId: req.authUser?.id 
      })
      return res.status(400).json({ error: 'Käyttäjän organisaatio ei löytynyt' })
    }

    logger.debug('handlePost: Starting encryption', { 
      secret_type, 
      secret_name, 
      orgId,
      hasPlaintext: !!plaintext_value 
    })

    // Salaa arvo Node.js-kerroksessa
    let encryptedValue
    try {
      encryptedValue = encrypt(plaintext_value, ENCRYPTION_KEY)
      logger.debug('handlePost: Encryption successful', { 
        encryptedLength: encryptedValue?.length 
      })
    } catch (encErr) {
      logger.error('Error encrypting secret in handlePost', { 
        message: encErr.message,
        stack: encErr.stack,
        plaintextLength: plaintext_value?.length 
      })
      return res.status(500).json({ error: 'Virhe salauksen luonnissa' })
    }

    // Tarkista onko salaisuus jo olemassa (päivitys vs. uusi)
    logger.debug('handlePost: Checking for existing secret', { orgId, secret_type, secret_name })
    const { data: existingSecret, error: checkError } = await supabaseAdmin
      .from('user_secrets')
      .select('id, created_by')
      .eq('user_id', orgId)
      .eq('secret_type', secret_type)
      .eq('secret_name', secret_name)
      .maybeSingle()

    if (checkError) {
      logger.error('Error checking existing secret:', {
        message: checkError.message,
        code: checkError.code,
        details: checkError.details,
        hint: checkError.hint
      })
      return res.status(500).json({ 
        error: 'Virhe salaisuuden tarkistuksessa'
      })
    }

    logger.debug('handlePost: Existing secret check result', { 
      exists: !!existingSecret,
      existingId: existingSecret?.id 
    })

    let data, error

    if (existingSecret) {
      // Päivitä olemassa oleva tietue
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('user_secrets')
        .update({
          secret_value: encryptedValue,
          metadata: metadata || {},
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSecret.id)
        .select('id')
        .single()

      data = updateData
      error = updateError
    } else {
      // Luo uusi tietue
      const now = new Date().toISOString()
      const insertPayload = {
        user_id: orgId,
        secret_type,
        secret_name,
        secret_value: encryptedValue, // TEXT-sarakkeeseen suoraan merkkijonona
        metadata: metadata || {},
        is_active: true,
        created_by: req.authUser?.id || null,
        created_at: now,
        updated_at: now
      }

      logger.debug('handlePost: Inserting new secret', { 
        hasSecretValue: !!insertPayload.secret_value,
        secretValueLength: insertPayload.secret_value?.length,
        hasCreatedBy: !!insertPayload.created_by
      })

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('user_secrets')
        .insert(insertPayload)
        .select('id')
        .single()

      data = insertData
      error = insertError
    }

    if (error) {
      logger.error('Error storing secret:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        isUpdate: !!existingSecret,
        orgId,
        secret_type,
        secret_name
      })
      
      // Development-moodissa palautetaan lisätietoja debuggausta varten
      const errorResponse = { 
        error: 'Virhe salaisuuden tallennuksessa',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          code: error.code,
          hint: error.hint
        })
      }
      
      return res.status(500).json(errorResponse)
    }

    // Lähetä webhook-ilmoitus uudesta integraatiosta (esim. Maken/N8N)
    // HUOM: Ei lähetetä purettua API-avainta webhookissa turvallisuussyistä
    // Automaatio voi hakea avaimen erikseen /api/user-secrets-service endpointista
    try {
      const webhookUrl = process.env.MAKE_INTEGRATION_WEBHOOK_URL || process.env.N8N_INTEGRATION_WEBHOOK_URL
      logger.log('🔍 Webhook URL check:', {
        MAKE_INTEGRATION_WEBHOOK_URL: process.env.MAKE_INTEGRATION_WEBHOOK_URL ? 'SET' : 'NOT SET',
        N8N_INTEGRATION_WEBHOOK_URL: process.env.N8N_INTEGRATION_WEBHOOK_URL ? 'SET' : 'NOT SET',
        resolvedUrl: webhookUrl || 'NOT FOUND'
      })
      
      if (!webhookUrl) {
        logger.warn('⚠️ No webhook URL configured (MAKE_INTEGRATION_WEBHOOK_URL or N8N_INTEGRATION_WEBHOOK_URL not set)')
        logger.warn('   Webhook notification will be skipped')
      } else {
        // Hae API URL ympäristöstä (production URL)
        // Production URL: app.rascalai.fi
        let apiBaseUrl = process.env.APP_URL
          || process.env.NEXT_PUBLIC_APP_URL
          || 'https://app.rascalai.fi'
        
        logger.log('🔗 API Base URL:', apiBaseUrl)

        const webhookPayload = {
          action: 'integration_created',
          integration_type: secret_type,
          integration_name: secret_name,
          // TÄRKEÄÄ: Käytä user_id (public.users.id = organisaation ID) kun haet API-avainta!
          user_id: orgId,  // public.users.id - käytä tätä get_secret_params.user_id:ssä!
          auth_user_id: req.authUser?.id,  // auth.users.id - EI käytä tätä API-avaimen haussa!
          metadata: metadata || {},
          secret_id: data.id,
          timestamp: new Date().toISOString(),
          // Endpoint josta voi hakea puretun API-avaimen
          get_secret_url: `${apiBaseUrl}/api/user-secrets-service`,
          get_secret_params: {
            secret_type: secret_type,
            secret_name: secret_name,
            user_id: orgId  // HUOM: Käytä tätä! Älä käytä auth_user_id!
          },
          // Valmis URL esimerkki
          get_secret_example: `${apiBaseUrl}/api/user-secrets-service?secret_type=${secret_type}&secret_name=${encodeURIComponent(secret_name)}&user_id=${orgId}`,
          // Autentikointi: tarvitsee x-api-key headerin (N8N_SECRET_KEY tai MAKE_WEBHOOK_SECRET)
          requires_auth: true,
          auth_header: 'x-api-key'
        }

        logger.log('📤 Sending integration webhook to:', webhookUrl)
        logger.log('📦 Webhook payload:', JSON.stringify(webhookPayload, null, 2))

        logger.log('🚀 Starting webhook POST request (SYNC)...')
        logger.log('   URL:', webhookUrl)
        
        // Lähetä webhook SYNKRONISESTI HMAC-allekirjoituksella
        try {
          const webhookResponse = await sendToN8N(webhookUrl, webhookPayload)
          logger.log('✅ Webhook notification sent successfully')
          logger.log('   Response:', JSON.stringify(webhookResponse))
      } catch (webhookErr) {
          if (webhookErr.response) {
            // Palvelin vastasi, mutta virheellisellä status-koodilla
            logger.error('❌ Webhook notification failed (response)', {
              status: webhookErr.response.status
            })
          } else if (webhookErr.request) {
            // Pyyntö tehtiin, mutta vastausta ei saatu
            logger.error('❌ Webhook notification failed: No response received', {
              message: webhookErr.message,
              code: webhookErr.code
            })
          } else {
            // Jokin muu virhe
            logger.error('❌ Webhook notification failed', {
              message: webhookErr.message
            })
          }
          // Ei palauteta virhettä, koska webhook on optional
        }
      } // end if (webhookUrl)
    } catch (webhookError) {
      logger.error('Error sending webhook notification (non-critical)', {
        message: webhookError.message,
        stack: webhookError.stack
      })
      // Ei palauteta virhettä, koska webhook on optional
    }

    return res.status(200).json({ 
      success: true,
      secret_id: data.id,
      message: 'Salaisuus tallennettu onnistuneesti'
    })
  } catch (error) {
    logger.error('Error in handlePost:', { message: error.message, stack: error.stack, name: error.name })
    return res.status(500).json({ 
      error: 'Sisäinen palvelinvirhe'
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

    // Hae secret metadata ENNEN poistoa (jotta saadaan metadata webhookiin)
    const { data: secretData } = await req.supabase
      .from('user_secrets')
      .select('metadata, id')
      .eq('user_id', orgId)
      .eq('secret_type', secret_type)
      .eq('secret_name', secret_name)
      .eq('is_active', true)  // Vain aktiiviset
      .maybeSingle()

    // Päivitä is_active = false (soft delete)
    const { error } = await req.supabase
      .from('user_secrets')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', orgId)
      .eq('secret_type', secret_type)
      .eq('secret_name', secret_name)

    if (error) {
      logger.error('Error deleting secret:', { message: error.message, code: error.code })
      return res.status(500).json({ error: 'Virhe salaisuuden poistossa' })
    }

    // Lähetä webhook-ilmoitus integraation poistosta (esim. Maken/N8N)
    try {
      const webhookUrl = process.env.MAKE_INTEGRATION_WEBHOOK_URL || process.env.N8N_INTEGRATION_WEBHOOK_URL
      logger.log('🔍 Webhook URL check for delete:', {
        MAKE_INTEGRATION_WEBHOOK_URL: process.env.MAKE_INTEGRATION_WEBHOOK_URL ? 'SET' : 'NOT SET',
        N8N_INTEGRATION_WEBHOOK_URL: process.env.N8N_INTEGRATION_WEBHOOK_URL ? 'SET' : 'NOT SET',
        resolvedUrl: webhookUrl || 'NOT FOUND'
      })
      
      if (!webhookUrl) {
        logger.warn('⚠️ No webhook URL configured for delete notification')
        logger.warn('   Webhook notification will be skipped')
      } else {
        // Hae API URL ympäristöstä (production URL)
        let apiBaseUrl = process.env.APP_URL
          || process.env.NEXT_PUBLIC_APP_URL
          || 'https://app.rascalai.fi'
        
        logger.log('🔗 API Base URL:', apiBaseUrl)

        const webhookPayload = {
          action: 'delete',
          integration_type: secret_type,
          integration_name: secret_name,
          user_id: orgId,  // public.users.id - organisaation ID
          auth_user_id: req.authUser?.id,  // auth.users.id
          metadata: secretData?.metadata || {},
          secret_id: secretData?.id || null,
          timestamp: new Date().toISOString(),
          deleted_at: new Date().toISOString()
        }

        logger.log('📤 Sending delete webhook to:', webhookUrl)
        logger.log('📦 Webhook payload:', JSON.stringify(webhookPayload, null, 2))

        logger.log('🚀 Starting delete webhook POST request (SYNC)...')
        logger.log('   URL:', webhookUrl)
        
        // Lähetä webhook SYNKRONISESTI HMAC-allekirjoituksella
        try {
          const webhookResponse = await sendToN8N(webhookUrl, webhookPayload)
          logger.log('✅ Delete webhook notification sent successfully')
          logger.log('   Response:', JSON.stringify(webhookResponse))
        } catch (webhookErr) {
          if (webhookErr.response) {
            logger.error('❌ Delete webhook notification failed (response)', {
              status: webhookErr.response.status
            })
          } else if (webhookErr.request) {
            logger.error('❌ Delete webhook notification failed: No response received', {
              message: webhookErr.message
            })
          } else {
            logger.error('❌ Delete webhook notification failed', {
              message: webhookErr.message
            })
          }
          // Ei palauteta virhettä, koska webhook on optional
        }
      } // end if (webhookUrl)
    } catch (webhookError) {
      logger.error('Error sending delete webhook notification (non-critical)', {
        message: webhookError.message,
        stack: webhookError.stack
      })
      // Ei palauteta virhettä, koska webhook on optional
    }

    return res.status(200).json({ 
      success: true,
      message: 'Salaisuus poistettu onnistuneesti'
    })
  } catch (error) {
    logger.error('Error in handleDelete:', { message: error.message, stack: error.stack, name: error.name })
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
    const supabaseAdmin = getSupabaseAdmin(res)
    if (!supabaseAdmin) return

    // Haetaan salattu arvo suoraan taulusta
    // Tarkista ensin secret_value (uusissa tietueissa), sitten encrypted_value (vanhat pgcrypto-tietueet)
    const { data, error } = await supabaseAdmin
      .from('user_secrets')
      .select('secret_value, encrypted_value')
      .eq('user_id', user_id)
      .eq('secret_type', secret_type)
      .eq('secret_name', secret_name)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching encrypted secret in handleGetDecryptedService', {
        message: error.message,
        code: error.code
      })
      return res.status(500).json({ error: 'Virhe salaisuuden haussa' })
    }

    if (!data || (!data.secret_value && !data.encrypted_value)) {
      return res.status(404).json({ error: 'Salaisuus ei löytynyt' })
    }

    let decrypted
    try {
      // Käytä secret_value jos saatavilla (uusissa Node.js-salatut), muuten encrypted_value (vanhat pgcrypto-salatut)
      let encryptedString
      if (data.secret_value) {
        // secret_value on TEXT → käytetään suoraan
        encryptedString = data.secret_value
      } else if (data.encrypted_value) {
        // encrypted_value on BYTEA → muunnetaan UTF-8 merkkijonoksi
        encryptedString = Buffer.isBuffer(data.encrypted_value)
          ? data.encrypted_value.toString('utf8')
          : String(data.encrypted_value)
      } else {
        return res.status(404).json({ error: 'Salaisuus ei löytynyt' })
      }

      decrypted = decrypt(encryptedString, ENCRYPTION_KEY)
    } catch (decErr) {
      logger.error('Error decrypting secret (service) in handleGetDecryptedService', {
        message: decErr.message
      })
      return res.status(500).json({ error: 'Virhe salaisuuden purussa' })
    }

    return res.status(200).json({ 
      secret_type,
      secret_name,
      user_id,
      value: decrypted,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error in handleGetDecryptedService:', { message: error.message, stack: error.stack, name: error.name })
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

