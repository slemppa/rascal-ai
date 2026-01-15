import { createClient } from '@supabase/supabase-js'
import logger from '../_lib/logger.js'
import { decrypt } from '../_lib/crypto.js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('❌ Missing Supabase envs in user-secrets-service')
  throw new Error('Missing Supabase environment variables')
}

// Salausavain ympäristömuuttujasta (käytetään vain Node.js-kerroksessa)
const ENCRYPTION_KEY = process.env.USER_SECRETS_ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  logger.warn('⚠️ USER_SECRETS_ENCRYPTION_KEY not set. Decryption will fail.')
}

// Service role client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/users/secrets-service
 * Service-to-service endpoint: palauttaa puretun salaisuuden
 * Suojattu N8N_SECRET_KEY:llä tai MAKE_WEBHOOK_SECRET:llä
 * Tämä on tarkoitettu Maken/N8N automaatioille
 * 
 * Query parametrit:
 * - secret_type: salaisuuden tyyppi (esim. 'wordpress_api_key')
 * - secret_name: salaisuuden nimi (esim. 'WordPress REST API Key')
 * - user_id: käyttäjän/organisaation ID (public.users.id)
 * 
 * Headerit:
 * - x-api-key: N8N_SECRET_KEY tai MAKE_WEBHOOK_SECRET
 */
