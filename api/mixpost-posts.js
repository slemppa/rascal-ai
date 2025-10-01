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
    const apiUrl = `${mixpostApiUrl}/mixpost/api/${configData.mixpost_workspace_uuid}/posts`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${configData.mixpost_api_token}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mixpost API error response:', errorText)
      throw new Error(`Mixpost API error: ${response.status} - ${errorText}`)
    }

    const responseData = await response.json()
    
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
    
    // Käsittele kaikki postaukset (scheduled, draft, failed, published)
    const scheduledPosts = data
      .filter(post => ['scheduled', 'draft', 'failed', 'published'].includes(post.status))
      .map(post => {
        const provider = post.accounts?.[0]?.provider || null
        const firstVersion = Array.isArray(post.versions) ? post.versions[0] : null
        const firstContent = firstVersion && Array.isArray(firstVersion.content) ? firstVersion.content[0] : null
        const body = firstContent?.body || ''
        const firstMedia = firstContent && Array.isArray(firstContent.media) ? firstContent.media[0] : null
        const thumbUrl = firstMedia?.thumb_url || null
        const isVideo = Boolean(firstMedia?.is_video)

        // Käytä published_at jos julkaistu, muuten scheduled_at
        const dateToUse = post.status === 'published' 
          ? (post.published_at || post.scheduled_at || post.created_at)
          : (post.scheduled_at || post.created_at)
        
        let scheduledDateFi = dateToUse || null
        let publishDateISO = null
        try {
          if (dateToUse) {
            const d = new Date((dateToUse || '').replace(' ', 'T'))
            scheduledDateFi = new Intl.DateTimeFormat('fi-FI', {
              timeZone: 'Europe/Helsinki',
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit'
            }).format(d)
            publishDateISO = d.toISOString() // ISO muoto kalenteria varten
          }
        } catch {}

        // Käännä status suomeksi
        const statusMap = {
          'published': 'Julkaistu',
          'scheduled': 'Aikataulutettu',
          'draft': 'Luonnos',
          'failed': 'Epäonnistui'
        }
        
        const translatedStatus = statusMap[post.status] || post.status

        return {
          id: post.id,
          title: body?.slice(0, 80) || (post.status === 'published' ? 'Julkaistu postaus' : 'Aikataulutettu postaus'),
          caption: body || post.content || post.caption || '',
          status: translatedStatus, // Käännä status suomeksi
          source: 'mixpost',
          provider,
          createdAt: post.created_at || null,
          scheduledDate: scheduledDateFi,
          publishDate: publishDateISO, // ISO timestamp kalenteria varten
          thumbnail: thumbUrl || post.media?.[0]?.url || '/placeholder.png',
          type: isVideo ? 'Video' : 'Photo'
        }
      })

    return res.status(200).json(scheduledPosts)

  } catch (error) {
    console.error('Mixpost posts API error:', error)
    return res.status(500).json({ 
      error: 'Mixpost postausten haku epäonnistui', 
      details: error.message 
    })
  }
}
