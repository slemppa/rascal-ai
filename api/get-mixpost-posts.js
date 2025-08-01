import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ 
        error: 'Missing required field: user_id' 
      })
    }

    // Luo Supabase-yhteys suoraan backendissä
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Haetaan Mixpost konfiguraatio Supabase:sta
    let mixpostConfig = null

    try {
      // Haetaan Mixpost konfiguraatio - käytetään auth_user_id:tä
      const { data: configData, error: configError } = await supabase
        .from('user_mixpost_config')
        .select('mixpost_workspace_uuid, mixpost_api_token')
        .eq('auth_user_id', user_id)
        .single()

      if (configError) {
        console.error('Error fetching mixpost config:', configError)
        return res.status(400).json({ 
          error: 'Mixpost konfiguraatio ei löytynyt',
          details: configError.message
        })
      }

      mixpostConfig = configData

    } catch (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ 
        error: 'Supabase virhe',
        details: error.message
      })
    }

    // Haetaan postaukset Mixpostin API:sta
    const mixpostApiUrl = `https://mixpost.mak8r.fi/mixpost/api/${mixpostConfig.mixpost_workspace_uuid}/posts`
    
    try {
      const response = await fetch(mixpostApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mixpostConfig.mixpost_api_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Mixpost API response:', response.status, response.statusText)
        throw new Error(`Mixpost API failed: ${response.status} - ${response.statusText}`)
      }

      const mixpostData = await response.json()

      // Muunnetaan Mixpost data sovelluksen muotoon
      const transformedPosts = mixpostData.data
        .filter(post => post.status === 'published' && !post.trashed)
        .map(post => {
          // Haetaan ensimmäinen versio ja sen sisältö
          const firstVersion = post.versions?.[0]
          const firstContent = firstVersion?.content?.[0]
          
          // Haetaan media URL:t
          const mediaUrls = firstContent?.media?.map(media => media.url) || []
          const thumbnailUrl = firstContent?.media?.[0]?.thumb_url || mediaUrls[0] || null
          
          // Haetaan tagit
          const tags = post.tags?.map(tag => tag.name) || []
          
          // Haetaan somekanavat
          const accounts = post.accounts?.map(account => ({
            name: account.name,
            username: account.username,
            provider: account.provider,
            external_url: account.external_url
          })) || []

          return {
            id: post.id,
            uuid: post.uuid,
            title: firstContent?.body?.replace(/<[^>]*>/g, '').slice(0, 100) || 'Nimetön julkaisu',
            caption: firstContent?.body?.replace(/<[^>]*>/g, '') || '',
            media_urls: mediaUrls,
            thumbnail: thumbnailUrl,
            status: 'Julkaistu',
            source: 'mixpost',
            type: firstContent?.media?.[0]?.is_video ? 'Video' : 'Photo',
            published_at: post.published_at,
            created_at: post.created_at,
            scheduled_at: post.scheduled_at,
            tags: tags,
            accounts: accounts,
            external_urls: accounts.map(acc => acc.external_url).filter(Boolean)
          }
        })

      return res.status(200).json({
        success: true,
        data: transformedPosts,
        meta: mixpostData.meta
      })

    } catch (error) {
      console.error('Mixpost API error:', error)
      return res.status(500).json({
        success: false,
        error: 'Mixpost API virhe',
        details: error.message
      })
    }

  } catch (error) {
    console.error('General error:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
} 