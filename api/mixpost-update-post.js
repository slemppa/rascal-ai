import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
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

    const { postUuid, updateData } = req.body

    if (!postUuid) {
      return res.status(400).json({ error: 'postUuid puuttuu' })
    }

    // Kutsu Mixpost API:a
    const mixpostApiUrl = process.env.VITE_MIXPOST_API_URL || 'https://mixpost.mak8r.fi'
    const apiUrl = `${mixpostApiUrl}/mixpost/api/${configData.mixpost_workspace_uuid}/posts/${postUuid}`
    
    console.log('Sending to Mixpost API:', {
      url: apiUrl,
      updateData: updateData
    })
    
    // Käytetään PUT-endpointtia täydelliseen päivitykseen
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${configData.mixpost_api_token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mixpost API error response:', errorText)
      throw new Error(`Mixpost API error: ${response.status} - ${errorText}`)
    }

    const responseData = await response.json()
    
    return res.status(200).json(responseData)
  } catch (error) {
    console.error('Error updating Mixpost post:', error)
    return res.status(500).json({ error: error.message || 'Virhe postauksen päivityksessä' })
  }
}

