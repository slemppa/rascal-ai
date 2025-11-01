import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'DELETE') {
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

    const { postUuid } = req.body

    if (!postUuid) {
      return res.status(400).json({ error: 'postUuid puuttuu' })
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

    // Tee DELETE-kutsu Mixpostiin
    const mixpostApiUrl = process.env.VITE_MIXPOST_API_URL || 'https://mixpost.mak8r.fi'
    const mixpostUrl = `${mixpostApiUrl}/mixpost/api/${configData.mixpost_workspace_uuid}/posts/${postUuid}`
    
    console.log('🗑️ Deleting Mixpost post:', mixpostUrl)
    
    const response = await fetch(mixpostUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${configData.mixpost_api_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trash: false,
        delete_mode: 'app_only'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Mixpost DELETE failed:', errorText)
      return res.status(response.status).json({ 
        error: 'Mixpost-postauksen poisto epäonnistui',
        details: errorText
      })
    }

    console.log('✅ Mixpost post deleted successfully:', postUuid)

    // Päivitä Supabase content-taulun status takaisin "Under Review"
    // Hae käyttäjän user_id users-taulusta
    const { data: userRecord, error: userRecordError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userData.user.id)
      .single()

    if (userRecordError || !userRecord?.id) {
      console.warn('⚠️ User ID not found, skipping content status update')
    } else {
      console.log('🔍 Searching for content with mixpost_post_id:', postUuid, 'type:', typeof postUuid, 'user_id:', userRecord.id)
      
      // Etsi content-rivi jossa mixpost_post_id === postUuid
      const { data: contentRow, error: contentError } = await supabase
        .from('content')
        .select('id, status, mixpost_post_id')
        .eq('user_id', userRecord.id)
        .eq('mixpost_post_id', postUuid)
        .maybeSingle() // Käytetään maybeSingle() jos ei välttämättä löydy

      console.log('🔍 Query result:', { contentRow, contentError })
      console.log('🔍 contentRow mixpost_post_id:', contentRow?.mixpost_post_id, 'type:', typeof contentRow?.mixpost_post_id)

      if (contentError) {
        console.warn('⚠️ Error searching content:', contentError)
      } else if (!contentRow) {
        console.warn('⚠️ Content row not found for mixpost_post_id:', postUuid)
        
        // Debug: Hae kaikki rivit tältä käyttäjältä joilla on mixpost_post_id
        const { data: allRows } = await supabase
          .from('content')
          .select('id, mixpost_post_id')
          .eq('user_id', userRecord.id)
          .not('mixpost_post_id', 'is', null)
          .limit(10)
        
        console.log('📊 Sample of content rows with mixpost_post_id:', allRows)
      } else {
        // Päivitä status takaisin "Under Review"
        const { error: updateError } = await supabase
          .from('content')
          .update({
            status: 'Under Review',
            mixpost_post_id: null, // Nollaa linkitys
            updated_at: new Date().toISOString()
          })
          .eq('id', contentRow.id)

        if (updateError) {
          console.error('❌ Failed to update content status:', updateError)
        } else {
          console.log('✅ Content status updated to "Under Review"')
        }
      }
    }

    return res.status(200).json({ 
      success: true,
      message: 'Postaus poistettu aikataulutuksesta' 
    })

  } catch (error) {
    console.error('❌ Mixpost delete API error:', error)
    return res.status(500).json({ 
      error: 'Postauksen poisto epäonnistui', 
      details: error.message 
    })
  }
}

