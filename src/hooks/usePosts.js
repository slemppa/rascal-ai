import { useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../utils/userApi'
import { getUserOrgId } from '../lib/getUserOrgId'
import axios from 'axios'
import { POST_STATUS_MAP, MIXPOST_STATUS_MAP } from '../constants/posts'

// Transform Supabase data to Kanban format
const transformSupabaseData = (supabaseData, t) => {
  if (!supabaseData || !Array.isArray(supabaseData)) return []
  
  return supabaseData.map(item => {
    // Muunnetaan Supabase status suomeksi
    let status = POST_STATUS_MAP[item.status] || 'Kesken'
    
    // Jos status on "Done" mutta publish_date on tulevaisuudessa, se on "Ajastettu"
    const now = new Date()
    const publishDate = item.publish_date ? new Date(item.publish_date) : null
    
    if (publishDate && publishDate > now && status === 'Julkaistu') {
      status = 'Aikataulutettu'
    }
    
    // Carousel-tyyppisillä posteilla käytetään segments-taulun ensimmäistä kuvaa
    let thumbnail = null;
    if (item.type === 'Carousel') {
      // Jos item sisältää segments-datan, käytetään sitä
      if (item.segments && item.segments.length > 0) {
        const firstSegment = item.segments.find(seg => seg.slide_no === 1) || item.segments[0];
        thumbnail = firstSegment.media_urls?.[0] || null;
      }
    } else {
      // Muille tyypeille käytetään content-taulun media_urls
      thumbnail = item.media_urls?.[0] || null;
    }
    
    const transformed = {
      id: item.id,
      title: item.idea || item.caption || (t ? t('posts.statuses.untitled') : 'Nimetön'),
      status: status,
      thumbnail: thumbnail,
      caption: item.caption || item.idea || 'Ei kuvausta',
      type: item.type || 'Photo',
      provider: item.provider || null,
      createdAt: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : null,
      scheduledDate: item.publish_date && publishDate > now ? new Date(item.publish_date).toISOString().split('T')[0] : null,
      publishedAt: item.publish_date && publishDate <= now ? new Date(item.publish_date).toISOString().split('T')[0] : null,
      publishDate: item.publish_date ? new Date(item.publish_date).toISOString().slice(0, 16) : null,
      mediaUrls: item.media_urls || [],
      media_urls: item.media_urls || [],
      hashtags: item.hashtags || [],
      voiceover: item.voiceover || '',
      voiceoverReady: item.voiceover_ready || false,
      segments: item.segments || [],
      originalData: {
        ...item,
        media_urls: item.media_urls || []
      },
      source: 'supabase'
    }
    
    return transformed
  })
}

// Transform Reels data to Kanban format
const transformReelsData = (reelsData, t) => {
  if (!reelsData || !Array.isArray(reelsData)) return []
  
  return reelsData.map(item => {
    const status = item.status || 'Kesken'
    
    // Tunnista avatar-kuvat "Type (from Variables) (from Companies)" kentän perusteella
    const isAvatar = Array.isArray(item["Type (from Variables) (from Companies)"]) && 
                    item["Type (from Variables) (from Companies)"].includes("Avatar")
    
    return {
      id: item.id,
      title: item.Idea || item.caption || (t ? t('posts.statuses.untitledReels') : 'Nimetön Reels'),
      status: status,
      thumbnail: item.media_urls?.[0] || null,
      caption: item.caption || 'Ei kuvausta',
      type: isAvatar ? 'Avatar' : 'Reel',
      createdAt: item.createdTime || item.created_at ? new Date(item.createdTime || item.created_at).toISOString().split('T')[0] : null,
      scheduledDate: null,
      publishedAt: null,
      mediaUrls: item.media_urls || [],
      hashtags: item.Hashtags || item.hashtags || [],
      voiceover: item.Voiceover || item.voiceover || '',
      originalData: item,
      source: 'reels'
    }
  })
}

export function usePosts(user, t) {
  // State
  const [posts, setPosts] = useState([])
  const [reelsPosts, setReelsPosts] = useState([])
  const [mixpostPosts, setMixpostPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [reelsLoading, setReelsLoading] = useState(false)
  const [mixpostLoading, setMixpostLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reelsError, setReelsError] = useState(null)
  
  // Social accounts
  const [socialAccounts, setSocialAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  
  // Fetch Posts from Supabase
  const fetchPosts = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)
      
      if (!userId) {
        throw new Error(t ? t('posts.messages.userIdNotFound') : 'Käyttäjää ei löytynyt')
      }
      
      // Haetaan käyttäjän some-sisältö (ei Blog/Newsletter, ei poistettuja)
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', userId)
        .neq('type', 'Blog')
        .neq('type', 'Newsletter')
        .neq('status', 'Deleted')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      // Haetaan kaikki segments-data yhdellä kyselyllä
      const carouselContentIds = data.filter(item => item.type === 'Carousel').map(item => item.id)
      
      let segmentsData = []
      if (carouselContentIds.length > 0) {
        const { data: segments, error: segmentsError } = await supabase
          .from('segments')
          .select('*')
          .in('content_id', carouselContentIds)
          .order('slide_no', { ascending: true })
        
        if (!segmentsError && segments) {
          segmentsData = segments
        }
      }
      
      // Yhdistetään content ja segments data
      const contentWithSegments = data.map(contentItem => {
        if (contentItem.type === 'Carousel') {
          const itemSegments = segmentsData.filter(segment => segment.content_id === contentItem.id)
          return {
            ...contentItem,
            segments: itemSegments
          }
        }
        return contentItem
      })
      
      const transformedData = transformSupabaseData(contentWithSegments, t)
      setPosts(transformedData || [])
      
    } catch (err) {
      console.error('Virhe datan haussa:', err)
      setError(t ? t('posts.messages.dataFetchError') : 'Tietojen haku epäonnistui')
    } finally {
      setLoading(false)
    }
  }, [user, t])
  
  // Fetch Reels Posts
  const fetchReelsPosts = useCallback(async () => {
    if (!user) {
      return
    }
    
    // Aloitetaan tyhjällä datalla
    setReelsPosts([])
    
    try {
      setReelsLoading(true)
      setReelsError(null)
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)
      
      if (!userId) {
        return
      }

      // Hae käyttäjätiedot API:n kautta
      const userData = await getCurrentUser()
      if (!userData?.company_id) {
        return
      }
      const response = await fetch(`/api/social/reels/list?companyId=${userData.company_id}`)
      if (!response.ok) {
        return
      }
      const data = await response.json()
      const transformedData = transformReelsData(data, t)
      setReelsPosts(transformedData)
    } catch (err) {
      console.error('Virhe Reels datan haussa:', err)
    } finally {
      setReelsLoading(false)
    }
  }, [user, t])
  
  // Fetch Mixpost Posts
  const fetchMixpostPosts = useCallback(async () => {
    try {
      setMixpostLoading(true)
      
      // Hae sessio ja token
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      
      if (!token) {
        console.error('No auth token available for Mixpost API')
        setMixpostPosts([])
        return
      }
      
      // Kutsu omaa proxy-endpointtia axiosilla
      const response = await axios.get('/api/integrations/mixpost/posts', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const mixpostPosts = response.data
      
      // Käännä statusit suomeksi varmistukseksi (jos API ei ole tehnyt sitä)
      const translatedPosts = mixpostPosts.map(post => {
        // Poimi media-tiedot versions[0].content[0].media -kentästä
        let thumbnail = null
        let mediaUrls = []
        
        if (post.versions && post.versions.length > 0) {
          const firstVersion = post.versions[0]
          if (firstVersion.content && firstVersion.content.length > 0) {
            const firstContent = firstVersion.content[0]
            if (firstContent.media && firstContent.media.length > 0) {
              // Käytä thumb_url:ia jos saatavilla (videot), muuten url:ia
              const firstMedia = firstContent.media[0]
              thumbnail = firstMedia.thumb_url || firstMedia.url || null
              
              // Kerää kaikki media-URLit
              mediaUrls = firstContent.media.map(media => media.thumb_url || media.url).filter(Boolean)
            }
          }
        }
        
        return {
          ...post,
          status: MIXPOST_STATUS_MAP[post.status] || post.status,
          thumbnail: thumbnail,
          mediaUrls: mediaUrls,
          media_urls: mediaUrls,
          // Säilytetään myös versions-data, jotta se on saatavilla PostCard-komponentissa
          versions: post.versions || []
        }
      })
      
      // Näytä kaikki Mixpost-postaukset (sekä scheduled että published)
      setMixpostPosts(translatedPosts)
      
    } catch (error) {
      console.error('Mixpost fetch error:', error)
      console.error('Error details:', error.response?.status, error.response?.data)
      // Jatka normaalisti ilman Mixpost-postauksia
      setMixpostPosts([])
    } finally {
      setMixpostLoading(false)
    }
  }, [])
  
  // Fetch Social Accounts
  const fetchSocialAccounts = useCallback(async () => {
    if (!user) return
    
    try {
      setLoadingAccounts(true)
      
      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(user.id)
      if (!orgId) {
        console.error('Organisaation ID ei löytynyt')
        setSocialAccounts([])
        return
      }
      
      // Haetaan yhdistetyt sometilit käyttäen organisaation ID:tä
      const { data: accountsData, error: accountsError } = await supabase
        .from('user_social_accounts')
        .select('mixpost_account_uuid, provider, account_name, profile_image_url, username')
        .eq('user_id', orgId) // Käytetään organisaation ID:tä
        .eq('is_authorized', true)
        .order('last_synced_at', { ascending: false })

      if (accountsError) {
        console.error('Error fetching social accounts:', accountsError)
        setSocialAccounts([])
        return
      }
      setSocialAccounts(accountsData || [])
      
    } catch (error) {
      console.error('Error fetching social accounts:', error)
      setSocialAccounts([])
    } finally {
      setLoadingAccounts(false)
    }
  }, [user])
  
  // Computed values
  const allPosts = useMemo(() => {
    return [...posts, ...reelsPosts, ...mixpostPosts]
  }, [posts, reelsPosts, mixpostPosts])
  
  const currentLoading = loading || reelsLoading || mixpostLoading
  const currentError = error || reelsError
  
  return {
    // Data
    posts,
    reelsPosts,
    mixpostPosts,
    allPosts,
    socialAccounts,
    
    // Loading states
    loading,
    reelsLoading,
    mixpostLoading,
    loadingAccounts,
    currentLoading,
    
    // Errors
    error,
    reelsError,
    currentError,
    
    // Fetch functions
    fetchPosts,
    fetchReelsPosts,
    fetchMixpostPosts,
    fetchSocialAccounts,
    
    // Setters (for updates)
    setPosts,
    setReelsPosts,
    setMixpostPosts,
    
    // Transform functions (if needed elsewhere)
    transformSupabaseData: useCallback((data) => transformSupabaseData(data, t), [t]),
    transformReelsData: useCallback((data) => transformReelsData(data, t), [t])
  }
}


