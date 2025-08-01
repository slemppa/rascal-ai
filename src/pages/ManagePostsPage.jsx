import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'
import './ManagePostsPage.css'

// Dummy data
const initialPosts = [
  {
    id: 1,
    title: 'Miten rakentaa menestyksekäs sosiaalisen median strategia',
    status: 'Kesken',
    thumbnail: '/placeholder.png',
    caption: 'Opi tärkeimmät vaiheet tehokkaan sosiaalisen median strategian luomiseen.',
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    title: '10 vinkkiä parempaan sisältömarkkinointiin',
    status: 'Valmis',
    thumbnail: '/placeholder.png',
    caption: 'Löydä todistetut strategiat sisältömarkkinoinnin parantamiseen.',
    createdAt: '2024-01-16'
  },
  {
    id: 3,
    title: 'Digitaalisen markkinoinnin tulevaisuus 2024',
    status: 'Ajastettu',
    thumbnail: '/placeholder.png',
    caption: 'Tutustu uusimpiin trendeihin ja teknologioihin.',
    scheduledDate: '2024-01-20'
  },
  {
    id: 4,
    title: 'Bränditietoisuuden rakentaminen sosiaalisessa mediassa',
    status: 'Julkaistu',
    thumbnail: '/placeholder.png',
    caption: 'Tehokkaat strategiat brändin näkyvyyden lisäämiseen.',
    publishedAt: '2024-01-10'
  }
]

const columns = [
  { status: 'Kesken', title: 'Avatar', color: '#fef3c7' },
  { status: 'KeskenSupabase', title: 'Kesken', color: '#fef3c7' },
  { status: 'Tarkistuksessa', title: 'Valmiina julkaisuun', color: '#dbeafe' },
  { status: 'Aikataulutettu', title: 'Aikataulutettu', color: '#fce7f3' }
]

const publishedColumn = { status: 'Julkaistu', title: 'Julkaistu', color: '#dcfce7' }

// Data muunnos funktio Supabase datasta Kanban muotoon
const transformSupabaseData = (supabaseData) => {
  if (!supabaseData || !Array.isArray(supabaseData)) return []
  
  return supabaseData.map(item => {
    // Muunnetaan Supabase status suomeksi
    const statusMap = {
      'Draft': 'Kesken',
      'In Progress': 'Kesken', 
      'Under Review': 'Tarkistuksessa',
      'Scheduled': 'Aikataulutettu',
      'Done': 'Tarkistuksessa',
      'Published': 'Julkaistu',
      'Deleted': 'Poistettu'
    }
    
    let status = statusMap[item.status] || 'Kesken'
    

    
    // Jos status on "Done" mutta publish_date on tulevaisuudessa, se on "Ajastettu"
    const now = new Date()
    const publishDate = item.publish_date ? new Date(item.publish_date) : null
    
    if (publishDate && publishDate > now && status === 'Julkaistu') {
      status = 'Aikataulutettu'
    }
    
    // Carousel-tyyppisillä posteilla käytetään segments-taulun ensimmäistä kuvaa
    let thumbnail = '/media-placeholder.svg';
    if (item.type === 'Carousel') {
      // Jos item sisältää segments-datan, käytetään sitä
      if (item.segments && item.segments.length > 0) {
        const firstSegment = item.segments.find(seg => seg.slide_no === 1) || item.segments[0];
        thumbnail = firstSegment.media_urls?.[0] || '/media-placeholder.svg';
      }
    } else {
      // Muille tyypeille käytetään content-taulun media_urls
      thumbnail = item.media_urls?.[0] || '/media-placeholder.svg';
    }
    

    
    return {
      id: item.id,
      title: item.idea || item.caption || 'Nimetön julkaisu',
      status: status,
      thumbnail: thumbnail,
      caption: item.caption || item.idea || 'Ei kuvausta',
      type: item.type || 'Photo',
      createdAt: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : null,
      scheduledDate: item.publish_date && publishDate > now ? new Date(item.publish_date).toISOString().split('T')[0] : null,
      publishedAt: item.publish_date && publishDate <= now ? new Date(item.publish_date).toISOString().split('T')[0] : null,
      publishDate: item.publish_date ? new Date(item.publish_date).toISOString().slice(0, 16) : null,
      mediaUrls: item.media_urls || [],
      hashtags: item.hashtags || [],
      voiceover: item.voiceover || '',
      voiceoverReady: item.voiceover_ready || false,
      originalData: item, // Säilytetään alkuperäinen data
      source: 'supabase'
    }
  })
}

// Transform Reels data to Kanban format
const transformReelsData = (reelsData) => {
  if (!reelsData || !Array.isArray(reelsData)) return []
  return reelsData.map(item => {
    const status = item.status || 'Kesken' // Status is forced to 'Kesken' by the API
    return {
      id: item.id,
      title: item.title || 'Nimetön Reels',
      status: status,
      thumbnail: item.media_urls?.[0] || '/media-placeholder.svg',
      caption: item.caption || 'Ei kuvausta',
      type: 'Reels',
      createdAt: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : null,
      scheduledDate: null,
      publishedAt: null,
      mediaUrls: item.media_urls || [],
      hashtags: item.hashtags || [],
      voiceover: item.voiceover || '',
      originalData: item,
      source: 'reels'
    }
  })
}

