import { withOrganization } from '../../middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../../lib/cors.js'

async function handler(req, res) {
  console.log('mixpost-schedule-post API called:', req.method, req.url)
  
  // CORS headers
  setCorsHeaders(res, ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
  
  if (handlePreflight(req, res)) {
    return
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting mixpost-schedule-post...')
    
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client
    const orgId = req.organization.id

    // Hae Mixpost-konfiguraatio käyttäen organisaation ID:tä
    const { data: configData, error: configError } = await req.supabase
      .from('user_mixpost_config')
      .select('mixpost_workspace_uuid, mixpost_api_token')
      .eq('user_id', orgId)
      .single()

    if (configError || !configData?.mixpost_workspace_uuid || !configData?.mixpost_api_token) {
      return res.status(400).json({ error: 'Mixpost-konfiguraatio puuttuu' })
    }

    const { postUuid, postNow, updateData } = req.body

    if (!postUuid) {
      return res.status(400).json({ error: 'postUuid puuttuu' })
    }

    // Kutsu Mixpost API:a schedule-endpointtia
    const mixpostApiUrl = process.env.MIXPOST_API_URL || 'https://mixpost.mak8r.fi'
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
