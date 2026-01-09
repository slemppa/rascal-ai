import { withOrganization } from '../../middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../../lib/cors.js'

async function handler(req, res) {
  console.log('mixpost-posts API called:', req.method, req.url)
  
  // CORS headers
  setCorsHeaders(res, ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
  
  if (handlePreflight(req, res)) {
    return
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting mixpost-posts fetch...')
    
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client
    if (!req.organization) {
      return res.status(401).json({ error: 'Unauthorized: Organization not found' })
    }
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

    // Kutsu Mixpost API:a paginoiden kaikki postaukset
    const mixpostApiUrl = process.env.MIXPOST_API_URL || 'https://mixpost.mak8r.fi'
    const baseApiUrl = `${mixpostApiUrl}/mixpost/api/${configData.mixpost_workspace_uuid}/posts`
    
    // Hae kaikki postaukset paginoimalla
    let allPosts = []
    let currentPage = 1
    const perPage = 100 // Postauksia per sivu
    let hasMorePages = true
    let totalFetched = 0

    console.log('Starting paginated fetch from Mixpost API...')

    while (hasMorePages) {
      const apiUrl = `${baseApiUrl}?page=${currentPage}&per_page=${perPage}`
      
      console.log(`Fetching Mixpost posts page ${currentPage} (${perPage} per page)...`)
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${configData.mixpost_api_token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Mixpost API error response (page ${currentPage}):`, errorText)
        throw new Error(`Mixpost API error: ${response.status} - ${errorText}`)
      }

      const responseData = await response.json()
      
      // Mixpost palauttaa datan joko { data: [...] } tai paginoituna { data: [...], current_page, last_page, per_page, total }
      let pageData = responseData.data || responseData
      const lastPage = responseData.last_page || responseData.meta?.last_page
      const currentPageNum = responseData.current_page || responseData.meta?.current_page || currentPage
      
      // Tarkista että data on array
      if (!Array.isArray(pageData)) {
        console.error(`Mixpost API returned non-array data on page ${currentPage}:`, pageData)
        // Jos ensimmäinen sivu palauttaa väärän muodon, yritä ilman paginointia
        if (currentPage === 1) {
          console.log('Retrying without pagination parameters...')
          const fallbackResponse = await fetch(baseApiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${configData.mixpost_api_token}`
            }
          })
          
          if (!fallbackResponse.ok) {
            const errorText = await fallbackResponse.text()
            throw new Error(`Mixpost API error: ${fallbackResponse.status} - ${errorText}`)
          }
          
          const fallbackData = await fallbackResponse.json()
          pageData = fallbackData.data || fallbackData
          
          if (!Array.isArray(pageData)) {
            return res.status(500).json({ 
              error: 'Mixpost API palautti väärän muotoisen datan', 
              details: 'Expected array, got: ' + typeof pageData 
            })
          }
          
          // Jos ilman paginointia toimii, käytä sitä
          allPosts = pageData
          hasMorePages = false
          totalFetched = pageData.length
          console.log(`Fetched ${totalFetched} posts without pagination`)
          break
        } else {
          return res.status(500).json({ 
            error: 'Mixpost API palautti väärän muotoisen datan', 
            details: `Expected array on page ${currentPage}, got: ${typeof pageData}` 
          })
        }
      }

      // Lisää tämän sivun postaukset kokonaismäärään
      allPosts = allPosts.concat(pageData)
      totalFetched += pageData.length
      
      console.log(`Fetched ${pageData.length} posts from page ${currentPage} (total: ${totalFetched})`)

      // Tarkista onko enää sivuja
      if (lastPage !== undefined) {
        // Mixpost palauttaa paginointi-metadataa
        hasMorePages = currentPageNum < lastPage
        if (!hasMorePages) {
          console.log(`Reached last page (${lastPage}). Total posts fetched: ${totalFetched}`)
        }
      } else if (pageData.length < perPage) {
        // Jos palautettu määrä on vähemmän kuin per_page, oletetaan että ollaan viimeisellä sivulla
        hasMorePages = false
        console.log(`Received ${pageData.length} posts (less than ${perPage}), assuming last page. Total: ${totalFetched}`)
      } else {
        // Jos ei paginointi-metadataa, jatketaan seuraavalle sivulle
        currentPage++
        // Turvallisuusrajoitus: maksimi 1000 sivua (100k postausta)
        if (currentPage > 1000) {
          console.warn(`Reached maximum page limit (1000). Stopping pagination. Total fetched: ${totalFetched}`)
          hasMorePages = false
        }
      }

      if (hasMorePages) {
        currentPage++
      }
    }

    console.log(`✅ Finished fetching Mixpost posts. Total: ${totalFetched} posts`)
    
    const data = allPosts
    
    // Käsittele kaikki postaukset (scheduled, draft, failed, published)
    const scheduledPosts = data
      .filter(post => ['scheduled', 'draft', 'failed', 'published'].includes(post.status))
      .map(post => {
        const provider = post.accounts?.[0]?.provider || null
        const firstVersion = Array.isArray(post.versions) ? post.versions[0] : null
        const firstContent = firstVersion && Array.isArray(firstVersion.content) ? firstVersion.content[0] : null
        const body = firstContent?.body || ''
        const mediaArray = firstContent && Array.isArray(firstContent.media) ? firstContent.media : []
        const firstMedia = mediaArray[0] || null
        const thumbUrl = firstMedia?.thumb_url || null
        const isVideo = Boolean(firstMedia?.is_video)
        const mediaCount = mediaArray.length

        // Käytä published_at jos julkaistu, muuten scheduled_at
        const dateToUse = post.status === 'published' 
          ? (post.published_at || post.scheduled_at || post.created_at)
          : (post.scheduled_at || post.created_at)
        
        let scheduledDateFi = dateToUse || null
        let publishDateISO = null
        try {
          if (dateToUse) {
            // Mixpost tallentaa UTC-ajan muodossa "YYYY-MM-DD HH:MM:SS"
            // Lisätään Z jotta JavaScript tulkitsee sen UTC:nä
            const utcDateString = (dateToUse || '').replace(' ', 'T') + 'Z'
            const d = new Date(utcDateString)
            scheduledDateFi = new Intl.DateTimeFormat('fi-FI', {
              timeZone: 'Europe/Helsinki',
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit',
              hour12: false
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

        // Hae kanavien nimet
        const channelNames = (post.accounts || [])
          .map(acc => {
            if (acc.name) return acc.name
            if (acc.username) return `@${acc.username}`
            if (acc.provider) return acc.provider.charAt(0).toUpperCase() + acc.provider.slice(1)
            return null
          })
          .filter(Boolean)

        // Proxytä thumbnail URL jos se tulee Mixpostista
        let proxiedThumbnail = thumbUrl || post.media?.[0]?.url || '/placeholder.png'
        if (proxiedThumbnail && proxiedThumbnail.startsWith('https://mixpost.mak8r.fi')) {
          proxiedThumbnail = `/api/mixpost-image-proxy?url=${encodeURIComponent(proxiedThumbnail)}`
        }

        // Destructure id ja uuid pois restistä, jotta ne eivät ylikirjoita meidän arvoja
        const { id: mixpostNumericId, uuid: mixpostUuid, ...restPost } = post

        return {
          // Alkuperäinen Mixpost-data ENSIN (paitsi id ja uuid)
          ...restPost,
          // Sitten ylikirjoitetaan frontend-tarvitsemat kentät
          id: mixpostUuid, // Käytä Mixpost UUID:ta id-kenttänä
          uuid: mixpostUuid, // Mixpost UUID (eksplisiittisesti uuid-kenttään)
          mixpostId: mixpostNumericId, // Mixpost numeerinen ID
          title: body?.slice(0, 80) || (post.status === 'published' ? 'Julkaistu postaus' : 'Aikataulutettu postaus'),
          caption: body || post.content || post.caption || '',
          status: translatedStatus, // Käännä status suomeksi
          source: 'mixpost',
          provider,
          createdAt: post.created_at || null,
          scheduledDate: scheduledDateFi,
          publishDate: publishDateISO, // ISO timestamp kalenteria varten
          thumbnail: proxiedThumbnail, // Käytä proxyttyä URL:ia
          type: (() => {
            // Määritä tyyppi media-tietojen perusteella
            if (mediaCount > 1) {
              return 'Carousel'
            }
            if (isVideo) {
              // Jos video ja Instagram, se on Reels
              if (provider === 'instagram') {
                return 'Reels'
              }
              return 'Video'
            }
            // Jos LinkedIn, se on LinkedIn-tyyppi
            if (provider === 'linkedin') {
              return 'LinkedIn'
            }
            // Oletuksena Photo
            return 'Photo'
          })(),
          channelNames: channelNames
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

export default withOrganization(handler)
