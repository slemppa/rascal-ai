import { createClient } from '@supabase/supabase-js'
import logger from '../lib/logger.js'

// Sama fallback kuin muissa toimivissa endpointeissa
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

import { setCorsHeaders, handlePreflight } from '../lib/cors.js'

export default async function handler(req, res) {
  setCorsHeaders(res, ['POST', 'OPTIONS'])
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Luo userClient tokenilla – käytetään RLS:ää varten
    const authHeader = req.headers['authorization'] || req.headers['Authorization']
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' })
    }
    const token = authHeader.slice(7)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })

    // Vahvista käyttäjä JWT:stä
    let authUserId = null
    try {
      const { data: authResult, error: authError } = await userClient.auth.getUser(token)
      if (!authError && authResult?.user) authUserId = authResult.user.id
    } catch (_) {}
    const payload = req.body || {}
    
    // Validoi pakolliset kentät ja niiden tyypit/pituudet
    if (!payload.name) {
      return res.status(400).json({ error: 'name vaaditaan' })
    }
    
    if (typeof payload.name !== 'string') {
      return res.status(400).json({ error: 'name pitää olla merkkijono' })
    }
    
    const trimmedName = payload.name.trim()
    if (trimmedName.length < 1) {
      return res.status(400).json({ error: 'name ei voi olla tyhjä' })
    }
    
    if (trimmedName.length > 255) {
      return res.status(400).json({ error: 'name on liian pitkä (maksimi 255 merkkiä)' })
    }
    
    // Validoi description jos se on annettu
    if (payload.description !== undefined && payload.description !== null) {
      if (typeof payload.description !== 'string') {
        return res.status(400).json({ error: 'description pitää olla merkkijono' })
      }
      if (payload.description.length > 5000) {
        return res.status(400).json({ error: 'description on liian pitkä (maksimi 5000 merkkiä)' })
      }
    }

    // Hae organisaation ID (public.users.id) käyttäen auth_user_id:tä
    // Tarkista ensin onko käyttäjä kutsuttu käyttäjä (org_members taulussa)
    let publicUserId = null
    
    const { data: orgMember, error: orgError } = await userClient
      .from('org_members')
      .select('org_id')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (!orgError && orgMember?.org_id) {
      // Käyttäjä on kutsuttu käyttäjä, käytä organisaation ID:tä
      publicUserId = orgMember.org_id
    } else {
      // Jos ei löydy org_members taulusta, tarkista onko normaali käyttäjä
      const { data: userData, error: userError } = await userClient
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle()

      if (!userError && userData?.id) {
        // Normaali käyttäjä, käytä users.id:tä
        publicUserId = userData.id
      }
    }

    if (!publicUserId) {
      return res.status(403).json({ error: 'Käyttäjää ei löytynyt organisaatiosta' })
    }

    // Insert käyttäjän clientillä -> RLS varmistaa näkyvyyden ja oikeudet
    // Normalisoi name-trimmatulla versiolla
    const insertData = {
      ...payload,
      name: trimmedName,
      user_id: publicUserId
    }
    const { data, error } = await userClient
      .from('campaigns')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to create campaign', details: error.message })
    }

    res.status(200).json(data)
  } catch (error) {
    logger.error('Unhandled error /api/campaign-create:', error)
    const isDevelopment = process.env.NODE_ENV === 'development'
    res.status(500).json({ 
      error: 'Internal server error',
      ...(isDevelopment && { details: error.message })
    })
  }
}


