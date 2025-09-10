import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  console.log('mixpost-posts API called:', req.method, req.url)
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting mixpost-posts fetch...')
    const access_token = req.headers['authorization']?.replace('Bearer ', '')
    if (!access_token) {
      return res.status(401).json({ error: 'Unauthorized: access token puuttuu' })
    }

    // Luo Supabase-yhteys käyttäjän tokenilla
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${access_token}` } }
    })

    // Hae käyttäjän tiedot
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Käyttäjätietojen haku epäonnistui' })
    }

    // Hae Mixpost-konfiguraatio
    const { data: configData, error: configError } = await supabase
      .from('user_mixpost_config')
      .select('mixpost_workspace_uuid, mixpost_api_token')
      .eq('user_id', userData.user.id)
      .single()

    if (configError || !configData?.mixpost_workspace_uuid || !configData?.mixpost_api_token) {
      return res.status(400).json({ error: 'Mixpost-konfiguraatio puuttuu' })
    }

    // Kutsu Mixpost API:a
    const mixpostApiUrl = process.env.VITE_MIXPOST_API_URL || 'https://mixpost.mak8r.fi'
    const response = await fetch(`${mixpostApiUrl}/mixpost/api/${configData.mixpost_workspace_uuid}/posts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${configData.mixpost_api_token}`
      }
    })

    if (!response.ok) {
      throw new Error(`Mixpost API error: ${response.status}`)
    }

    const responseData = await response.json()
    console.log('Mixpost API response:', responseData)
    
    // Mixpost palauttaa datan { data: [...] } muodossa
    const data = responseData.data || responseData
    
    // Tarkista että data on array
    if (!Array.isArray(data)) {
      console.error('Mixpost API returned non-array data:', data)
      return res.status(500).json({ 
        error: 'Mixpost API palautti väärän muotoisen datan', 
        details: 'Expected array, got: ' + typeof data 
      })
    }
    
    // Filtteröi vain scheduled postaukset ja muunna oikeaan muotoon
    const scheduledPosts = data
      .filter(post => post.status === 'scheduled')
      .map(post => ({
        id: post.id,
        title: post.content || post.caption || 'Aikataulutettu postaus',
        caption: post.content || post.caption || '',
        status: 'scheduled',
        source: 'mixpost',
        createdAt: post.scheduled_at || post.created_at,
        scheduledDate: post.scheduled_at,
        thumbnail: post.media?.[0]?.url || '/placeholder.png',
        type: 'Photo'
      }))

    console.log('Processed scheduled posts:', scheduledPosts)
    return res.status(200).json(scheduledPosts)

  } catch (error) {
    console.error('Mixpost posts API error:', error)
    return res.status(500).json({ 
      error: 'Mixpost postausten haku epäonnistui', 
      details: error.message 
    })
  }
}
