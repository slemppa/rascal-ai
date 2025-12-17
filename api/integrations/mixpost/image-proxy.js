import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

import { setCorsHeaders, handlePreflight } from '../../lib/cors.js'

export default async function handler(req, res) {
  // CORS headers
  setCorsHeaders(res, ['GET', 'OPTIONS'])
  
  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { url } = req.query

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' })
    }

    // Varmista että URL on Mixpost-palvelimelta
    if (!url.startsWith('https://mixpost.mak8r.fi')) {
      return res.status(400).json({ error: 'Invalid URL' })
    }

    // Hae access token ja Mixpost API token
    const access_token = req.headers['authorization']?.replace('Bearer ', '')
    
    let mixpostApiToken = null
    
    if (access_token) {
      // Luo Supabase-yhteys käyttäjän tokenilla
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${access_token}` } }
      })

      // Hae käyttäjän tiedot
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (!userError && userData?.user) {
        // Hae organisaation ID käyttäen getUserOrgId funktiota
        // Tämä vaatii importin, mutta koska tämä on GET-endpoint joka ei välttämättä tarvitse organisaatiota,
        // käytetään yksinkertaista tapaa: haetaan ensin users.id auth_user_id:llä
        const { data: userRecord } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', userData.user.id)
          .maybeSingle()
        
        // Jos käyttäjä on org_members taulussa, hae org_id
        const { data: orgMember } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('auth_user_id', userData.user.id)
          .maybeSingle()
        
        const userId = orgMember?.org_id || userRecord?.id
        
        if (userId) {
          // Hae Mixpost-konfiguraatio käyttäen organisaation ID:tä
          const { data: configData } = await supabase
            .from('user_mixpost_config')
            .select('mixpost_api_token')
            .eq('user_id', userId) // Käytetään organisaation ID:tä
            .single()

        if (configData?.mixpost_api_token) {
          mixpostApiToken = configData.mixpost_api_token
        }
      }
    }

    // Hae kuva Mixpostista Bearer tokenilla jos saatavilla
    const headers = {}
    if (mixpostApiToken) {
      headers['Authorization'] = `Bearer ${mixpostApiToken}`
    }
    
    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error('Failed to fetch image from Mixpost:', response.status)
      return res.status(response.status).json({ 
        error: 'Failed to fetch image from Mixpost' 
      })
    }

    // Kopioi content-type
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400') // Cache 24h

    // Stream kuva vastaukseen
    const imageBuffer = await response.arrayBuffer()
    res.send(Buffer.from(imageBuffer))

  } catch (error) {
    console.error('Mixpost image proxy error:', error)
    return res.status(500).json({ 
      error: 'Failed to proxy image',
      details: error.message 
    })
  }
}

