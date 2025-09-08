import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'
import '../components/ModalComponents.css'
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
  { status: 'Kesken', titleKey: 'posts.columns.avatar', color: '#fef3c7' },
  { status: 'KeskenSupabase', titleKey: 'posts.columns.inProgress', color: '#fef3c7' },
  { status: 'Tarkistuksessa', titleKey: 'posts.columns.readyToPublish', color: '#dbeafe' },
  { status: 'Aikataulutettu', titleKey: 'posts.columns.scheduled', color: '#fce7f3' }
]

const publishedColumn = { status: 'Julkaistu', titleKey: 'posts.statuses.published', color: '#dcfce7' }

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
    

    
    return {
      id: item.id,
      title: item.idea || item.caption || t('posts.statuses.untitled'),
      status: status,
      thumbnail: thumbnail,
      caption: item.caption || item.idea || 'Ei kuvausta',
      type: item.type || 'Photo',
      createdAt: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : null,
      scheduledDate: item.publish_date && publishDate > now ? new Date(item.publish_date).toISOString().split('T')[0] : null,
      publishedAt: item.publish_date && publishDate <= now ? new Date(item.publish_date).toISOString().split('T')[0] : null,
      publishDate: item.publish_date ? new Date(item.publish_date).toISOString().slice(0, 16) : null,
      mediaUrls: item.media_urls || [],
      media_urls: item.media_urls || [], // Lisätään myös media_urls kenttä
      hashtags: item.hashtags || [],
      voiceover: item.voiceover || '',
      voiceoverReady: item.voiceover_ready || false,
      segments: item.segments || [], // Lisätään segments data!
      originalData: {
        ...item,
        media_urls: item.media_urls || [] // Varmistetaan että media_urls on originalData:ssa
      },
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
      title: item.title || t('posts.statuses.untitledReels'),
      status: status,
      thumbnail: item.media_urls?.[0] || null,
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

function PostCard({ post, onEdit, onDelete, onPublish, onSchedule, onMoveToNext, onDragStart, onDragEnd, isDragging, t }) {
  return (
    <div 
      className={`post-card ${isDragging ? 'dragging' : ''}`}
      draggable={post.source === 'supabase'}
      onDragStart={(e) => onDragStart(e, post)}
      onDragEnd={onDragEnd}
    >
      <div className="post-card-content">
        <div className="post-thumbnail">
          {(() => {
            // Carousel: Näytä ensimmäinen slide segments-taulusta
            if (post.type === 'Carousel' && post.segments && post.segments.length > 0) {
              const firstSegment = post.segments.find(seg => seg.slide_no === 1) || post.segments[0];
              const mediaUrl = firstSegment.media_urls?.[0];
              
              if (mediaUrl) {
                const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('.mov') || mediaUrl.includes('.avi');
                
                if (isVideo) {
                  return (
                    <video
                      src={mediaUrl}
                      muted
                      loop
                      playsInline
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        if (e.target && e.target.style) {
                          e.target.style.display = 'none';
                        }
                        if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  );
                } else {
                  return (
                    <img
                      src={mediaUrl}
                      alt="carousel preview"
                      loading="lazy"
                      decoding="async"
                      onLoad={(e) => {
                        e.target.style.opacity = '1'
                      }}
                      onError={(e) => {
                        if (e.target && e.target.style) {
                          e.target.style.display = 'none';
                        }
                        if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                      }}
                    />
                  );
                }
              }
            }
            
            // Video: Toisto
            if (post.thumbnail && (post.thumbnail.includes('.mp4') || post.thumbnail.includes('.webm') || post.thumbnail.includes('.mov') || post.thumbnail.includes('.avi'))) {
              return (
                <video
                  src={post.thumbnail}
                  muted
                  loop
                  playsInline
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    if (e.target && e.target.style) {
                      e.target.style.display = 'none';
                    }
                    if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              );
            }
            
            // Kuva: Vain preview
            if (post.thumbnail) {
              return (
                <img
                  src={post.thumbnail}
                  alt="thumbnail"
                  loading="lazy"
                  decoding="async"
                  onLoad={(e) => {
                    e.target.style.opacity = '1'
                  }}
                  onError={(e) => {
                    if (e.target && e.target.style) {
                      e.target.style.display = 'none';
                    }
                    if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                />
              );
            }
            
            // Placeholder jos ei mediaa
            return (
              <div className="placeholder-content">
                <div className="placeholder-fallback">
                  <div className="placeholder-icon">Kuva</div>
                  <div className="placeholder-text">Ei kuvaa</div>
                </div>
              </div>
            );
          })()}
        </div>
                  <div className="post-info">
            <div className="post-header">
              <h3 className="post-title">
                {post.title.length > 50 ? post.title.slice(0, 50) + '…' : post.title}
              </h3>
              <div className="post-badges">
                <span className="post-type">
                                      {post.type === 'Carousel' ? 'Carousel' :  
                                   post.type === 'Reels' ? 'Reels' :
                post.type === 'Blog' ? 'Blog' : 
                                        post.type === 'Newsletter' ? 'Newsletter' :  
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
              {post.scheduledDate ? `${post.scheduledDate}` : post.createdAt || post.publishedAt}
            </span>
            <div className="post-actions">
              {/* Näytä napit vain jos ei ole "Julkaistu" sarakkeessa */}
              {post.status !== 'Julkaistu' && (
                <>
                  <Button 
                    variant="secondary" 
                    onClick={() => onEdit(post)}
                    style={{ fontSize: '11px', padding: '6px 10px' }}
                  >
                    {post.status === 'Tarkistuksessa' ? t('posts.buttons.view') : t('posts.buttons.edit')}
                  </Button>
                  
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
                      Valmiina julkaisuun
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
                      {t('posts.buttons.publish')}
                    </Button>
                  )}
                  
                  <Button 
                    variant="danger" 
                    onClick={() => onDelete(post)}
                    style={{ fontSize: '11px', padding: '6px 10px' }}
                  >
                    {t('posts.buttons.delete')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ManagePostsPage() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dataSourceToggle, setDataSourceToggle] = useState('all') // 'all', 'supabase', 'reels'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishingPost, setPublishingPost] = useState(null)
  const [socialAccounts, setSocialAccounts] = useState([])
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [reelsPosts, setReelsPosts] = useState([])
  const [reelsLoading, setReelsLoading] = useState(false)
  const [reelsError, setReelsError] = useState(null)
  
  // Drag & Drop states
  const [draggedPost, setDraggedPost] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  
  // Notification states
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const hasInitialized = useRef(false)

  // Auto-hide notifications
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

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
        throw new Error(t('posts.messages.userIdNotFound'))
      }
      
      // Haetaan käyttäjän some-sisältö (ei Blog/Newsletter, ei poistettuja)
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', userData.id)
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
      

      
      const transformedData = transformSupabaseData(contentWithSegments)

      setPosts(transformedData || [])
      
    } catch (err) {
      console.error('Virhe datan haussa:', err)
      setError(t('posts.messages.dataFetchError'))
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
  }, [user])

  // Hae somekanavat Supabasesta
  const fetchSocialAccounts = async () => {
    if (!user) return
    
    try {
      setLoadingAccounts(true)
      
      // Haetaan yhdistetyt sometilit - käytetään auth_user_id:tä suoraan
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
        title: item.title || t('posts.statuses.untitledReels'),
        status: status,
        thumbnail: item.media_urls?.[0] || '/placeholder.png',
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
        throw new Error(t('posts.messages.userIdNotFound'))
      }

      // Lähetetään idea-generation kutsu N8N:lle
      try {



        const response = await fetch('/api/idea-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idea: postData.title,
            type: postData.type,
            companyId: userData.company_id,
            caption: postData.caption
          })
        })

        if (!response.ok) {
          console.error('Idea generation failed:', response.status)
          // Jatketaan silti postauksen luomista
        } else {
          const result = await response.json()
        }
      } catch (webhookError) {
        console.error('Idea generation webhook error:', webhookError)
        // Jatketaan silti postauksen luomista
      }

      setShowCreateModal(false)
      setSuccessMessage(t('posts.messages.ideaSent'))
      
    } catch (error) {
      console.error('Virhe uuden julkaisun luomisessa:', error)
      setErrorMessage(t('posts.messages.errorCreating'))
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
    
    // Varmistetaan että originalData on mukana ja media_urls löytyy
    const postWithOriginalData = {
      ...post,
      media_urls: post.media_urls || post.mediaUrls || post.originalData?.media_urls || [],
      originalData: {
        ...post,
        media_urls: post.media_urls || post.mediaUrls || post.originalData?.media_urls || []
      }
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
                       // Haetaan company_id käyttäjälle
               const { data: userData, error: userError } = await supabase
                 .from('users')
                 .select('company_id')
                 .eq('auth_user_id', user.id)
                 .single()

               if (userError || !userData?.company_id) {
                 console.error('Could not fetch company_id:', userError)
                 setErrorMessage(t('posts.messages.errorCompanyId'))
                 return
               }



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
            setErrorMessage(t('posts.messages.voiceoverError'))
            return
          }

          const result = await response.json()
          
          // Näytä käyttäjälle onnistumisviesti
          setSuccessMessage(t('posts.messages.voiceoverSuccess'))
          
        } catch (error) {
          console.error('Voiceover webhook error:', error)
          setErrorMessage(t('posts.messages.voiceoverError'))
          return
        }
      }

      // Päivitä Supabase kaikille postauksille
      try {


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
    if (window.confirm(t('posts.messages.confirmDelete'))) {
      try {
        // Haetaan käyttäjän data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (userError || !userData?.id) {
          throw new Error(t('posts.messages.userIdNotFound'))
        }

        // Muutetaan status 'Deleted':ksi sen sijaan että poistetaan rivi
        const { error: updateError } = await supabase
          .from('content')
          .update({ status: 'Deleted' })
          .eq('id', post.id)
          .eq('user_id', userData.id)

        if (updateError) {
          throw new Error(t('posts.messages.statusUpdateFailed') + ' ' + updateError.message)
        }

        // Päivitetään UI
        await fetchPosts()
        if (post.source === 'reels') {
          await fetchReelsPosts()
        }

        setSuccessMessage(t('posts.messages.deleteSuccess'))
        
      } catch (error) {
        console.error('Delete error:', error)
        setErrorMessage(t('posts.messages.deleteError') + ' ' + error.message)
      }
    }
  }

  const handleSchedulePost = async (post) => {
    try {
      // Kysytään ajastuspäivä käyttäjältä
      const scheduledDate = prompt(t('posts.messages.schedulePrompt'), 
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

      setSuccessMessage(result.message || t('posts.messages.scheduleSuccess'))
      setShowEditModal(false)
      setEditingPost(null)
      
    } catch (error) {
      console.error('Schedule error:', error)
      setErrorMessage(t('posts.messages.scheduleError') + ' ' + error.message)
    }
  }

  const handlePublishPost = async (post) => {
    // Aseta julkaistava post ja avaa modaali
    setPublishingPost(post)
    setSelectedAccounts([]) // Tyhjennä aiemmat valinnat
    setShowPublishModal(true)
    
    // Haetaan somekanavat kun modaali avataan
    await fetchSocialAccounts()
  }

  const handleConfirmPublish = async () => {
    if (!publishingPost || selectedAccounts.length === 0) {
      setErrorMessage(t('posts.messages.selectAccounts'))
      return
    }

    try {
      // Haetaan media-data suoraan Supabase:sta
      let mediaUrls = []
      let segments = []
      
      if (publishingPost.source === 'supabase') {
        // Haetaan käyttäjän user_id users taulusta
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (userError || !userData?.id) {
          throw new Error(t('posts.messages.userIdNotFound'))
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

      setSuccessMessage(result.message || t('posts.messages.publishSuccess'))
      setShowPublishModal(false)
      setPublishingPost(null)
      setSelectedAccounts([])
      
    } catch (error) {
      console.error('Publish error:', error)
      setErrorMessage(t('posts.messages.publishError') + ' ' + error.message)
    }
  }

  const handleMoveToNext = async (post, newStatus) => {
    try {
      // Varmistetaan että kyseessä on Supabase-postaus
      if (post.source !== 'supabase') {
        setErrorMessage('Siirtyminen on mahdollista vain Supabase-postauksille')
        return
      }

      // Haetaan käyttäjän user_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !userData?.id) {
        throw new Error(t('posts.messages.userIdNotFound'))
      }

      // Määritellään status-mappaus
      const statusMap = {
        'Kesken': 'In Progress',
        'KeskenSupabase': 'In Progress',
        'Tarkistuksessa': 'Under Review',
        'Aikataulutettu': 'Scheduled'
      }

      const supabaseStatus = statusMap[newStatus]
      if (!supabaseStatus) {
        throw new Error('Virheellinen status: ' + newStatus)
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
        throw new Error(t('posts.messages.supabaseUpdateFailed'))
      }

      // Päivitetään UI
      await fetchPosts()
      
      setSuccessMessage(`Postaus siirretty sarakkeeseen: ${newStatus}`)
      
    } catch (error) {
      console.error('Move to next error:', error)
      setErrorMessage(t('posts.messages.moveError') + ' ' + error.message)
    }
  }

  // Drag & Drop handlers
  const handleDragStart = (e, post) => {
    setDraggedPost(post)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.outerHTML)
  }

  const handleDragEnd = () => {
    setDraggedPost(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e, columnStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnStatus)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    
    if (!draggedPost) return
    
    // Varmistetaan että kyseessä on Supabase-postaus
    if (draggedPost.source !== 'supabase') {
      setErrorMessage('Siirtyminen on mahdollista vain Supabase-postauksille')
      return
    }

    // Jos status on sama, ei tehdä mitään
    if (draggedPost.status === targetStatus) return

    // Kutsutaan handleMoveToNext funktiota
    await handleMoveToNext(draggedPost, targetStatus)
  }

  // Kuvien hallinta content-media bucket:iin
  const handleDeleteImage = async (imageUrl, contentId) => {
    try {
      // Haetaan käyttäjän user_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !userData?.id) {
        throw new Error('User ID not found')
      }

      const response = await fetch('/api/content-media-management', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          contentId,
          imageUrl
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Image deletion failed')
      }

      const result = await response.json()
      
      // Update editingPost if modal is open
      if (editingPost && editingPost.id === contentId) {
        const currentMediaUrls = editingPost.originalData?.media_urls || editingPost.media_urls || editingPost.mediaUrls || [];
        const newMediaUrls = currentMediaUrls.filter(url => url !== imageUrl);
        
        setEditingPost(prev => ({
          ...prev,
          originalData: {
            ...prev.originalData,
            media_urls: newMediaUrls
          },
          media_urls: newMediaUrls,
          mediaUrls: newMediaUrls,
          // Päivitä myös thumbnail jos se oli sama kuin poistettu kuva
          thumbnail: prev.thumbnail === imageUrl ? (newMediaUrls[0] || null) : prev.thumbnail
        }));
      }
      
      // Päivitä myös posts lista
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === contentId 
            ? { ...post, media_urls: result.mediaUrls }
            : post
        )
      );
      
      setSuccessMessage('Image deleted successfully!')
      
    } catch (error) {
      console.error('Error deleting image:', error)
      setErrorMessage('Image deletion failed: ' + error.message)
    }
  }

  const handleAddImage = async (file, contentId) => {
    try {
      // Haetaan käyttäjän user_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !userData?.id) {
        throw new Error('User ID not found')
      }

      const formData = new FormData()
      formData.append('image', file)
      formData.append('contentId', contentId)
      formData.append('userId', userData.id)

      const response = await fetch('/api/content-media-management', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Image addition failed')
      }

      const result = await response.json()
      
      // Update editingPost if modal is open
      if (editingPost && editingPost.id === contentId) {
        const currentMediaUrls = editingPost.originalData?.media_urls || editingPost.media_urls || editingPost.mediaUrls || [];
        const newMediaUrls = [...currentMediaUrls, result.publicUrl];
        
        setEditingPost(prev => ({
          ...prev,
          originalData: {
            ...prev.originalData,
            media_urls: newMediaUrls
          },
          media_urls: newMediaUrls,
          mediaUrls: newMediaUrls
        }));
      }
      
      // Päivitä myös posts lista
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === contentId 
            ? { ...post, media_urls: newMediaUrls }
            : post
        )
      );
      
      setSuccessMessage('Image added successfully!')
      
    } catch (error) {
      console.error('Error adding image:', error)
      setErrorMessage('Image addition failed: ' + error.message)
    }
  }

  // Image drag & drop handlers (for adding images to posts)
  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleImageDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleImageDrop = (e, contentId) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      imageFiles.forEach(file => {
        handleAddImage(file, contentId);
      });
    }
  };

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
        <h2>{t('posts.header')}</h2>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <input
          type="text"
          placeholder={t('posts.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="">{t('posts.filters.allStatuses')}</option>
          <option value="Kesken">{t('posts.status.Kesken')}</option>
          <option value="Tarkistuksessa">{t('posts.status.Tarkistuksessa')}</option>
          <option value="Aikataulutettu">{t('posts.status.Aikataulutettu')}</option>
          <option value="Julkaistu">{t('posts.status.Julkaistu')}</option>
        </select>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          {t('posts.actions.createNew')}
        </Button>
      </div>

      {/* Loading State */}
      {(loading || reelsLoading) && (
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
      {(currentError || reelsError) && (
        <div className="error-state">
          <p>Virhe: {currentError || reelsError}</p>
          <Button
            variant="secondary"
            onClick={() => {
              window.location.reload()
            }}
          >
            {t('posts.actions.retry')}
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
                // Avatar-sarakkeessa näytetään reels-dataa
                if (column.titleKey === 'posts.columns.avatar') {
                  const isAvatarPost = post.status === 'Kesken' && post.source === 'reels'
                  return isAvatarPost
                }
                // Kesken-sarakkeessa näytetään vain Supabase-dataa "Kesken" statusilla
                else if (column.titleKey === 'posts.columns.inProgress') {
                  return post.status === 'Kesken' && post.source === 'supabase'
                }

                // Muissa sarakkeissa näytetään Supabase-data oikealla statusilla
                else {
                  return post.status === column.status && post.source === 'supabase'
                }
              })
              
              return (
                <div 
                  key={column.status} 
                  className={`kanban-column ${dragOverColumn === column.status ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, column.status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.status)}
                >
                  <h3 className="column-title">{t(column.titleKey)}</h3>
                  <div className="column-content">
                    {columnPosts.map(post => {
                      // Varmistetaan että post on oikeassa muodossa
                      const safePost = {
                        id: post.id || 'unknown',
                        title: post.title || t('posts.statuses.untitled'),
                        caption: post.caption || t('posts.placeholders.noImage'),
                        type: post.type || 'Photo',
                        source: post.source || 'supabase',
                        thumbnail: post.thumbnail || null,
                        status: post.status || 'Kesken',
                        voiceover: post.voiceover || '',
                        segments: post.segments || [] // Lisätään segments data!
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
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedPost?.id === safePost.id}
                          t={t}
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
              // Haetaan vain Supabase julkaistut postaukset
              const supabasePublishedPosts = filteredPosts.filter(post => post.status === publishedColumn.status && post.source === 'supabase')
              
              return (
                <div className="kanban-column kanban-column-full-width">
                  <h3 className="column-title">{t(publishedColumn.titleKey)}</h3>
                  <div className="column-content">
                    {supabasePublishedPosts.map(post => {
                      const safePost = {
                        id: post.id || 'unknown',
                        title: post.title || t('posts.statuses.untitled'),
                        caption: post.caption || t('posts.placeholders.noImage'),
                        type: post.type || 'Photo',
                        source: post.source || 'supabase',
                        thumbnail: post.thumbnail || null,
                        status: post.status || 'Julkaistu',
                        published_at: post.publishedAt,
                        external_urls: [],
                        segments: post.segments || [] // Lisätään segments data!
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
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedPost?.id === safePost.id}
                          t={t}
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
      {showCreateModal && createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false)
            }
          }}
        >
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{t('posts.buttons.createNew')}</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close-btn"
              >
                {t('posts.buttons.cancel')}
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                handleCreatePost({
                  title: formData.get('title'),
                  type: formData.get('type'),
                  caption: formData.get('caption')
                })
              }}>
                <div className="form-group">
                  <label className="form-label">Otsikko</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="form-input"
                    placeholder={t('posts.placeholders.title')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tyyppi</label>
                  <select
                    name="type"
                    required
                    className="form-select"
                  >
                                          <option value="Photo">Photo</option>
                                          <option value="Carousel">Carousel</option>
                    <option value="Reels">Reels</option>
                                          <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kuvaus</label>
                  <textarea
                    name="caption"
                    rows={4}
                    className="form-textarea"
                    placeholder={t('posts.placeholders.caption')}
                  />
                </div>
                <div className="modal-actions">
                  <div className="modal-actions-left">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      {t('posts.buttons.cancel')}
                    </Button>
                  </div>
                  <div className="modal-actions-right">
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      Luo some-sisältö
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
        {showEditModal && editingPost && createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false)
              setEditingPost(null)
            }
          }}
        >
          <div className="modal-container edit-post-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingPost.status === 'Kesken' && editingPost.type === 'Carousel' ? t('posts.modals.captionCheck') : 
                 editingPost.status === 'Kesken' ? t('posts.modals.voiceoverCheck') : 
                 editingPost.status === 'Tarkistuksessa' ? t('posts.modals.viewTitle') : t('posts.modals.editTitle')}
              </h2>
              {/* Debug: Näytä status */}
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Status: {editingPost.status} | Source: {editingPost.source}
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPost(null)
                }}
                className="modal-close-btn"
              >
                {t('posts.buttons.cancel')}
              </button>
            </div>
            <div className="modal-content">
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
            }}>
              
              {/* Kaksi saraketta: media vasemmalle, kentät oikealle */}
              <div className="edit-modal-grid">
                <div className="edit-modal-media">
                  <div className="video-player">
                    <div className="video-container">
                  {(() => {
                    // Carousel: Näytä slideshow segments-taulusta
                    if (editingPost.type === 'Carousel' && editingPost.segments && editingPost.segments.length > 0) {
                      const slidesWithMedia = editingPost.segments.filter(segment => segment.media_urls && segment.media_urls.length > 0);
                      if (slidesWithMedia.length === 0) {
                        return (
                          <div className="no-media-message">
                            <span>Dokumentti</span>
                            <p>Ei mediaa saatavilla segments-taulusta</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="carousel-slideshow">
                          <div className="slideshow-container" onClick={(e) => e.stopPropagation()}>
                            {/* Vasen nuoli */}
                            <button 
                              type="button"
                              className="slideshow-arrow slideshow-arrow-left"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const currentSlide = editingPost.currentSlide || 0;
                                const newSlide = currentSlide > 0 ? currentSlide - 1 : slidesWithMedia.length - 1;
                                setEditingPost(prev => ({ ...prev, currentSlide: newSlide }));
                              }}
                            >
                              ‹
                            </button>
                            
                            {/* Oikea nuoli */}
                            <button 
                              type="button"
                              className="slideshow-arrow slideshow-arrow-right"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
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
                                          if (e.target && e.target.style) {
                                            e.target.style.display = 'none';
                                          }
                                          if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                                            e.target.nextSibling.style.display = 'block';
                                          }
                                        }}
                                      >
                                        Your browser does not support the video tag.
                                      </video>
                                      <div className="video-fallback" style={{ display: 'none' }}>
                                        <div className="placeholder-icon">Video</div>
                                        <div className="placeholder-text">Video ei saatavilla</div>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div>
                                      <img 
                                        src={currentMedia} 
                                        alt={`Slide ${slidesWithMedia[editingPost.currentSlide || 0].slide_no}`}
                                        className="slide-image"
                                        onError={(e) => {
                                          if (e.target && e.target.style) {
                                            e.target.style.display = 'none';
                                          }
                                          if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                                            e.target.nextSibling.style.display = 'flex';
                                          }
                                        }}
                                      />
                                      <div className="video-fallback" style={{ display: 'none' }}>
                                        <div className="placeholder-icon">Kuva</div>
                                        <div className="placeholder-text">Kuva ei saatavilla</div>
                                      </div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                            
                            {/* Pallot alapuolella */}
                            <div className="slideshow-dots">
                              {slidesWithMedia.map((_, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  className={`slideshow-dot ${index === (editingPost.currentSlide || 0) ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setEditingPost(prev => ({ ...prev, currentSlide: index }));
                                  }}
                                >
                                  {index + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                                         // Carousel: Show images and management
                     console.log('Edit modal post type:', editingPost.type);
                     if (editingPost.type === 'Carousel') {
                       // Get media URLs from the correct source - use thumbnail if media_urls is empty
                       let mediaUrls = editingPost.originalData?.media_urls || 
                                      editingPost.originalData?.mediaUrls ||
                                      editingPost.media_urls || 
                                      editingPost.mediaUrls || 
                                      [];
                       
                       console.log('Carousel mediaUrls before fallback:', mediaUrls);
                       console.log('Carousel editingPost.thumbnail:', editingPost.thumbnail);
                       
                       // If mediaUrls is empty but thumbnail exists, use thumbnail
                       if (mediaUrls.length === 0 && editingPost.thumbnail) {
                         mediaUrls = [editingPost.thumbnail];
                         console.log('Using thumbnail as fallback for Carousel:', editingPost.thumbnail);
                       }
                       
                       if (mediaUrls.length === 0) {
                         return (
                           <div className="content-media-management">
                             <div 
                               className="drag-drop-zone"
                               onDragOver={handleImageDragOver}
                               onDragLeave={handleImageDragLeave}
                               onDrop={(e) => handleImageDrop(e, editingPost.id)}
                             >
                               <div className="drag-drop-content">
                                 <div className="drag-drop-icon">📁</div>
                                 <h3>No images yet</h3>
                                 <p>Drag & drop images here or click to browse</p>
                                 <input
                                   type="file"
                                   accept="image/*"
                                   multiple
                                   onChange={(e) => {
                                     if (e.target.files?.length > 0) {
                                       Array.from(e.target.files).forEach(file => {
                                         handleAddImage(file, editingPost.id);
                                       });
                                     }
                                   }}
                                   className="file-input-hidden"
                                   id="image-upload"
                                 />
                                 <label htmlFor="image-upload" className="upload-button">
                                   Browse Files
                                 </label>
                               </div>
                             </div>
                           </div>
                         );
                       }
                       
                       return (
                         <div className="content-media-management">
                           <div className="media-gallery">
                             {mediaUrls.map((imageUrl, index) => (
                               <div key={index} className="media-item">
                                 <img 
                                   src={imageUrl} 
                                   alt={`Image ${index + 1}`}
                                   className="media-image"
                                   onError={(e) => {
                                     if (e.target && e.target.style) {
                                       e.target.style.display = 'none';
                                     }
                                     if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                                       e.target.nextSibling.style.display = 'flex';
                                     }
                                   }}
                                 />
                                 <div className="media-fallback" style={{ display: 'none' }}>
                                   <div className="placeholder-icon">Image</div>
                                   <div className="placeholder-text">Image not available</div>
                                 </div>
                                                                    <button
                                     type="button"
                                     className="delete-image-btn"
                                     onClick={() => handleDeleteImage(imageUrl, editingPost.id)}
                                     title="Delete image"
                                   >
                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                       <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"/>
                                       <path d="M10 11v6M14 11v6"/>
                                     </svg>
                                   </button>
                               </div>
                             ))}
                           </div>
                         </div>
                       );
                     }
                    
                    // Video: Toisto - käytä media_urls kenttää
                    const mediaUrls = editingPost.media_urls || editingPost.mediaUrls || editingPost.originalData?.media_urls || [];
                    console.log('Edit modal mediaUrls:', mediaUrls);
                    console.log('Edit modal editingPost:', editingPost);
                    
                    const videoUrl = mediaUrls.find(url => 
                      url && (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('.avi'))
                    );
                    
                    if (videoUrl) {
                      console.log('Found video URL:', videoUrl);
                      return (
                        <video 
                          src={videoUrl} 
                          controls 
                          className="video-element"
                        >
                          Your browser does not support the video tag.
                        </video>
                      );
                    }
                    
                    // Fallback: käytä thumbnail kenttää jos se on video
                    if (editingPost.thumbnail && (editingPost.thumbnail.includes('.mp4') || editingPost.thumbnail.includes('.webm') || editingPost.thumbnail.includes('.mov') || editingPost.thumbnail.includes('.avi'))) {
                      console.log('Using thumbnail as video fallback:', editingPost.thumbnail);
                      return (
                        <video 
                          src={editingPost.thumbnail} 
                          controls 
                          className="video-element"
                        >
                          Your browser does not support the video tag.
                        </video>
                      );
                    }
                    
                    // Kuva: Vain preview - käytä mediaUrls kenttää
                    const imageUrl = mediaUrls.find(url => 
                      url && !url.includes('.mp4') && !url.includes('.webm') && !url.includes('.mov') && !url.includes('.avi')
                    );
                    
                    console.log('Found image URL:', imageUrl);
                    
                    if (imageUrl) {
                      return (
                        <img 
                          src={imageUrl} 
                          alt="thumbnail"
                          className="video-element"
                        />
                      );
                    }
                    
                    // Fallback: käytä thumbnail kenttää jos mediaUrls on tyhjä
                    if (editingPost.thumbnail && editingPost.thumbnail !== '/placeholder.png') {
                      console.log('Using thumbnail as fallback:', editingPost.thumbnail);
                      return (
                        <img 
                          src={editingPost.thumbnail} 
                          alt="thumbnail"
                          className="video-element"
                        />
                      );
                    }
                    
                    // Placeholder jos ei mediaa
                    return (
                      <div className="video-placeholder">
                        <span className="video-icon">Video</span>
                        <p>Ei videota saatavilla</p>
                      </div>
                    );
                  })()}
                    </div>
                  </div>
                </div>

                <div className="edit-modal-fields">
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
                                       {editingPost.source === 'reels' ? 'Reels' : `${editingPost.type || 'Post'}`}
                 </Button>
                 <Button 
                   type="button" 
                   variant="secondary"
                   style={{ 
                     padding: '8px 16px', 
                     fontSize: '14px'
                   }}
                 >
                                       {editingPost.source === 'reels' ? 'Voiceover' : 'Status'}
                 </Button>
               </div>

                             {/* Content Fields */}
               <div className="content-fields">
                 {/* "Kesken" sarakkeessa: Voiceover-muokkaus - vain Avatar-sarakkeessa (reels) */}
                 {editingPost.status === 'Kesken' && (editingPost.source === 'reels' || editingPost.type === 'Reels') && (
                   <>
                     {/* Näytä postauksen sisältö read-only tilassa */}
                     {editingPost.caption && (
                       <div className="form-group">
                         <label className="form-label">Postauksen sisältö (vain luku)</label>
                         <textarea
                           name="caption"
                           rows={4}
                           className="form-textarea"
                           defaultValue={editingPost.caption || ""}
                           placeholder="Postauksen sisältö..."
                           readOnly
                           style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                         />
                       </div>
                     )}
                     
                     <div className="form-group">
                       <label className="form-label">{editingPost.type === 'Carousel' ? 'Kuvaus' : 'Voiceover'}</label>
                       <textarea
                         name="voiceover"
                         rows={8}
                         className="form-textarea"
                         defaultValue={editingPost.voiceover || ""}
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
                   </>
                 )}

                 {/* "Kesken" sarakkeessa: Perusmuokkaus - Supabase-postauksille */}
                 {editingPost.status === 'Kesken' && editingPost.source === 'supabase' && (
                   <div className="form-group">
                     <label className="form-label">Kuvaus</label>
                     <textarea
                       name="caption"
                       rows={6}
                       className="form-textarea"
                       defaultValue={editingPost.caption || ""}
                       placeholder={t('posts.placeholders.caption')}
                     />
                   </div>
                 )}

                 {/* "Valmiina julkaisuun" sarakkeessa: Read-only näkymä + voiceover (vain luku) */}
                 {editingPost.status === 'Tarkistuksessa' && (
                   <>
                     <div className="form-group">
                       <label className="form-label">Kuvaus</label>
                       <textarea
                         name="caption"
                         rows={6}
                         className="form-textarea"
                         defaultValue={editingPost.caption || ""}
                         placeholder="Kuvaus (vain luku)"
                         readOnly
                         style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                       />
                     </div>

                     {/* Voiceover näkyy vain jos kyseessä on Reels */}
                     {(editingPost.source === 'reels' || editingPost.type === 'Reels') && (
                       <div className="form-group">
                         <label className="form-label">Voiceover (vain luku)</label>
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
                     <label className="form-label">Kuvaus</label>
                     <textarea
                       name="caption"
                       rows={4}
                       className="form-textarea"
                       defaultValue={editingPost.caption || ""}
                       placeholder={t('posts.placeholders.caption')}
                     />
                   </div>
                 )}

                 {/* Näytä julkaisupäivä kenttä vain jos status ei ole "Avatar" tai "Kesken" */}
                 {editingPost.status !== 'Avatar' && editingPost.status !== 'Kesken' && (
                   <div className="form-group">
                     <label className="form-label">{t('posts.modals.publishDate')}</label>
                     <input
                       name="publishDate"
                       type="datetime-local"
                       className="form-input"
                       defaultValue={editingPost.publishDate || ""}
                       placeholder={t('posts.modals.publishDatePlaceholder')}
                       readOnly={editingPost.status === 'Tarkistuksessa'}
                       style={editingPost.status === 'Tarkistuksessa' ? { backgroundColor: '#f8f9fa', color: '#6c757d' } : undefined}
                     />
                   </div>
                 )}
               </div>
             <div className="modal-actions">
                <div className="modal-actions-left">
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
                </div>
                <div className="modal-actions-right">
                  {editingPost.status !== 'Tarkistuksessa' && (
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      {t('posts.buttons.saveChanges')}
                    </Button>
                  )}
                  {/* Julkaisu-nappi vain jos status on "Valmiina julkaisuun" (Tarkistuksessa) tai "Aikataulutettu" */}
                  {(editingPost.status === 'Tarkistuksessa' || editingPost.status === 'Aikataulutettu') && (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        // Päivitä editingPost modaalissa muokatuilla tiedoilla
                        const form = document.querySelector('.modal-content form')
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
                        }
                        
                        // Sulje modaali ja avaa julkaisu-modaali
                        setShowEditModal(false)
                        setEditingPost(null)
                        handlePublishPost(updatedPost)
                      }}
                      style={{ 
                        backgroundColor: '#22c55e', 
                        marginLeft: '8px' 
                      }}
                    >
                      {t('posts.buttons.publish')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
              </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Publish Modal - Somekanavien valinta */}
      {showPublishModal && publishingPost && createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPublishModal(false)
              setPublishingPost(null)
              setSelectedAccounts([])
            }
          }}
        >
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Valitse somekanavat julkaisua varten</h2>
              <button
                onClick={() => {
                  setShowPublishModal(false)
                  setPublishingPost(null)
                  setSelectedAccounts([])
                }}
                className="modal-close-btn"
              >
                {t('posts.buttons.cancel')}
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label className="form-label">Julkaistava sisältö</label>
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
              
              {/* Päivämäärän valinta */}
              <div className="form-group">
                <label className="form-label">Julkaisupäivä</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="datetime-local"
                    id="publishDateTime"
                    name="publishDateTime"
                    value={publishingPost?.scheduledDate ? new Date(publishingPost.scheduledDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      const newDate = e.target.value ? new Date(e.target.value).toISOString() : null;
                      setPublishingPost(prev => ({
                        ...prev,
                        scheduledDate: newDate,
                        publishDate: e.target.value
                      }));
                    }}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      minWidth: '200px'
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    (Jätä tyhjäksi julkaistaksesi heti)
                  </span>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Valitse somekanavat</label>
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
                        className={`social-account-row${selectedAccounts.includes(account.mixpost_account_uuid) ? ' selected' : ''}`}
                        onClick={() => {
                          const isSelected = selectedAccounts.includes(account.mixpost_account_uuid)
                          if (isSelected) {
                            setSelectedAccounts(selectedAccounts.filter(id => id !== account.mixpost_account_uuid))
                          } else {
                            setSelectedAccounts([...selectedAccounts, account.mixpost_account_uuid])
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '2px solid #e0e0e0',
                          marginBottom: '12px',
                          background: selectedAccounts.includes(account.mixpost_account_uuid) ? '#f0f8ff' : '#fff',
                          borderColor: selectedAccounts.includes(account.mixpost_account_uuid) ? '#1976d2' : '#e0e0e0',
                          boxShadow: selectedAccounts.includes(account.mixpost_account_uuid) ? '0 4px 8px rgba(25, 118, 210, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                          transform: selectedAccounts.includes(account.mixpost_account_uuid) ? 'translateY(-1px)' : 'none',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          minHeight: '64px'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.mixpost_account_uuid)}
                          style={{
                            marginRight: '16px',
                            accentColor: '#1976d2',
                            width: '20px',
                            height: '20px',
                            flexShrink: 0,
                            cursor: 'pointer'
                          }}
                          onChange={() => {}} // Handled by onClick
                          tabIndex={-1}
                        />
                        {account.profile_image_url ? (
                          <img
                            src={account.profile_image_url}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              marginRight: '16px',
                              objectFit: 'cover',
                              border: '2px solid #e0e0e0',
                              transition: 'border-color 0.2s ease',
                              flexShrink: 0
                            }}
                            alt="Profiilikuva"
                            onError={e => {
                              if (e.target && e.target.style) {
                                e.target.style.display = 'none'
                              }
                              if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                                e.target.nextSibling.style.display = 'flex'
                              }
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            marginRight: '16px',
                            background: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            border: '2px solid #e0e0e0',
                            flexShrink: 0
                          }}>
                            {account.provider === 'instagram' ? 'Instagram' :
                             account.provider === 'facebook' ? 'Facebook' :
                                                            account.provider === 'linkedin' ? 'LinkedIn' : 'Yleinen'}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 600,
                            fontSize: '16px',
                            marginBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: '#333'
                          }}>
                            {account.account_name}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 500
                          }}>
                            {account.provider === 'instagram' && <>Instagram</>}
                                                          {account.provider === 'facebook' && <>Facebook</>}
                              {account.provider === 'linkedin' && <>LinkedIn</>}
                            {!['instagram','facebook','linkedin'].includes(account.provider) && account.provider}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <div className="modal-actions-left">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowPublishModal(false)
                      setPublishingPost(null)
                      setSelectedAccounts([])
                    }}
                  >
                    Peruuta
                  </Button>
                </div>
                <div className="modal-actions-right">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleConfirmPublish}
                    disabled={selectedAccounts.length === 0 || loadingAccounts}
                  >
                    {t('posts.buttons.publish')} valituille kanaville
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Success/Error Notifications */}
      {successMessage && (
        <div className="notification success-notification">
          <div className="notification-content">
            <span className="notification-icon">✅</span>
            <span className="notification-message">{successMessage}</span>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="notification error-notification">
          <div className="notification-content">
            <span className="notification-icon">❌</span>
            <span className="notification-message">{errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}