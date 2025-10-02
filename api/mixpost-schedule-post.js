import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  console.log('mixpost-schedule-post API called:', req.method, req.url)
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting mixpost-schedule-post...')
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

    const { postUuid, postNow, updateData } = req.body

    if (!postUuid) {
      return res.status(400).json({ error: 'postUuid puuttuu' })
    }

    // Kutsu Mixpost API:a schedule-endpointtia
    const mixpostApiUrl = process.env.VITE_MIXPOST_API_URL || 'https://mixpost.mak8r.fi'
    const apiUrl = `${mixpostApiUrl}/mixpost/api/${configData.mixpost_workspace_uuid}/posts/schedule/${postUuid}`
    
    console.log('Sending to Mixpost Schedule API:', {
      url: apiUrl,
      postNow: postNow
    })
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${configData.mixpost_api_token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        postNow: postNow || false,
        ...(updateData && { ...updateData })  // Lisää media-data jos saatavilla
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mixpost Schedule API error response:', errorText)
      throw new Error(`Mixpost Schedule API error: ${response.status} - ${errorText}`)
    }

    const responseData = await response.json()
    console.log('Mixpost Schedule API success:', responseData)

    return res.status(200).json(responseData)

  } catch (error) {
    console.error('Mixpost schedule API error:', error)
    return res.status(500).json({ 
      error: 'Mixpost postauksen ajastus epäonnistui', 
      details: error.message 
    })
  }
}
