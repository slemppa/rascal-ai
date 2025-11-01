import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
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
        // Hae Mixpost-konfiguraatio
        const { data: configData } = await supabase
          .from('user_mixpost_config')
          .select('mixpost_api_token')
          .eq('user_id', userData.user.id)
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

