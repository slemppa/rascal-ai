import { createClient } from '@supabase/supabase-js'
import logger from '../lib/logger.js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('❌ Missing Supabase envs in user-secrets-service')
  throw new Error('Missing Supabase environment variables')
}

// Salausavain ympäristömuuttujasta
const ENCRYPTION_KEY = process.env.USER_SECRETS_ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  logger.warn('⚠️ USER_SECRETS_ENCRYPTION_KEY not set. Decryption will fail.')
}

// Service role client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/user-secrets-service
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
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { secret_type, secret_name, user_id } = req.query

  // Validoi pakolliset parametrit
  if (!secret_type || !secret_name || !user_id) {
    return res.status(400).json({ 
      error: 'secret_type, secret_name ja user_id vaaditaan' 
    })
  }

  // Tarkista service key (sallii vain service-to-service kutsut)
  const serviceKey = req.headers['x-api-key'] || req.headers['x-service-key']
  const expectedKey = process.env.N8N_SECRET_KEY || process.env.MAKE_WEBHOOK_SECRET

  if (!serviceKey || serviceKey !== expectedKey) {
    logger.warn('Unauthorized service request - missing or invalid service key')
    return res.status(401).json({ 
      error: 'Unauthorized - service key required'
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

    logger.debug('📞 Calling Supabase RPC: get_user_secret...')
    
    // Kutsutaan Supabase-funktiota, joka puraa arvon
    const { data, error } = await supabaseAdmin.rpc('get_user_secret', {
      p_user_id: user_id,
      p_secret_type: secret_type,
      p_secret_name: secret_name,
      p_encryption_key: ENCRYPTION_KEY
    })
    
    logger.debug('📞 RPC response from get_user_secret', { 
      hasData: !!data, 
      hasError: !!error,
      errorCode: error?.code
    })

    if (error) {
      logger.error('❌ Error decrypting secret (service)', {
        message: error.message,
        code: error.code
      })
      return res.status(500).json({ 
        error: 'Virhe salaisuuden purussa'
      })
    }

    if (!data) {
      // Lisää debug-tietoja, jos salaisuutta ei löydy
      logger.warn('Secret not found with params', {
        user_id,
        secret_type,
        secret_name
      })
      
      return res.status(404).json({ 
        error: 'Salaisuus ei löytynyt'
      })
    }

    return res.status(200).json({ 
      success: true,
      secret_type,
      secret_name,
      user_id,
      value: data, // Purettu arvo
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

