import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase envs in user-secrets-service')
  throw new Error('Missing Supabase environment variables')
}

// Salausavain ympäristömuuttujasta
const ENCRYPTION_KEY = process.env.USER_SECRETS_ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  console.warn('⚠️ USER_SECRETS_ENCRYPTION_KEY not set. Decryption will fail.')
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
    console.error('Unauthorized service request - missing or invalid service key')
    return res.status(401).json({ 
      error: 'Unauthorized - service key required',
      hint: 'Lähetä x-api-key headerissa N8N_SECRET_KEY tai MAKE_WEBHOOK_SECRET'
    })
  }

  if (!ENCRYPTION_KEY) {
    console.error('❌ USER_SECRETS_ENCRYPTION_KEY not set!')
    return res.status(500).json({ 
      error: 'Salausavain ei ole konfiguroitu',
      hint: 'Aseta USER_SECRETS_ENCRYPTION_KEY ympäristömuuttujaksi Verceliin'
    })
  }

  try {
    console.log('🔍 Service request for secret:', { 
      secret_type, 
      secret_name, 
      user_id,
      user_id_type: typeof user_id,
      user_id_length: user_id?.length
    })
    console.log('🔑 Encryption key status:', ENCRYPTION_KEY ? 'SET (length: ' + ENCRYPTION_KEY.length + ')' : 'NOT SET')

    // Validoi parametrit ennen RPC-kutsua
    if (!user_id || typeof user_id !== 'string' || user_id.length < 10) {
      console.error('❌ Invalid user_id:', user_id)
      return res.status(400).json({
        error: 'Virheellinen user_id',
        details: 'user_id pitää olla validi UUID (public.users.id)'
      })
    }

    console.log('📞 Calling Supabase RPC: get_user_secret...')
    
    // Kutsutaan Supabase-funktiota, joka puraa arvon
    const { data, error } = await supabaseAdmin.rpc('get_user_secret', {
      p_user_id: user_id,
      p_secret_type: secret_type,
      p_secret_name: secret_name,
      p_encryption_key: ENCRYPTION_KEY
    })
    
    console.log('📞 RPC response:', { 
      hasData: !!data, 
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code
    })

    if (error) {
      console.error('❌ Error decrypting secret (service):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      })
      return res.status(500).json({ 
        error: 'Virhe salaisuuden purussa',
        details: error.message || 'Tuntematon virhe',
        code: error.code,
        hint: error.hint
      })
    }

    if (!data) {
      // Lisää debug-tietoja, jos salaisuutta ei löydy
      console.error('Secret not found with params:', {
        user_id,
        secret_type,
        secret_name,
        note: 'user_id pitää olla public.users.id (organisaation ID), ei auth.users.id'
      })
      
      return res.status(404).json({ 
        error: 'Salaisuus ei löytynyt',
        hint: 'Tarkista että secret_type, secret_name ja user_id ovat oikein. HUOM: user_id pitää olla public.users.id (organisaation ID), ei auth.users.id (auth_user_id)',
        received_params: {
          user_id,
          secret_type,
          secret_name
        }
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
    console.error('❌ Error in user-secrets-service:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      fullError: error
    })
    return res.status(500).json({ 
      error: 'Sisäinen palvelinvirhe',
      details: error.message || 'Tuntematon virhe',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
  }
}