function PostCard({ post, onEdit, onDelete, onPublish, onSchedule, onMoveToNext }) {
  return (
    <div className="post-card">
      <div className="post-card-content">
        <div className="post-thumbnail">
          {post.thumbnail && post.thumbnail !== '/placeholder.png' && post.thumbnail !== '/media-placeholder.svg' ? (
            <img
              src={post.thumbnail}
              alt="thumbnail"
              loading="lazy"
              decoding="async"
              onLoad={(e) => {
                e.target.style.opacity = '1'
              }}
              onError={(e) => {
                e.target.src = '/media-placeholder.svg';
              }}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                opacity: 0,
                transition: 'opacity 0.3s ease'
              }}
            />
          ) : (
            <div className="placeholder-content">
              <img 
                src="/media-placeholder.svg" 
                alt="Media ei saatavilla"
                className="placeholder-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="placeholder-fallback" style={{ display: 'none' }}>
                <div className="placeholder-icon">📸</div>
                <div className="placeholder-text">Ei kuvaa</div>
              </div>
            </div>
          )}
        </div>
                  <div className="post-info">
            <div className="post-header">
              <h3 className="post-title">
                {post.title.length > 50 ? post.title.slice(0, 50) + '…' : post.title}
              </h3>
              <div className="post-badges">
                <span className="post-type">
                  {post.type === 'Carousel' ? '🎠 Carousel' : 
                   post.type === 'Reels' ? '🎬 Reels' : 
                   post.type === 'Blog' ? '📝 Blog' : 
                   post.type === 'Newsletter' ? '📧 Newsletter' : 
                   post.type}
                </span>
                <span className={`post-source ${post.source}`}>{post.source}</span>
          </div>
          </div>
            <p className="post-caption" style={{ minHeight: '3.6em', contain: 'layout style' }}>
              {post.caption}
            </p>
          <div className="post-footer">
            <span className="post-date">
              {post.source === 'mixpost' ? (
                post.published_at ? `📅 ${new Date(post.published_at).toLocaleDateString('fi-FI')}` : 
                post.created_at ? `📅 ${new Date(post.created_at).toLocaleDateString('fi-FI')}` : 
                '📅 Julkaistu'
              ) : (
                post.scheduledDate ? `📅 ${post.scheduledDate}` : post.createdAt || post.publishedAt
              )}
            </span>
            <div className="post-actions">
              {/* Mixpostin postauksille näytetään eri toiminnot */}
              {post.source === 'mixpost' ? (
                <>
                  {post.external_urls && post.external_urls.length > 0 && (
                    <Button 
                      variant="secondary" 
                      onClick={() => window.open(post.external_urls[0], '_blank')}
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                    >
                      🔗 Katso
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    style={{ fontSize: '11px', padding: '6px 10px', opacity: 0.5, cursor: 'not-allowed' }}
                    disabled
                  >
                    ✏️ Muokkaa
                  </Button>
                </>
              ) : (
                <Button 
                  variant="secondary" 
                  onClick={() => onEdit(post)}
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                >
                  ✏️ Muokkaa
                </Button>
              )}
              
              {/* Siirtymispainikkeet */}
              {post.status === 'Kesken' && post.source === 'supabase' && (
                <Button
                  variant="primary"
                  onClick={() => onMoveToNext(post, 'Tarkistuksessa')}
                  style={{ 
                    backgroundColor: '#3b82f6', 
                    fontSize: '11px', 
                    padding: '6px 10px' 
                  }}
                >
                  ➡️ Valmiina julkaisuun
                </Button>
              )}
              
              {/* Julkaisu-nappi vain jos status on "Valmiina julkaisuun" (Tarkistuksessa) */}
              {post.status === 'Tarkistuksessa' && (
                <Button
                  variant="primary"
                  onClick={() => onPublish(post)}
                  style={{ 
                    backgroundColor: '#22c55e', 
                    fontSize: '11px', 
                    padding: '6px 10px' 
                  }}
                >
                  📤 Julkaise
                </Button>
              )}
              
              {/* Mixpostin postauksille ei näytetä poisto-nappia */}
              {post.source !== 'mixpost' && (
                <Button 
                  variant="danger" 
                  onClick={() => onDelete(post)}
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                >
                  🗑️ Poista
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ManagePostsPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reelsPosts, setReelsPosts] = useState([])
  const [reelsLoading, setReelsLoading] = useState(false)
  const [reelsError, setReelsError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [publishingPost, setPublishingPost] = useState(null)
  const [socialAccounts, setSocialAccounts] = useState([])
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [mixpostPosts, setMixpostPosts] = useState([])
  const [mixpostLoading, setMixpostLoading] = useState(false)
  const [mixpostError, setMixpostError] = useState(null)
  const hasInitialized = useRef(false)

  // Data haku Supabasesta
  const fetchPosts = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Haetaan käyttäjän user_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }
      
      // Haetaan käyttäjän some-sisältö (ei Blog/Newsletter)
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', userData.id)
        .neq('type', 'Blog')
        .neq('type', 'Newsletter')
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
      

      
      const transformedData = transformSupabaseData(contentWithSegments)

      setPosts(transformedData || [])
      
    } catch (err) {
      console.error('Virhe datan haussa:', err)
      setError('Datan haku epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user || hasInitialized.current) return
    
    hasInitialized.current = true
    fetchPosts()
    fetchReelsPosts() // Haetaan reels data automaattisesti
    fetchSocialAccounts() // Haetaan somekanavat
    fetchMixpostPosts() // Haetaan Mixpostin julkaistut postaukset
  }, [user])

  // Hae Mixpostin julkaistut postaukset
  const fetchMixpostPosts = async () => {
    if (!user) return
    
    try {
      setMixpostLoading(true)
      setMixpostError(null)
      
      // Haetaan käyttäjän user_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }
      
      const response = await fetch(`/api/get-mixpost-posts?user_id=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Mixpost postausten haku epäonnistui')
      }

      const result = await response.json()
      
      if (result.success) {
        setMixpostPosts(result.data || [])
      } else {
        throw new Error(result.error || 'Mixpost postausten haku epäonnistui')
      }
      
    } catch (error) {
      console.error('Error fetching Mixpost posts:', error)
      setMixpostError(error.message)
      setMixpostPosts([])
    } finally {
      setMixpostLoading(false)
    }
  }

  // Hae somekanavat Supabasesta
  const fetchSocialAccounts = async () => {
    if (!user) return
    
    console.log('Fetching social accounts for user:', user.id)
    
    try {
      setLoadingAccounts(true)
      
      // Haetaan käyttäjän user_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }
      
      // Haetaan yhdistetyt sometilit - käytetään auth_user_id:tä
      const { data: accountsData, error: accountsError } = await supabase
        .from('user_social_accounts')
        .select('mixpost_account_uuid, provider, account_name, profile_image_url')
        .eq('user_id', user.id) // Käytetään auth_user_id:tä suoraan
        .eq('is_authorized', true)
        .order('last_synced_at', { ascending: false })

      if (accountsError) {
        console.error('Error fetching social accounts:', accountsError)
        setSocialAccounts([])
        return
      }

      console.log('Found social accounts:', accountsData)
      setSocialAccounts(accountsData || [])
      
    } catch (error) {
      console.error('Error fetching social accounts:', error)
      setSocialAccounts([])
    } finally {
      setLoadingAccounts(false)
    }
  }

  // Debounced search for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reels data haku
  const fetchReelsPosts = async () => {
    if (!user) {
      return
    }
    
    // Asetetaan heti dummy dataa näkyviin
    const dummyData = [
      {
        id: 'reels-1',
        title: 'Ladataan Reels dataa...',
        caption: 'Haetaan dataa Airtablesta...',
        media_urls: ['/placeholder.png'],
        status: 'Kesken',
        created_at: new Date().toISOString(),
        hashtags: ['#ladataan'],
        voiceover: 'Ladataan...',
        source: 'reels'
      }
    ]
    setReelsPosts(dummyData)
    
    try {
      setReelsLoading(true)
      setReelsError(null)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('auth_user_id', user.id)
        .single()
      if (userError || !userData?.company_id) {
        return
      }
      const response = await fetch(`/api/get-reels?companyId=${userData.company_id}`)
      if (!response.ok) {
        return
      }
      const data = await response.json()
      const transformedData = transformReelsData(data)
      setReelsPosts(transformedData)
    } catch (err) {
      console.error('Virhe Reels datan haussa:', err)
      // Pidetään dummy data näkyvissä virheen sattuessa
    } finally {
      setReelsLoading(false)
    }
  }



  // Transform Reels data to Kanban format
  const transformReelsData = (reelsData) => {
    if (!reelsData || !Array.isArray(reelsData)) return []
    return reelsData.map(item => {
      const status = item.status || 'Kesken' // Status is forced to 'Kesken' by the API
      const transformed = {
        id: item.id,
        title: item.title || 'Nimetön Reels', // Boldattu otsikko = Title kenttä
        status: status,
        thumbnail: item.media_urls?.[0] || '/placeholder.png',
        caption: item.caption || 'Ei kuvausta', // Leipäteksti = Caption kenttä
        type: 'Reels',
        createdAt: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : null,
        scheduledDate: null,
        publishedAt: null,
        mediaUrls: item.media_urls || [],
        hashtags: item.hashtags || [],
        voiceover: item.voiceover || '',
        originalData: item,
        source: 'reels'
      }

      return transformed
    })
  }

  // Yhdistetään data
  const allPosts = [...posts, ...reelsPosts]
  const currentPosts = allPosts
  const currentLoading = loading || reelsLoading
  const currentError = error || reelsError

  // Filtteröidään postit
  const filteredPosts = currentPosts.filter(post => {
        const matchesSearch = (post.title?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
                         (post.caption?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase())
    const matchesStatus = statusFilter === '' || post.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreatePost = async (postData) => {
    try {
      // Haetaan käyttäjän user_id ja company_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, company_id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      // Lähetetään idea-generation kutsu N8N:lle
      try {
        console.log('Sending idea generation request:', {
          idea: postData.title,
          type: postData.type,
          companyId: userData.company_id
        })
        console.log('Company ID type:', typeof userData.company_id)
        console.log('Company ID value:', userData.company_id)

        const response = await fetch('/api/idea-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idea: postData.title,
            type: postData.type,
            companyId: userData.company_id
          })
        })

        if (!response.ok) {
          console.error('Idea generation failed:', response.status)
          // Jatketaan silti postauksen luomista
        } else {
          const result = await response.json()
          console.log('Idea generation success:', result)
        }
      } catch (webhookError) {
        console.error('Idea generation webhook error:', webhookError)
        // Jatketaan silti postauksen luomista
      }

      setShowCreateModal(false)
      alert('Idea lähetetty AI:lle! Some-sisältö generoidaan taustalla.')
      
    } catch (error) {
      console.error('Virhe uuden julkaisun luomisessa:', error)
      alert('Virhe: Ei voitu luoda some-sisältöä. Yritä uudelleen.')
    }
  }

  const handleEditPost = async (post) => {
    
    // Jos kyseessä on Carousel-tyyppi, haetaan segments data
    if (post.type === 'Carousel' && post.source === 'supabase') {
      try {
        const { data: segmentsData, error: segmentsError } = await supabase
          .from('segments')
          .select('*')
          .eq('content_id', post.id)
          .order('slide_no', { ascending: true })
        
        if (segmentsError) {
          console.error('Virhe segments datan haussa:', segmentsError)
        } else {
          console.log('Segments data haettu:', segmentsData)
          // Lisätään segments data post-objektiin
          const postWithSegments = {
            ...post,
            segments: segmentsData || []
          }
          setEditingPost(postWithSegments)
          setShowEditModal(true)
          return
        }
      } catch (error) {
        console.error('Virhe segments datan haussa:', error)
      }
    }
    
    // Varmistetaan että originalData on mukana
    const postWithOriginalData = {
      ...post,
      originalData: post.originalData || post // Fallback jos originalData puuttuu
    }
    
    setEditingPost(postWithOriginalData)
    setShowEditModal(true)
  }

  const handleSaveEdit = async (updatedData) => {
    if (editingPost) {
      // Käsittele julkaisupäivä
      let processedUpdatedData = { ...updatedData }
      
      if (updatedData.publishDate && updatedData.publishDate.trim() !== '') {
        // Jos on päivä & aika, päivitä scheduledDate
        const dateTime = new Date(updatedData.publishDate)
        processedUpdatedData.scheduledDate = dateTime.toISOString().split('T')[0] // YYYY-MM-DD
      } else {
        // Jos tyhjä, aseta null
        processedUpdatedData.scheduledDate = null
      }
      
      // Päivitä paikallinen tila
      setPosts(prev => prev.map(post => 
        post.id === editingPost.id 
          ? { ...post, ...processedUpdatedData }
          : post
      ))
      
      // Päivitä myös reelsPosts jos kyseessä on reels
      if (editingPost.source === 'reels') {
        setReelsPosts(prev => prev.map(post => 
          post.id === editingPost.id 
            ? { ...post, ...processedUpdatedData }
            : post
        ))
      }

                 // Jos voiceover on merkitty valmiiksi, kyseessä on reels-postaus JA se on "Kesken" sarakkeessa, lähetä webhook
           if (updatedData.voiceoverReady && (editingPost.source === 'reels' || editingPost.type === 'Reels') && (editingPost.status === 'Kesken' || editingPost.source === 'reels')) {
             try {
               console.log('Voiceover marked as ready, sending webhook...')

               // Haetaan company_id käyttäjälle
               const { data: userData, error: userError } = await supabase
                 .from('users')
                 .select('company_id')
                 .eq('auth_user_id', user.id)
                 .single()

               if (userError || !userData?.company_id) {
                 console.error('Could not fetch company_id:', userError)
                 alert('Virhe: Ei voitu hakea yritystietoja. Yritä uudelleen.')
                 return
               }

               console.log('Sending data:', {
                 recordId: editingPost.id,
                 voiceover: updatedData.voiceover,
                 voiceoverReady: updatedData.voiceoverReady,
                 companyId: userData.company_id
               })

               const response = await fetch('/api/voiceover-ready', {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({
                   recordId: editingPost.id,
                   voiceover: updatedData.voiceover,
                   voiceoverReady: updatedData.voiceoverReady,
                   companyId: userData.company_id
                 })
               })

          if (!response.ok) {
            console.error('Voiceover webhook failed:', response.status)
            // Näytä käyttäjälle virheviesti
            alert('Virhe voiceover-tilan päivityksessä. Yritä uudelleen.')
            return
          }

          const result = await response.json()
          console.log('Voiceover webhook success:', result)
          
          // Näytä käyttäjälle onnistumisviesti
          alert('Voiceover merkitty valmiiksi! Automaatio jatkaa eteenpäin.')
          
        } catch (error) {
          console.error('Voiceover webhook error:', error)
          alert('Virhe voiceover-tilan päivityksessä. Yritä uudelleen.')
          return
        }
      }

      // Päivitä Supabase kaikille postauksille
      try {
        console.log('Updating Supabase post:', editingPost.id, updatedData)

        // Haetaan käyttäjän user_id users taulusta
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (userError || !userData?.id) {
          console.error('Could not fetch user_id:', userError)
          // Jatketaan silti paikallisen tilan päivitystä
        } else {
                      // Päivitetään Supabase
            const { error: updateError } = await supabase
              .from('content')
              .update({
                caption: processedUpdatedData.caption || null,
                publish_date: processedUpdatedData.publishDate || null,
                updated_at: new Date().toISOString()
              })
              .eq('id', editingPost.id)
              .eq('user_id', userData.id)

          if (updateError) {
            console.error('Supabase update error:', updateError)
            // Jatketaan silti paikallisen tilan päivitystä
          } else {
            console.log('Supabase updated successfully')
          }
        }
      } catch (error) {
        console.error('Error updating Supabase:', error)
        // Jatketaan silti paikallisen tilan päivitystä
      }
      
      // Päivitetään data palvelimelta varmistaaksemme synkronointi
      try {
        await fetchPosts()
        if (editingPost.source === 'reels') {
          await fetchReelsPosts()
        }
      } catch (error) {
        console.error('Error refreshing data:', error)
        // Jatketaan silti modaalin sulkemista
      }
      
      setShowEditModal(false)
      setEditingPost(null)
    }
  }

  const handleDeletePost = async (post) => {
    if (window.confirm('Oletko varma, että haluat poistaa tämän some-sisällön?')) {
      try {
        // Haetaan käyttäjän data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (userError || !userData?.id) {
          throw new Error('Käyttäjän ID ei löytynyt')
        }

        // Haetaan Mixpost konfiguraatio
        const { data: mixpostConfig, error: mixpostError } = await supabase
          .from('user_mixpost_config')
          .select('mixpost_workspace_uuid, mixpost_api_token')
          .eq('user_id', userData.id)
          .single()

        if (mixpostError || !mixpostConfig) {
          throw new Error('Mixpost konfiguraatio ei löytynyt')
        }

        // Haetaan yhdistetyt sometilit
        const { data: socialAccounts, error: socialError } = await supabase
          .from('user_social_accounts')
          .select('mixpost_account_uuid, provider, account_name')
          .eq('user_id', userData.id)
          .eq('is_authorized', true)

        if (socialError) {
          throw new Error('Sometilien haku epäonnistui')
        }

        if (!socialAccounts || socialAccounts.length === 0) {
          throw new Error('Ei yhdistettyjä sometilejä')
        }

        // Käytetään ensimmäistä yhdistettyä tiliä
        const accountId = socialAccounts[0].mixpost_account_uuid

        // Lähetetään delete-kutsu N8N:iin
        const deleteData = {
          post_id: post.id,
          user_id: userData.id,
          auth_user_id: user.id,
          content: post.caption || post.title,
          media_urls: post.mediaUrls || [],
          action: 'delete',
          workspace_uuid: mixpostConfig.mixpost_workspace_uuid,
          account_id: accountId
        }

        const response = await fetch('/api/post-actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(deleteData)
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Poisto epäonnistui')
        }

        // Päivitetään UI
        await fetchPosts()
        if (post.source === 'reels') {
          await fetchReelsPosts()
        }

        alert(result.message || 'Some-sisältö poistettu onnistuneesti!')
        
      } catch (error) {
        console.error('Delete error:', error)
        alert('Some-sisällön poisto epäonnistui: ' + error.message)
      }
    }
  }

  const handleSchedulePost = async (post) => {
    try {
      // Kysytään ajastuspäivä käyttäjältä
      const scheduledDate = prompt('Syötä ajastuspäivä (YYYY-MM-DD HH:MM):', 
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16))

      if (!scheduledDate) {
        return // Käyttäjä perui
      }

      // Lähetetään data backend:iin, joka hoitaa Supabase-kyselyt
      const scheduleData = {
        post_id: post.id,
        user_id: user.id,
        auth_user_id: user.id,
        content: post.caption || post.title,
        media_urls: post.mediaUrls || [],
        scheduled_date: scheduledDate,
        action: 'schedule'
      }

              const response = await fetch('/api/post-actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify(scheduleData)
        })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ajastus epäonnistui')
      }

      // Päivitetään UI
      await fetchPosts()
      if (post.source === 'reels') {
        await fetchReelsPosts()
      }

      alert(result.message || 'Some-sisällön ajastus onnistui!')
      setShowEditModal(false)
      setEditingPost(null)
      
    } catch (error) {
      console.error('Schedule error:', error)
      alert('Some-sisällön ajastus epäonnistui: ' + error.message)
    }
  }

  const handlePublishPost = async (post) => {
    // Aseta julkaistava post ja avaa modaali
    setPublishingPost(post)
    setSelectedAccounts([]) // Tyhjennä aiemmat valinnat
    setShowPublishModal(true)
  }

  const handleConfirmPublish = async () => {
    if (!publishingPost || selectedAccounts.length === 0) {
      alert('Valitse vähintään yksi somekanava julkaisua varten')
      return
    }

    try {
      // Haetaan media-data suoraan Supabase:sta
      let mediaUrls = []
      let segments = []
      let mixpostConfig = null
      
      if (publishingPost.source === 'supabase') {
        // Haetaan käyttäjän user_id users taulusta
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (userError || !userData?.id) {
          throw new Error('Käyttäjän ID ei löytynyt')
        }

        // Haetaan Mixpost config data
        const { data: mixpostConfig, error: mixpostError } = await supabase
          .from('user_mixpost_config')
          .select('mixpost_api_token, mixpost_workspace_uuid')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (mixpostError) {
          console.error('Error fetching Mixpost config:', mixpostError)
        }

        // Haetaan content data
        const { data: contentData, error: contentError } = await supabase
          .from('content')
          .select('*')
          .eq('id', publishingPost.id)
          .eq('user_id', userData.id)
          .single()

        if (contentError) {
          console.error('Error fetching content:', contentError)
        } else {
          mediaUrls = contentData.media_urls || []
          
          // Jos Carousel, haetaan segments data
          if (publishingPost.type === 'Carousel') {
            const { data: segmentsData, error: segmentsError } = await supabase
              .from('segments')
              .select('*')
              .eq('content_id', publishingPost.id)
              .order('slide_no', { ascending: true })
            
            if (!segmentsError && segmentsData) {
              segments = segmentsData
              // Kerätään kaikki media_urls segments-taulusta
              mediaUrls = segmentsData
                .filter(segment => segment.media_urls && segment.media_urls.length > 0)
                .flatMap(segment => segment.media_urls)
            }
          }
        }
      } else {
        // Reels data
        mediaUrls = publishingPost.mediaUrls || []
      }
      
      // Lähetetään data backend:iin, joka hoitaa Supabase-kyselyt
      const publishData = {
        post_id: publishingPost.id,
        user_id: user.id,
        auth_user_id: user.id,
        content: publishingPost.caption || publishingPost.title,
        media_urls: mediaUrls,
        scheduled_date: publishingPost.scheduledDate || null,
        publish_date: publishingPost.publishDate || null, // Lisätään alkuperäinen publishDate
        post_type: publishingPost.type === 'Reels' ? 'reel' : publishingPost.type === 'Carousel' ? 'carousel' : 'post',
        action: 'publish',
        selected_accounts: selectedAccounts // Lisätään valitut somekanavat
      }
      
      // Lisää Mixpost config data jos saatavilla
      if (mixpostConfig) {
        publishData.mixpost_api_token = mixpostConfig.mixpost_api_token
        publishData.mixpost_workspace_uuid = mixpostConfig.mixpost_workspace_uuid
      }
      
      // Lisää segments-data Carousel-tyyppisillä postauksilla
      if (publishingPost.type === 'Carousel' && segments.length > 0) {
        publishData.segments = segments
      }
      
      const response = await fetch('/api/post-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(publishData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Julkaisu epäonnistui')
      }

      // Päivitetään UI
      await fetchPosts()
      if (publishingPost.source === 'reels') {
        await fetchReelsPosts()
      }

      alert(result.message || 'Some-sisällön julkaisu onnistui!')
      setShowPublishModal(false)
      setPublishingPost(null)
      setSelectedAccounts([])
      
    } catch (error) {
      console.error('Publish error:', error)
      alert('Some-sisällön julkaisu epäonnistui: ' + error.message)
    }
  }

  const handleMoveToNext = async (post, newStatus) => {
    try {
      // Varmistetaan että kyseessä on Supabase-postaus
      if (post.source !== 'supabase') {
        alert('Siirtyminen on mahdollista vain Supabase-postauksille')
        return
      }

      // Haetaan käyttäjän user_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      // Määritellään status-mappaus
      const statusMap = {
        'Tarkistuksessa': 'Under Review',
        'Aikataulutettu': 'Scheduled'
      }

      const supabaseStatus = statusMap[newStatus]
      if (!supabaseStatus) {
        throw new Error('Virheellinen status')
      }

      // Päivitetään Supabase
      const { error: updateError } = await supabase
        .from('content')
        .update({
          status: supabaseStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .eq('user_id', userData.id)

      if (updateError) {
        throw new Error('Supabase-päivitys epäonnistui')
      }

      // Päivitetään UI
      await fetchPosts()
      
      alert(`Postaus siirretty sarakkeeseen: ${newStatus}`)
      
    } catch (error) {
      console.error('Move to next error:', error)
      alert('Siirtyminen epäonnistui: ' + error.message)
    }
  }

  // ESC-näppäimellä sulkeutuminen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showEditModal) {
          setShowEditModal(false)
          setEditingPost(null)
        }
        if (showCreateModal) {
          setShowCreateModal(false)
        }
      }
    }

    if (showEditModal || showCreateModal) {
      document.addEventListener('keydown', handleEscKey)
      return () => document.removeEventListener('keydown', handleEscKey)
    }
  }, [showEditModal, showCreateModal])

       // Merkkien laskenta "Valmiina julkaisuun" (Tarkistuksessa) sarakkeelle ja create modaliin
  useEffect(() => {
    if (showEditModal && editingPost && editingPost.status === 'Tarkistuksessa') {
      const textarea = document.querySelector('.form-textarea')
      const charCount = document.querySelector('.char-count')

      if (textarea && charCount) {
        const updateCharCount = () => {
          const count = textarea.value.length
          charCount.textContent = count

          // Vaihda väriä jos yli 2000 merkkiä
          if (count > 2000) {
            charCount.style.color = '#ef4444'
          } else if (count > 1800) {
            charCount.style.color = '#f59e0b'
          } else {
            charCount.style.color = '#3B82F6'
          }
        }

        textarea.addEventListener('input', updateCharCount)
        updateCharCount() // Alustetaan laskenta

        return () => textarea.removeEventListener('input', updateCharCount)
      }
    }
  }, [showEditModal, editingPost])

  return (
    <div className="posts-container">
      {/* Page Header */}
      <div className="posts-header">
        <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: '#1f2937', margin: 0 }}>Some</h2>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <input
          type="text"
          placeholder="Etsi some-sisältöä..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="">Kaikki statukset</option>
          <option value="Kesken">Kesken</option>
          <option value="Tarkistuksessa">Valmiina julkaisuun</option>
          <option value="Aikataulutettu">Aikataulutettu</option>
          <option value="Julkaistu">Julkaistu</option>
        </select>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Luo uusi some-sisältö
        </Button>
      </div>

      {/* Loading State */}
      {(loading || mixpostLoading) && (
        <div className="skeleton-loading">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-thumbnail"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-caption"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {(currentError || mixpostError) && (
        <div className="error-state">
          <p>❌ {currentError || mixpostError}</p>
          <Button
            variant="secondary"
            onClick={() => {
              window.location.reload()
            }}
          >
            Yritä uudelleen
          </Button>
        </div>
      )}
        
      {/* Kanban Board */}
      {!currentError && !loading && (
        <div className="kanban-board">
          {/* Ylemmät 4 saraketta */}
          <div className="kanban-top-row">
            {columns.map(column => {
              // Filteröidään postit statusin JA lähteen mukaan
              let columnPosts = filteredPosts.filter(post => {
                // Avatar-sarakkeessa näytetään reels-data "Kesken" statusilla
                if (column.title === 'Avatar') {
                  return post.status === 'Kesken' && post.source === 'reels'
                }
                // Kesken-sarakkeessa näytetään Supabase-data "Kesken" statusilla
                else if (column.title === 'Kesken') {
                  return post.status === 'Kesken' && post.source === 'supabase'
                }

                // Muissa sarakkeissa näytetään Supabase-data oikealla statusilla
                else {
                  return post.status === column.status && post.source === 'supabase'
                }
              })
              
              return (
                <div key={column.status} className="kanban-column">
                  <h3 className="column-title">{column.title}</h3>
                  <div className="column-content">
                    {columnPosts.map(post => {
                      // Varmistetaan että post on oikeassa muodossa
                      const safePost = {
                        id: post.id || 'unknown',
                        title: post.title || 'Nimetön julkaisu',
                        caption: post.caption || 'Ei kuvausta',
                        type: post.type || 'Photo',
                        source: post.source || 'supabase',
                                    thumbnail: post.thumbnail || '/media-placeholder.svg',
            status: post.status || 'Kesken' // Lisätään status!
                      }
                      
                      return (
                        <PostCard
                          key={safePost.id}
                          post={safePost}
                          onEdit={handleEditPost}
                          onDelete={handleDeletePost}
                          onPublish={handlePublishPost}
                          onSchedule={handleSchedulePost}
                          onMoveToNext={handleMoveToNext}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Julkaistu-sarakkeessa kaikkien 4 sarakkeen levyinen */}
          <div className="kanban-bottom-row">
            {(() => {
              // Yhdistetään Supabase ja Mixpost julkaistut postaukset
              const supabasePublishedPosts = filteredPosts.filter(post => post.status === publishedColumn.status && post.source === 'supabase')
              const mixpostPublishedPosts = mixpostPosts.map(post => ({
                ...post,
                source: 'mixpost'
              }))
              
              const allPublishedPosts = [...supabasePublishedPosts, ...mixpostPublishedPosts]
              
              return (
                <div className="kanban-column kanban-column-full-width">
                  <h3 className="column-title">{publishedColumn.title}</h3>
                  <div className="column-content">
                    {allPublishedPosts.map(post => {
                      const safePost = {
                        id: post.id || post.uuid || 'unknown',
                        title: post.title || 'Nimetön julkaisu',
                        caption: post.caption || 'Ei kuvausta',
                        type: post.type || 'Photo',
                        source: post.source || 'supabase',
                        thumbnail: post.thumbnail || '/media-placeholder.svg',
                        status: post.status || 'Julkaistu',
                        published_at: post.published_at,
                        external_urls: post.external_urls || []
                      }
                      
                      return (
                        <PostCard
                          key={safePost.id}
                          post={safePost}
                          onEdit={handleEditPost}
                          onDelete={handleDeletePost}
                          onPublish={handlePublishPost}
                          onSchedule={handleSchedulePost}
                          onMoveToNext={handleMoveToNext}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div 
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false)
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <h2>Luo uusi some-sisältö</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              handleCreatePost({
                title: formData.get('title'),
                type: formData.get('type'),
                caption: formData.get('caption')
              })
            }} className="modal-form">
              <div className="form-group">
                <label>Otsikko</label>
                <input
                  name="title"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Syötä some-sisällön otsikko..."
                />
              </div>
              <div className="form-group">
                <label>Tyyppi</label>
                <select
                  name="type"
                  required
                  className="form-select"
                >
                  <option value="Photo">📸 Photo</option>
                  <option value="Carousel">🎠 Carousel</option>
                  <option value="Reels">🎬 Reels</option>
                </select>
              </div>
              <div className="form-group">
                <label>Kuvaus</label>
            <textarea
                  name="caption"
                  rows={4}
                  className="form-textarea"
              placeholder="Kirjoita some-sisällön kuvaus..."
            />
              </div>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Peruuta
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Luo some-sisältö
                </Button>
              </div>
        </form>
      </div>
    </div>
        )}

              {/* Edit Modal */}
        {showEditModal && editingPost && (
        <div 
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false)
              setEditingPost(null)
            }
          }}
        >
          <div className="modal">
                         <div className="modal-header">
               <h2>
                 {editingPost.status === 'Kesken' && editingPost.type === 'Carousel' ? 'Kuvaus-tarkistus' : 
                  editingPost.status === 'Kesken' ? 'Voiceover-tarkistus' : 'Muokkaa some-sisältöä'}
               </h2>
               {/* Debug: Näytä status */}
               <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                 Status: {editingPost.status} | Source: {editingPost.source}
               </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPost(null)
                }}
                style={{ 
                  padding: '8px', 
                  minWidth: '32px', 
                  minHeight: '32px',
                  fontSize: '16px'
                }}
              >
                ✕
              </Button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
                             handleSaveEdit({
                 title: formData.get('title'),
                 caption: formData.get('caption'),
                 voiceover: formData.get('voiceover'),
                 publishDate: formData.get('publishDate'),
                 voiceoverReady: formData.get('voiceoverReady') === 'on',
                 type: formData.get('type'),
                 status: formData.get('status')
               })
            }} className="modal-form">
              
              {/* Video Player / Thumbnail */}
              <div className="video-player">
                <div className="video-container">
                  {/* Jos on Carousel-tyyppi ja segments dataa, näytetään slideshow */}
                  {editingPost.type === 'Carousel' && editingPost.segments && editingPost.segments.length > 0 ? (
                    <div className="carousel-slideshow">
                      {(() => {
                        const slidesWithMedia = editingPost.segments.filter(segment => segment.media_urls && segment.media_urls.length > 0);
                        if (slidesWithMedia.length === 0) {
                          return (
                            <div className="no-media-message">
                              <span>📄</span>
                              <p>Ei mediaa saatavilla segments-taulusta</p>
                            </div>
                          );
                        }
                        
                                                 return (
                           <div className="slideshow-container" onClick={(e) => e.stopPropagation()}>
                            {/* Vasen nuoli */}
                            <button 
                              className="slideshow-arrow slideshow-arrow-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentSlide = editingPost.currentSlide || 0;
                                const newSlide = currentSlide > 0 ? currentSlide - 1 : slidesWithMedia.length - 1;
                                setEditingPost(prev => ({ ...prev, currentSlide: newSlide }));
                              }}
                            >
                              ‹
                            </button>
                            
                            {/* Oikea nuoli */}
                            <button 
                              className="slideshow-arrow slideshow-arrow-right"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentSlide = editingPost.currentSlide || 0;
                                const newSlide = currentSlide < slidesWithMedia.length - 1 ? currentSlide + 1 : 0;
                                setEditingPost(prev => ({ ...prev, currentSlide: newSlide }));
                              }}
                            >
                              ›
                            </button>
                            
                            {/* Nykyinen slide */}
                            <div className="slide-display">
                              {(() => {
                                const currentMedia = slidesWithMedia[editingPost.currentSlide || 0].media_urls[0];
                                const isVideo = currentMedia && (
                                  currentMedia.includes('.mp4') || 
                                  currentMedia.includes('.webm') || 
                                  currentMedia.includes('.mov') ||
                                  currentMedia.includes('.avi')
                                );
                                
                                if (isVideo) {
                                  return (
                                    <div className="video-wrapper">
                                      <video 
                                        src={currentMedia}
                                        className="slide-video"
                                        controls
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'block';
                                        }}
                                      >
                                        Your browser does not support the video tag.
                                      </video>
                                      <div className="video-fallback" style={{ display: 'none' }}>
                                        <img 
                                          src="/media-placeholder.svg" 
                                          alt="Video ei saatavilla"
                                          className="slide-image"
                                        />
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <img 
                                      src={currentMedia} 
                                      alt={`Slide ${slidesWithMedia[editingPost.currentSlide || 0].slide_no}`}
                                      className="slide-image"
                                      onError={(e) => {
                                        e.target.src = '/media-placeholder.svg';
                                      }}
                                    />
                                  );
                                }
                              })()}
                            </div>
                            
                            {/* Pallot alapuolella */}
                            <div className="slideshow-dots">
                              {slidesWithMedia.map((_, index) => (
                                <button
                                  key={index}
                                  className={`slideshow-dot ${index === (editingPost.currentSlide || 0) ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPost(prev => ({ ...prev, currentSlide: index }));
                                  }}
                                >
                                  {index + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : editingPost.thumbnail && editingPost.thumbnail !== '/placeholder.png' ? (
                    <video 
                      src={editingPost.thumbnail} 
                      controls 
                      className="video-element"
                      poster={editingPost.thumbnail}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="video-placeholder">
                      <span className="video-icon">🎥</span>
                      <p>Ei videota saatavilla</p>
                    </div>
                  )}
                </div>
              </div>

                             {/* Tabs */}
               <div className="content-tabs">
                 <Button 
                   type="button" 
                   variant="primary"
                   style={{ 
                     padding: '8px 16px', 
                     fontSize: '14px',
                     backgroundColor: '#3b82f6'
                   }}
                 >
                   {editingPost.source === 'reels' ? '🎬 Reels' : `📸 ${editingPost.type || 'Post'}`}
                 </Button>
                 <Button 
                   type="button" 
                   variant="secondary"
                   style={{ 
                     padding: '8px 16px', 
                     fontSize: '14px'
                   }}
                 >
                   {editingPost.source === 'reels' ? '🎙️ Voiceover' : '📊 Status'}
                 </Button>
               </div>

                             {/* Content Fields */}
               <div className="content-fields">
                 {/* "Kesken" sarakkeessa: Voiceover-muokkaus - vain Avatar-sarakkeessa (reels) */}
                 {editingPost.status === 'Kesken' && (editingPost.source === 'reels' || editingPost.type === 'Reels') && (
                   <div className="form-group">
                     <label>{editingPost.type === 'Carousel' ? 'Kuvaus' : 'Voiceover'}</label>
                     <textarea
                       name="voiceover"
                       rows={8}
                       className="form-textarea"
                       defaultValue={editingPost.voiceover || "Oletko innovaattori? Kuvittele maailma, jossa AI käsittelee asiakaspalvelupuhelut puolestasi. Näytämme, miten tämä teknologia voi mullistaa yrityksesi toiminnan, parantaen tiimisi tehokkuutta ja myyntituloksia. Anna työntekijöidesi keskittyä siihen, missä he loistavat, samalla kun tekoäly hoitaa rutiinitehtävät. Astu kanssamme tulevaisuuteen, jossa työskentely on entistäkin sujuvampaa."}
                       placeholder={editingPost.type === 'Carousel' ? "Kirjoita kuvaus..." : "Kirjoita voiceover-teksti..."}
                     />
                     <div className="voiceover-checkbox">
                       <label className="checkbox-label">
                         <input 
                           type="checkbox" 
                           name="voiceoverReady" 
                           defaultChecked={editingPost.voiceoverReady}
                         />
                         <span className="checkbox-text">Vahvistan että {editingPost.type === 'Carousel' ? 'kuvaus' : 'voiceover'} on valmis ja tarkistettu</span>
                       </label>
                     </div>
                   </div>
                 )}

                 {/* "Kesken" sarakkeessa: Perusmuokkaus - Supabase-postauksille */}
                 {editingPost.status === 'Kesken' && editingPost.source === 'supabase' && (
                   <div className="form-group">
                     <label>Kuvaus</label>
                     <textarea
                       name="caption"
                       rows={6}
                       className="form-textarea"
                       defaultValue={editingPost.caption || ""}
                       placeholder="Kirjoita some-sisällön kuvaus..."
                     />
                   </div>
                 )}

                 {/* "Valmiina julkaisuun" sarakkeessa: Captions-muokkaus + voiceover (readonly) */}
                 {editingPost.status === 'Tarkistuksessa' && (
                   <>
                     <div className="form-group">
                       <label>Kuvaus</label>
                       <textarea
                         name="caption"
                         rows={6}
                         className="form-textarea"
                         defaultValue={editingPost.caption || "Oletko valmis muuttamaan yrityksesi toimintamallit? AI voi hoitaa puhelut, jotta sinä voit keskittyä suureen kuvaan. Tartu tilaisuuteen ja modernisoi asiakashankintasi.🗝️ ja tägää joku, joka hyötyisi tästä innovaatiosta! #Tekoäly #Yrittäjyys #Kasvu #Tekoäly #Yrittäjyys #Asiakashankinta #Valmennus #RascalCompany"}
                         placeholder="Kirjoita some-sisällön kuvaus..."
                       />
                       <div className="char-counter">
                         <span className="char-count">0</span> / 2200 merkkiä
      </div>
                     </div>

                     {/* Voiceover näkyy vain jos kyseessä on Reels */}
                     {(editingPost.source === 'reels' || editingPost.type === 'Reels') && (
                       <div className="form-group">
                         <label>Voiceover (vain luku)</label>
                         <textarea
                           name="voiceover"
                           rows={4}
                           className="form-textarea"
                           defaultValue={editingPost.voiceover || ""}
                           placeholder="Voiceover-teksti..."
                           readOnly
                           style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                         />
                       </div>
                     )}
                   </>
                 )}

                 {/* Muissa sarakkeissa: Perusmuokkaus */}
                 {editingPost.status !== 'Kesken' && editingPost.status !== 'Tarkistuksessa' && (
                   <div className="form-group">
                     <label>Kuvaus</label>
                     <textarea
                       name="caption"
                       rows={4}
                       className="form-textarea"
                       defaultValue={editingPost.caption || ""}
                       placeholder="Kirjoita some-sisällön kuvaus..."
                     />
                   </div>
                 )}

                 <div className="form-group">
                   <label>Julkaisupäivä</label>
                   <input
                     name="publishDate"
                     type="datetime-local"
                     className="form-input"
                     defaultValue={editingPost.publishDate || ""}
                     placeholder="pp.kk.vvvv klo --:--"
                   />
                 </div>
               </div>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingPost(null)
                  }}
                >
                  Peruuta
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Tallenna
                </Button>
                {/* Julkaisu-nappi vain jos status on "Valmiina julkaisuun" (Tarkistuksessa) tai "Aikataulutettu" */}
                {(editingPost.status === 'Tarkistuksessa' || editingPost.status === 'Aikataulutettu') && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      // Päivitä editingPost modaalissa muokatuilla tiedoilla
                      const form = document.querySelector('.modal-form')
                      const formData = new FormData(form)
                      
                      let updatedPost = { ...editingPost }
                      
                      // Päivitä caption jos se on muokattu
                      if (formData.get('caption')) {
                        updatedPost.caption = formData.get('caption')
                      }
                      
                      // Päivitä scheduledDate jos publishDate on muokattu
                      const publishDate = formData.get('publishDate')
                      if (publishDate && publishDate.trim() !== '') {
                        const dateTime = new Date(publishDate)
                        updatedPost.scheduledDate = dateTime.toISOString().split('T')[0]
                        // Lisää myös alkuperäinen publishDate ajan käsittelyä varten
                        updatedPost.publishDate = publishDate
                      } else {
                        updatedPost.scheduledDate = null
                        updatedPost.publishDate = null
                      }
                      
                      handlePublishPost(updatedPost)
                    }}
                    style={{ backgroundColor: '#22c55e' }}
                  >
                    📤 Julkaise
                  </Button>
                )}
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (window.confirm('Oletko varma, että haluat poistaa tämän some-sisällön?')) {
                      handleDeletePost(editingPost)
                      setShowEditModal(false)
                      setEditingPost(null)
                    }
                  }}
                >
                  Poista
                </Button>
              </div>
            </form>
          </div>
          </div>
        )}

      {/* Publish Modal - Somekanavien valinta */}
      {showPublishModal && publishingPost && (
        <div 
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPublishModal(false)
              setPublishingPost(null)
              setSelectedAccounts([])
            }
          }}
        >
          <div className="modal someselect-modal">
            <div className="modal-header">
              <h2>Valitse somekanavat julkaisua varten</h2>
              <button
                onClick={() => {
                  setShowPublishModal(false)
                  setPublishingPost(null)
                  setSelectedAccounts([])
                }}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Julkaistava sisältö</label>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                    {publishingPost.title}
                  </h4>
                  <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                    {publishingPost.caption}
                  </p>
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      padding: '4px 8px', 
                      backgroundColor: '#e3f2fd', 
                      borderRadius: '4px',
                      color: '#1976d2'
                    }}>
                      {publishingPost.type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Valitse somekanavat</label>
                {loadingAccounts ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="loading-spinner"></div>
                    <p>Haetaan somekanavia...</p>
                  </div>
                ) : socialAccounts.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '8px',
                    border: '1px solid #ffeaa7'
                  }}>
                    <p style={{ margin: '0', color: '#856404' }}>
                      Ei yhdistettyjä somekanavia. <br />
                      <a 
                        href="/settings" 
                        style={{ color: '#007bff', textDecoration: 'underline' }}
                      >
                        Yhdistä somekanavat asetuksissa
                      </a>
                    </p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {socialAccounts.map((account) => (
                      <div
                        key={account.mixpost_account_uuid}
                        className={`someselect-row${selectedAccounts.includes(account.mixpost_account_uuid) ? ' selected' : ''}`}
                        onClick={() => {
                          const isSelected = selectedAccounts.includes(account.mixpost_account_uuid)
                          if (isSelected) {
                            setSelectedAccounts(selectedAccounts.filter(id => id !== account.mixpost_account_uuid))
                          } else {
                            setSelectedAccounts([...selectedAccounts, account.mixpost_account_uuid])
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.mixpost_account_uuid)}
                          className="someselect-checkbox"
                          onChange={() => {}} // Handled by onClick
                          tabIndex={-1}
                        />
                        {account.profile_image_url ? (
                          <img
                            src={account.profile_image_url}
                            className="someselect-avatar"
                            alt="Profiilikuva"
                            onError={e => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : (
                          <div className="someselect-avatar">
                            {account.provider === 'instagram' ? '📷' :
                             account.provider === 'facebook' ? '📘' :
                             account.provider === 'linkedin' ? '💼' : '👤'}
                          </div>
                        )}
                        <div className="someselect-info">
                          <div className="someselect-name">{account.account_name}</div>
                          <div className="someselect-type">
                            {account.provider === 'instagram' && <>📷 Instagram</>}
                            {account.provider === 'facebook' && <>📘 Facebook</>}
                            {account.provider === 'linkedin' && <>💼 LinkedIn</>}
                            {!['instagram','facebook','linkedin'].includes(account.provider) && account.provider}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="someselect-actions">
                <button
                  type="button"
                  className="someselect-btn cancel"
                  onClick={() => {
                    setShowPublishModal(false)
                    setPublishingPost(null)
                    setSelectedAccounts([])
                  }}
                >
                  Peruuta
                </button>
                <button
                  type="button"
                  className="someselect-btn publish"
                  onClick={handleConfirmPublish}
                  disabled={selectedAccounts.length === 0 || loadingAccounts}
                >
                  📤 Julkaise valituille kanaville
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}