import { withOrganization } from '../../middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client
    const orgId = req.organization.id

    // Hae Mixpost-konfiguraatio käyttäen organisaation ID:tä
    const { data: configData, error: configError } = await req.supabase
      .from('user_mixpost_config')
      .select('mixpost_workspace_uuid, mixpost_api_token')
      .eq('user_id', orgId) // Käytetään organisaation ID:tä
      .single()

    if (configError || !configData?.mixpost_workspace_uuid || !configData?.mixpost_api_token) {
      return res.status(400).json({ error: 'Mixpost-konfiguraatio puuttuu' })
    }

    const { postUuid, updateData } = req.body

    if (!postUuid) {
      return res.status(400).json({ error: 'postUuid puuttuu' })
    }

    // Kutsu Mixpost API:a
    const mixpostApiUrl = process.env.MIXPOST_API_URL || 'https://mixpost.mak8r.fi'
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

export default withOrganization(handler)