export default async function handler(req, res) {
  // Vain GET-metodit sallittu
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      hint: 'This endpoint only accepts GET requests'
    })
  }

  // Debug: logitaan URL ja metodit
  logger.debug('user-secrets-service: Request received', {
    method: req.method,
    url: req.url,
    path: req.url?.split('?')[0],
    queryParams: Object.keys(req.query)
  })

  // Hae ja dekoodaa query-parametrit (URL-dekoodaus automaattisesti, mutta varmistetaan)
  const secret_type = req.query.secret_type
  const secret_name = req.query.secret_name
  const user_id = req.query.user_id

  // Validoi pakolliset parametrit
  if (!secret_type || !secret_name || !user_id) {
    logger.warn('Missing required parameters', {
      hasSecretType: !!secret_type,
      hasSecretName: !!secret_name,
      hasUserId: !!user_id,
      allQueryParams: Object.keys(req.query)
    })
    return res.status(400).json({ 
      error: 'secret_type, secret_name ja user_id vaaditaan' 
    })
  }

  logger.debug('user-secrets-service: Received params', {
    secret_type,
    secret_name,
    user_id,
    secret_name_length: secret_name?.length
  })

  // Tarkista service key (sallii vain service-to-service kutsut)
  const serviceKey = req.headers['x-api-key'] || req.headers['x-service-key']
  const expectedKey = process.env.N8N_SECRET_KEY || process.env.MAKE_WEBHOOK_SECRET

  // Debug: logitaan mitä headereita saatiin
  logger.debug('user-secrets-service: Auth check', {
    hasXApiKey: !!req.headers['x-api-key'],
    hasXServiceKey: !!req.headers['x-service-key'],
    hasAuthorization: !!req.headers['authorization'],
    allHeaders: Object.keys(req.headers).filter(h => 
      h.toLowerCase().includes('api') || 
      h.toLowerCase().includes('auth') ||
      h.toLowerCase().includes('key')
    )
  })

  if (!expectedKey) {
    logger.error('❌ N8N_SECRET_KEY or MAKE_WEBHOOK_SECRET not configured!')
    return res.status(500).json({ 
      error: 'Service authentication not configured',
      hint: 'N8N_SECRET_KEY or MAKE_WEBHOOK_SECRET environment variable is required'
    })
  }

  if (!serviceKey) {
    logger.warn('Unauthorized service request - missing x-api-key header', {
      receivedHeaders: Object.keys(req.headers)
    })
    return res.status(401).json({ 
      error: 'Unauthorized - service key required',
      hint: 'Send x-api-key header with N8N_SECRET_KEY or MAKE_WEBHOOK_SECRET value',
      required_header: 'x-api-key'
    })
  }

  if (serviceKey !== expectedKey) {
    logger.warn('Unauthorized service request - invalid service key', {
      keyLength: serviceKey?.length,
      expectedLength: expectedKey?.length
    })
    return res.status(401).json({ 
      error: 'Unauthorized - invalid service key',
      hint: 'Check that x-api-key header matches N8N_SECRET_KEY or MAKE_WEBHOOK_SECRET'
    })
  }

  if (!ENCRYPTION_KEY) {
    logger.error('❌ USER_SECRETS_ENCRYPTION_KEY not set!')
    return res.status(500).json({ 
      error: 'Salausavain ei ole konfiguroitu'
    })
  }

  try {
    logger.info('🔍 Service request for secret', { 
      secret_type, 
      secret_name, 
      user_id
    })

    // Validoi parametrit ennen RPC-kutsua
    if (!user_id || typeof user_id !== 'string' || user_id.length < 10) {
      logger.warn('❌ Invalid user_id in user-secrets-service', { user_id })
      return res.status(400).json({
        error: 'Virheellinen user_id'
      })
    }

    // Haetaan salattu arvo suoraan user_secrets-taulusta
    // Tarkista ensin secret_value (uusissa tietueissa), sitten encrypted_value (vanhat pgcrypto-tietueet)
    // Trim ja normalisoi secret_name
    const normalizedSecretName = secret_name?.trim() || secret_name

    logger.debug('user-secrets-service: Querying database', {
      user_id,
      secret_type,
      secret_name,
      normalizedSecretName,
      secret_name_length: secret_name?.length,
      normalized_length: normalizedSecretName?.length
    })

    // Hae kaikki salaisuudet user_id:llä ja secret_type:llä, filtteröi JavaScriptissä
    // Tämä varmistaa että välilyönnit ja muut merkit käsitellään oikein
    const { data: allSecrets, error } = await supabaseAdmin
      .from('user_secrets')
      .select('id, secret_value, encrypted_value, is_active, secret_name')
      .eq('user_id', user_id)
      .eq('secret_type', secret_type)
      .eq('is_active', true)

    if (error) {
      logger.error('❌ Error fetching encrypted secret (service)', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return res.status(500).json({ 
        error: 'Virhe salaisuuden haussa'
      })
    }

    // Etsi oikea salaisuus JavaScriptissä (tarkka match, case-sensitive)
    const data = allSecrets?.find(secret => 
      secret.secret_name?.trim() === normalizedSecretName
    )

    if (error) {
      logger.error('❌ Error fetching encrypted secret (service)', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return res.status(500).json({ 
        error: 'Virhe salaisuuden haussa'
      })
    }

    logger.debug('user-secrets-service: Query result', {
      found: !!data,
      hasSecretValue: !!data?.secret_value,
      hasEncryptedValue: !!data?.encrypted_value,
      isActive: data?.is_active,
      secretId: data?.id
    })

    if (!data || (!data.secret_value && !data.encrypted_value)) {
      // Debug: Hae kaikki salaisuudet samalla user_id:llä ja secret_type:llä
      const { data: allSecrets } = await supabaseAdmin
        .from('user_secrets')
        .select('id, secret_type, secret_name, is_active')
        .eq('user_id', user_id)
        .eq('secret_type', secret_type)

      // Debug: Hae myös ilman secret_name-filtteriä
      const { data: debugData } = await supabaseAdmin
        .from('user_secrets')
        .select('id, secret_type, secret_name, is_active, secret_value, encrypted_value')
        .eq('user_id', user_id)
        .eq('secret_type', secret_type)
        .maybeSingle()

      logger.warn('Secret not found with exact params', {
        user_id,
        secret_type,
        secret_name,
        secret_name_trimmed: secret_name?.trim(),
        secret_name_length: secret_name?.length,
        debug_found: !!debugData,
        debug_secret_name: debugData?.secret_name,
        debug_secret_name_length: debugData?.secret_name?.length,
        debug_is_active: debugData?.is_active,
        name_exact_match: debugData?.secret_name === secret_name?.trim(),
        all_secrets_for_user: allSecrets?.map(s => ({
          name: s.secret_name,
          is_active: s.is_active
        }))
      })
      
      return res.status(404).json({ 
        error: 'Salaisuus ei löytynyt',
        hint: 'Tarkista että secret_type, secret_name ja user_id ovat oikein. HUOM: user_id pitää olla public.users.id (organisaation ID), ei auth.users.id (auth_user_id)',
        received_params: {
          user_id,
          secret_type,
          secret_name: secret_name?.trim(),
          secret_name_length: secret_name?.length
        },
        ...(process.env.NODE_ENV === 'development' && allSecrets && {
          available_secrets: allSecrets.map(s => ({
            secret_name: s.secret_name,
            is_active: s.is_active
          }))
        })
      })
    }

    let decryptedValue
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

      decryptedValue = decrypt(encryptedString, ENCRYPTION_KEY)
    } catch (decErr) {
      logger.error('❌ Error decrypting secret (service)', {
        message: decErr.message
      })
      return res.status(500).json({ 
        error: 'Virhe salaisuuden purussa'
      })
    }

    return res.status(200).json({ 
      success: true,
      secret_type,
      secret_name,
      user_id,
      value: decryptedValue,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('❌ Error in user-secrets-service', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return res.status(500).json({ 
      error: 'Sisäinen palvelinvirhe'
    })
  }
}

