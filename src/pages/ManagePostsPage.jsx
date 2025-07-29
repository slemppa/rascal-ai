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
  { status: 'Tarkistuksessa', title: 'Tarkistuksessa', color: '#dbeafe' },
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

function PostCard({ post, onEdit, onDelete, onPublish, onSchedule }) {
  return (
    <div className="post-card">
      <div className="post-card-content">
        <div className="post-thumbnail">
          {post.thumbnail && post.thumbnail !== '/placeholder.png' && post.thumbnail !== '/media-placeholder.svg' ? (
            <img
              src={post.thumbnail}
              alt="thumbnail"
                          onError={(e) => {
              e.target.src = '/media-placeholder.svg';
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
            <p className="post-caption">
              {post.caption}
            </p>
          <div className="post-footer">
            <span className="post-date">
              {post.scheduledDate ? `📅 ${post.scheduledDate}` : post.createdAt || post.publishedAt}
            </span>
            <div className="post-actions">
                              <Button 
                  variant="secondary" 
                  onClick={() => onEdit(post)}
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                >
                  ✏️ Muokkaa
                </Button>
                {/* Julkaisu-nappi vain jos status on "Tarkistuksessa" */}
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
                <Button 
                  variant="danger" 
                  onClick={() => onDelete(post)}
                  style={{ fontSize: '11px', padding: '6px 10px' }}
                >
                  🗑️ Poista
                </Button>
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
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
      
      // Haetaan käyttäjän julkaisut
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      // Haetaan segments-data Carousel-tyyppisille posteille
      const contentWithSegments = await Promise.all(
        data.map(async (contentItem) => {
          if (contentItem.type === 'Carousel') {
            try {
              const { data: segmentsData, error: segmentsError } = await supabase
                .from('segments')
                .select('*')
                .eq('content_id', contentItem.id)
                .order('slide_no', { ascending: true })
              
              if (!segmentsError && segmentsData) {
                return {
                  ...contentItem,
                  segments: segmentsData
                }
              }
            } catch (err) {
              console.error('Virhe segments datan haussa:', err)
            }
          }
          return contentItem
        })
      )
      
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
  }, [user])

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
      console.log('Transformed reels item:', transformed) // Debug
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
    const matchesSearch = (post.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (post.caption?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
      alert('Idea lähetetty AI:lle! Sisältö generoidaan taustalla.')
      
    } catch (error) {
      console.error('Virhe uuden julkaisun luomisessa:', error)
      alert('Virhe: Ei voitu luoda julkaisua. Yritä uudelleen.')
    }
  }

  const handleEditPost = async (post) => {
    console.log('=== handleEditPost called ===')
    console.log('Edit post:', post) // Debug
    console.log('Status:', post.status) // Debug status
    console.log('Source:', post.source) // Debug source
    console.log('All keys:', Object.keys(post)) // Debug kaikki kentät
    
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
    
    setEditingPost(post)
    setShowEditModal(true)
    console.log('Modal state set to true')
  }

  const handleSaveEdit = async (updatedData) => {
    if (editingPost) {
      // Päivitä paikallinen tila
      setPosts(prev => prev.map(post => 
        post.id === editingPost.id 
          ? { ...post, ...updatedData }
          : post
      ))
      
      // Päivitä myös reelsPosts jos kyseessä on reels
      if (editingPost.source === 'reels') {
        setReelsPosts(prev => prev.map(post => 
          post.id === editingPost.id 
            ? { ...post, ...updatedData }
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
                caption: updatedData.caption || null,
                publish_date: updatedData.publishDate || null,
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
      
      setShowEditModal(false)
      setEditingPost(null)
    }
  }

  const handleDeletePost = async (post) => {
    if (window.confirm('Oletko varma, että haluat poistaa tämän julkaisun?')) {
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

        alert(result.message || 'Post poistettu onnistuneesti!')
        
      } catch (error) {
        console.error('Delete error:', error)
        alert('Poisto epäonnistui: ' + error.message)
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

      alert(result.message || 'Ajastus onnistui!')
      setShowEditModal(false)
      setEditingPost(null)
      
    } catch (error) {
      console.error('Schedule error:', error)
      alert('Ajastus epäonnistui: ' + error.message)
    }
  }

  const handlePublishPost = async (post) => {
    try {
      // Lähetetään data backend:iin, joka hoitaa Supabase-kyselyt
      const publishData = {
        post_id: post.id,
        user_id: user.id,
        auth_user_id: user.id,
        content: post.caption || post.title,
        media_urls: post.mediaUrls || [],
        scheduled_date: post.scheduledDate || null,
        action: 'publish'
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
      if (post.source === 'reels') {
        await fetchReelsPosts()
      }

      alert(result.message || 'Julkaisu onnistui!')
      setShowEditModal(false)
      setEditingPost(null)
      
    } catch (error) {
      console.error('Publish error:', error)
      alert('Julkaisu epäonnistui: ' + error.message)
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

       // Merkkien laskenta "Tarkistuksessa" sarakkeelle ja create modaliin
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
        <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: '#1f2937', margin: 0 }}>Julkaisut</h2>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <input
          type="text"
          placeholder="Etsi julkaisuja..."
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
          <option value="Tarkistuksessa">Tarkistuksessa</option>
          <option value="Aikataulutettu">Aikataulutettu</option>
          <option value="Julkaistu">Julkaistu</option>
        </select>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Luo uusi julkaisu
        </Button>
      </div>

      {/* Error State */}
      {currentError && (
        <div className="error-state">
          <p>❌ {currentError}</p>
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
      {!currentError && (
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
              const publishedPosts = filteredPosts.filter(post => post.status === publishedColumn.status && post.source === 'supabase')
              
              return (
                <div className="kanban-column kanban-column-full-width">
                  <h3 className="column-title">{publishedColumn.title}</h3>
                  <div className="column-content">
                    {publishedPosts.map(post => {
                      const safePost = {
                        id: post.id || 'unknown',
                        title: post.title || 'Nimetön julkaisu',
                        caption: post.caption || 'Ei kuvausta',
                        type: post.type || 'Photo',
                        source: post.source || 'supabase',
                        thumbnail: post.thumbnail || '/media-placeholder.svg',
                        status: post.status || 'Julkaistu'
                      }
                      
                      return (
                        <PostCard
                          key={safePost.id}
                          post={safePost}
                          onEdit={handleEditPost}
                          onDelete={handleDeletePost}
                          onPublish={handlePublishPost}
                          onSchedule={handleSchedulePost}
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
              <h2>Luo uusi julkaisu</h2>
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
                  placeholder="Syötä julkaisun otsikko..."
                />
                  </div>
              <div className="form-group">
                <label>Kuvaus</label>
            <textarea
                  name="caption"
                  rows={4}
                  className="form-textarea"
              placeholder="Kirjoita julkaisun kuvaus..."
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
                  Luo julkaisu
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
                  editingPost.status === 'Kesken' ? 'Voiceover-tarkistus' : 'Muokkaa julkaisua'}
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
                 {/* "Kesken" sarakkeessa: Voiceover-muokkaus */}
                 {editingPost.status === 'Kesken' && (
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

                 {/* "Tarkistuksessa" sarakkeessa: Captions-muokkaus + voiceover (readonly) */}
                 {editingPost.status === 'Tarkistuksessa' && (
                   <>
                     <div className="form-group">
                       <label>Kuvaus</label>
                       <textarea
                         name="caption"
                         rows={6}
                         className="form-textarea"
                         defaultValue={editingPost.caption || "Oletko valmis muuttamaan yrityksesi toimintamallit? AI voi hoitaa puhelut, jotta sinä voit keskittyä suureen kuvaan. Tartu tilaisuuteen ja modernisoi asiakashankintasi.🗝️ ja tägää joku, joka hyötyisi tästä innovaatiosta! #Tekoäly #Yrittäjyys #Kasvu #Tekoäly #Yrittäjyys #Asiakashankinta #Valmennus #RascalCompany"}
                         placeholder="Kirjoita julkaisun kuvaus..."
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
                       placeholder="Kirjoita julkaisun kuvaus..."
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
                {/* Julkaisu-nappi vain jos status on "Tarkistuksessa" tai "Aikataulutettu" */}
                {(editingPost.status === 'Tarkistuksessa' || editingPost.status === 'Aikataulutettu') && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handlePublishPost(editingPost)}
                    style={{ backgroundColor: '#22c55e' }}
                  >
                    📤 Julkaise
                  </Button>
                )}
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (window.confirm('Oletko varma, että haluat poistaa tämän julkaisun?')) {
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


    </div>
  )
}