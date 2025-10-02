import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useMonthlyLimit } from '../hooks/useMonthlyLimit'
import Button from '../components/Button'
import PostsCalendar from '../components/PostsCalendar'
import PublishModal from '../components/PublishModal'
import AvatarModal from '../components/AvatarModal'
import KeskenModal from '../components/KeskenModal'
import TarkistuksessaModal from '../components/TarkistuksessaModal'
import AikataulutettuModal from '../components/AikataulutettuModal'
import MonthlyLimitWarning from '../components/MonthlyLimitWarning'
import '../components/ModalComponents.css'
import '../components/MonthlyLimitWarning.css'
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
      provider: item.provider || null, // Lisätään provider-kenttä
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

function PostCard({ post, onEdit, onDelete, onPublish, onSchedule, onMoveToNext, onDragStart, onDragEnd, isDragging, hideActions = false, t }) {
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
            
            // Kuva: Näytä kaikki kuvat jos useampi, muuten vain thumbnail
            if (post.thumbnail) {
              // Tarkista onko useampi kuva media_urls-kentässä
              const mediaUrls = post.media_urls || post.mediaUrls || [];
              const hasMultipleImages = mediaUrls.length > 1;
              
              if (hasMultipleImages) {
                // Näytä kaikki kuvat pienenä gridinä
                return (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '2px', 
                    width: '100%', 
                    height: '100%' 
                  }}>
                    {mediaUrls.slice(0, 4).map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`media ${index + 1}`}
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
                    ))}
                    {mediaUrls.length > 4 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        +{mediaUrls.length - 4}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Näytä vain yksi kuva
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
            }
            
            // Placeholder jos ei mediaa
            return (
              <div className="placeholder-content">
                <img
                  src="/placeholder.png"
                  alt="Ei kuvaa"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.3
                  }}
                  onError={(e) => {
                    // Jos placeholder-kuva ei lataa, näytä tekstin
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="placeholder-fallback" style={{ display: 'none' }}>
                  <div className="placeholder-icon">🖼️</div>
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
                  {post.source === 'mixpost' && post.provider
                    ? (post.provider.charAt(0).toUpperCase() + post.provider.slice(1))
                    : (post.type === 'Carousel' ? 'Carousel' :  
                       post.type === 'Reels' ? 'Reels' :
                       post.type === 'Blog' ? 'Blog' : 
                       post.type === 'Newsletter' ? 'Newsletter' :  
                       post.type)}
                </span>
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
              {!hideActions && post.status !== 'Julkaistu' && (
                <>
                  {post.status !== 'Tarkistuksessa' && (
                    <Button 
                      variant="secondary" 
                      onClick={() => onEdit(post)}
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                    >
                      {post.source === 'reels' ? 'Tarkista' : t('posts.buttons.edit')}
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
                  
                  {post.status !== 'Aikataulutettu' && (
                    <Button 
                      variant="danger" 
                      onClick={() => onDelete(post)}
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                    >
                      {t('posts.buttons.delete')}
                    </Button>
                  )}
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
  const monthlyLimit = useMonthlyLimit()
  
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dataSourceToggle, setDataSourceToggle] = useState('all') // 'all', 'supabase', 'reels'
  const [activeTab, setActiveTab] = useState('kanban') // 'kanban' | 'calendar'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadDragActive, setUploadDragActive] = useState(false)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null)
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
  const [editModalStep, setEditModalStep] = useState(1) // 1 = voiceover, 2 = avatar
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [avatarImages, setAvatarImages] = useState([]) // [{url, id}]
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [voiceoverReadyChecked, setVoiceoverReadyChecked] = useState(false)
  const [mixpostPosts, setMixpostPosts] = useState([])
  const [mixpostLoading, setMixpostLoading] = useState(false)
  const [showLimitWarning, setShowLimitWarning] = useState(false)

  // Hae Mixpost postaukset
  const fetchMixpostPosts = async () => {
    try {
      setMixpostLoading(true)
      
      // Kutsu omaa proxy-endpointtia axiosilla
      const response = await axios.get('/api/mixpost-posts', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      const mixpostPosts = response.data
      
      // Käännä statusit suomeksi varmistukseksi (jos API ei ole tehnyt sitä)
      const statusMap = {
        'published': 'Julkaistu',
        'scheduled': 'Aikataulutettu', 
        'draft': 'Luonnos',
        'failed': 'Epäonnistui'
      }
      
      const translatedPosts = mixpostPosts.map(post => ({
        ...post,
        status: statusMap[post.status] || post.status
      }))
      
      // Näytä kaikki Mixpost-postaukset (sekä scheduled että published)
      setMixpostPosts(translatedPosts)
      
    } catch (error) {
      console.error('Mixpost fetch error:', error)
    } finally {
      setMixpostLoading(false)
    }
  }

  // Hae avatar-kuvat kuten /settings sivulla (vain näyttö toistaiseksi)
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        if (!showEditModal || editModalStep !== 2) return
        if (!user) return

        setAvatarLoading(true)
        setAvatarError('')

        // Hae company_id Supabasesta
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('company_id')
          .eq('auth_user_id', user.id)
          .single()

        if (userError || !userData?.company_id) {
          setAvatarImages([])
          setAvatarError('company_id puuttuu')
          return
        }

        // Kutsu avatar-status APIa
        const res = await fetch('/api/avatar-status.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: userData.company_id })
        })

        const data = await res.json()

        // Poimi Media[] URLit kuten SettingsPage.extractAvatarImages
        const extractAvatarImages = (apiData) => {
          if (!Array.isArray(apiData)) return []
          const images = []
          for (const record of apiData) {
            if (Array.isArray(record.Media)) {
              for (const media of record.Media) {
                let url = null
                if (media.thumbnails?.full?.url) url = media.thumbnails.full.url
                else if (media.thumbnails?.large?.url) url = media.thumbnails.large.url
                else if (media.url) url = media.url
                if (url) {
                  images.push({ url, id: media.id || url, variableId: record['Variable ID'] || record.id })
                }
              }
            }
            if (images.length >= 4) break
          }
          return images.slice(0, 4)
        }

        setAvatarImages(extractAvatarImages(data))
      } catch (e) {
        setAvatarError('Virhe avatar-kuvien haussa')
        setAvatarImages([])
      } finally {
        setAvatarLoading(false)
      }
    }

    fetchAvatars()
  }, [showEditModal, editModalStep, user])

  // Synkkaa voiceover checkboxin tila kun modaalin vaihe 1 avataan
  useEffect(() => {
    if (showEditModal && editModalStep === 1 && editingPost) {
      setVoiceoverReadyChecked(!!editingPost.voiceoverReady)
    }
  }, [showEditModal, editModalStep, editingPost])

  // Hae Mixpost postaukset kun sivu avataan
  useEffect(() => {
    if (user) {
      fetchMixpostPosts()
    }
  }, [user])
  
  // Drag & Drop states
  const [draggedPost, setDraggedPost] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  
  // Notification states
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const hasInitialized = useRef(false)
  const isUuid = (value) => typeof value === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)

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
  const allPosts = [...posts, ...reelsPosts, ...mixpostPosts]
  const currentPosts = allPosts
  const currentLoading = loading || reelsLoading
  const currentError = error || reelsError
  


  // Filtteröidään postit
  const filteredPosts = currentPosts.filter(post => {
    const matchesSearch = (post.title?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
                         (post.caption?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase())
    const matchesStatus = statusFilter === '' || post.status === statusFilter
    const matchesType = typeFilter === '' || post.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Kalenterin tarvitsemat eventit (ajastetut tai julkaisuajalla varustetut)
  const calendarItems = filteredPosts
    .map(p => {
      // Näytä kalenterissa vain julkaisut, joilla on publish_date (publishDate)
      if (!p.publishDate) return null

      let isoDate = null
      let time = ''

      try {
        const d = new Date(p.publishDate)
        if (!isNaN(d.getTime())) {
          isoDate = d.toISOString()
          const hh = String(d.getHours()).padStart(2, '0')
          const mm = String(d.getMinutes()).padStart(2, '0')
          time = `${hh}:${mm}`
        }
      } catch (err) {
        // Virheellinen päivämäärä, ohitetaan
      }

      if (!isoDate) return null

      const dateObj = new Date(isoDate)
      const yyyy = dateObj.getFullYear()
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
      const dd = String(dateObj.getDate()).padStart(2, '0')

      // Määritä kanava/alusta provider-kentästä
      let channel = null
      if (p.provider) {
        channel = p.provider.charAt(0).toUpperCase() + p.provider.slice(1)
      }

      return {
        id: p.id,
        title: p.title || 'Postaus',
        dateKey: `${yyyy}-${mm}-${dd}`,
        time,
        source: p.source || 'supabase',
        type: p.type || 'Post',
        status: p.status || '',
        channel: channel || null
      }
    })
    .filter(Boolean)

  const handleCreatePost = async (postData) => {
    try {
      // Tarkista kuukausiraja ennen luontia
      if (!monthlyLimit.canCreate) {
        setShowCreateModal(false)
        setErrorMessage('Kuukausiraja täynnä')
        return
      }

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
          // Tarkista onko kyse kuukausiraja-virheestä
          const errorData = await response.json().catch(() => null)
          if (errorData?.error?.includes('Monthly content limit exceeded')) {
            setShowCreateModal(false)
            setErrorMessage('Kuukausiraja ylitetty! Voit luoda uutta sisältöä vasta ensi kuussa.')
            monthlyLimit.refresh() // Päivitä raja-tiedot
            return
          }
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
      monthlyLimit.refresh() // Päivitä raja-tiedot onnistuneen luonnin jälkeen
      
    } catch (error) {
      console.error('Virhe uuden julkaisun luomisessa:', error)
      if (error.message?.includes('Monthly content limit exceeded')) {
        setErrorMessage('Kuukausiraja ylitetty! Voit luoda uutta sisältöä vasta ensi kuussa.')
        monthlyLimit.refresh()
      } else {
        setErrorMessage(t('posts.messages.errorCreating'))
      }
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
    setEditModalStep(1)
  }

  const handleSaveEdit = async (updatedData) => {
    if (editingPost) {
      // Käsittele julkaisupäivä
      let processedUpdatedData = { ...updatedData }

      // Lisää selectedAvatar id payloadiin jos valittu (variableId tai id)
      if (selectedAvatar) {
        processedUpdatedData.selectedAvatarId = selectedAvatar
      }
      
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

      // (Avatar webhook siirretty erilliseen käsittelijään vaiheessa 2)

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
          setErrorMessage('Käyttäjätietojen haku epäonnistui')
          return
        }

        // Päivitetään Supabase
        const { error: updateError } = await supabase
          .from('content')
          .update({
            caption: processedUpdatedData.caption || null,
            publish_date: processedUpdatedData.publishDate || null,
            selected_avatar_id: processedUpdatedData.selectedAvatarId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPost.id)
          .eq('user_id', userData.id)

        if (updateError) {
          console.error('Supabase update error:', updateError)
          setErrorMessage('Tietojen tallentaminen epäonnistui')
          return
        }

        setSuccessMessage('Tiedot tallennettu onnistuneesti')
      } catch (error) {
        console.error('Error updating Supabase:', error)
        setErrorMessage('Tietojen tallentaminen epäonnistui')
        return
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

  const handleConfirmPublish = async (publishDate) => {
    console.log('handleConfirmPublish called with:', { publishingPost, selectedAccounts, publishDate })
    
    if (!publishingPost || selectedAccounts.length === 0) {
      setErrorMessage(t('posts.messages.selectAccounts'))
      return
    }

    try {
      console.log('Starting publish process...')
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
        publish_date: publishDate || null, // Käytetään modaalista saatu publishDate
        post_type: publishingPost.type === 'Reels' ? 'reel' : publishingPost.type === 'Carousel' ? 'carousel' : 'post',
        action: 'publish',
        selected_accounts: selectedAccounts // Lisätään valitut somekanavat
      }
      
      // Lisää segments-data Carousel-tyyppisillä postauksilla
      if (publishingPost.type === 'Carousel' && segments.length > 0) {
        publishData.segments = segments
      }
      
      console.log('Sending publish data:', publishData)
      
      const response = await fetch('/api/post-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(publishData)
      })

      console.log('API response status:', response.status)
      const result = await response.json()
      console.log('API response data:', result)

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
    <>
      <div className="posts-container">
      {/* Page Header */}
      <div className="posts-header">
        <h2>{t('posts.header')}</h2>
        {monthlyLimit.loading ? (
          <div className="monthly-limit-indicator loading">
            Ladataan kuukausirajaa...
          </div>
        ) : (
          <div className={`monthly-limit-indicator ${monthlyLimit.remaining <= 5 ? 'warning' : 'normal'}`}>
            <span className="limit-text">
              {monthlyLimit.currentCount}/{monthlyLimit.monthlyLimit} sisältöä tässä kuussa
            </span>
            {monthlyLimit.remaining <= 5 && monthlyLimit.remaining > 0 && (
              <span className="warning-text">Vain {monthlyLimit.remaining} jäljellä</span>
            )}
            {monthlyLimit.remaining === 0 && (
              <span className="limit-reached">Kuukausiraja täynnä</span>
            )}
          </div>
        )}
      </div>

      {/* Tabs + Search and Filters */}
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'kanban' ? 'active' : ''}`}
          onClick={() => setActiveTab('kanban')}
        >
          Julkaisut
        </button>
        <button 
          className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Kalenteri
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="status-filter"
        >
          <option value="">Kaikki tyypit</option>
          <option value="Photo">Photo</option>
          <option value="Carousel">Carousel</option>
          <option value="Reels">Reels</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Video">Video</option>
        </select>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button 
            variant="secondary"
            onClick={() => setShowUploadModal(true)}
          >
            Tuo oma julkaisu
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              if (monthlyLimit.canCreate) {
                setShowCreateModal(true)
              } else {
                setErrorMessage('Kuukausiraja täynnä')
              }
            }}
            disabled={!monthlyLimit.canCreate}
          >
            Generoi uusi julkaisu
          </Button>
        </div>
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
      {!currentError && !loading && activeTab === 'kanban' && (
        <div className="kanban-board">
          {/* Ylemmät 4 saraketta */}
          <div className="kanban-top-row">
            {columns.map(column => {
                              // Filteröidään postit statusin JA lähteen mukaan
              let columnPosts = filteredPosts.filter(post => {
                // Avatar-sarakkeessa näytetään reels-dataa
                if (column.titleKey === 'posts.columns.avatar') {
                  return post.status === 'Kesken' && post.source === 'reels'
                }
                // Kesken-sarakkeessa näytetään vain Supabase-dataa "Kesken" statusilla
                else if (column.titleKey === 'posts.columns.inProgress') {
                  return post.status === 'Kesken' && post.source === 'supabase'
                }

                // Aikataulutettu-sarakkeessa näytetään Mixpost dataa
                else if (column.status === 'Aikataulutettu') {
                  return post.status === 'Aikataulutettu' && post.source === 'mixpost'
                }
                // Julkaistu-sarakkeessa näytetään sekä Supabase että Mixpost dataa
                else if (column.status === 'Julkaistu') {
                  return post.status === 'Julkaistu'
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
                          hideActions={column.status === 'Aikataulutettu'}
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

      {/* Calendar View */}
      {!currentError && !loading && activeTab === 'calendar' && (
        <div style={{ marginTop: 24 }}>
          <PostsCalendar 
            items={calendarItems}
            onEventClick={(ev) => {
              // Etsi vastaava postaus kaikista nykyisistä posteista
              const post = currentPosts.find(p => p.id === ev.id)
              if (post) {
                handleEditPost(post)
              }
            }}
          />
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
          <div className="modal-container modal-container--create">
            <div className="modal-header">
              <h2 className="modal-title">Generoi uusi julkaisu</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close-btn"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-content">
              <form 
                onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                handleCreatePost({
                  title: formData.get('title'),
                  type: formData.get('type'),
                  caption: formData.get('caption')
                })
                }}
              >
                <div className="form-group">
                  <label className="form-label">Otsikko</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Anna julkaisulle otsikko..."
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
                  <label className="form-label">Kuvaus (valinnainen)</label>
                  <textarea
                    name="caption"
                    rows={4}
                    className="form-textarea"
                    placeholder="Lisää kuvaus tai konteksti julkaisulle..."
                  />
                </div>
                <div className="modal-actions">
                  <div className="modal-actions-left">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Peruuta
                    </Button>
                  </div>
                  <div className="modal-actions-right">
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      Generoi
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Upload Modal */}
      {showUploadModal && createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUploadModal(false)
            }
          }}
        >
          <div className="modal-container modal-container--create">
            <div className="modal-header">
              <h2 className="modal-title">Tuo oma julkaisu</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="modal-close-btn"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-content">
              <form 
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target)
                  const file = formData.get('file')
                  const type = formData.get('type')
                  const title = formData.get('title')
                  const caption = formData.get('caption')

                  try {
                    setLoading(true)
                    
                    // 1. Hae user_id users-taulusta
                    const { data: userData, error: userError } = await supabase
                      .from('users')
                      .select('id')
                      .eq('auth_user_id', user.id)
                      .single()
                    
                    if (userError || !userData?.id) {
                      throw new Error('Käyttäjän ID ei löytynyt')
                    }

                    // 2. Lataa tiedosto Supabase Storageen
                    const bucket = 'content-media'
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                    const filePath = `${userData.id}/${fileName}`

                    const { error: uploadError } = await supabase.storage
                      .from(bucket)
                      .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                      })

                    if (uploadError) {
                      throw new Error(`Upload epäonnistui: ${uploadError.message}`)
                    }

                    // 3. Hae julkinen URL
                    const { data: urlData } = supabase.storage
                      .from(bucket)
                      .getPublicUrl(filePath)

                    const mediaUrl = urlData.publicUrl

                    // 4. Tallenna content-tauluun
                    const { error: insertError } = await supabase
                      .from('content')
                      .insert({
                        user_id: userData.id,
                        type: type,
                        idea: title || 'Tuotu julkaisu',
                        caption: caption || '',
                        media_urls: [mediaUrl],
                        status: 'In Progress',
                        is_generated: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      })

                    if (insertError) {
                      throw new Error(`Tallennus epäonnistui: ${insertError.message}`)
                    }

                    setShowUploadModal(false)
                    setSuccessMessage('Julkaisu tuotu onnistuneesti!')
                    await fetchPosts() // Päivitä lista
                  } catch (error) {
                    console.error('Upload error:', error)
                    setErrorMessage(error.message || 'Julkaisun tuonti epäonnistui')
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                <div className="form-group">
                  <label className="form-label">Tyyppi</label>
                  <select
                    name="type"
                    required
                    className="form-select"
                  >
                    <option value="Photo">Photo</option>
                    <option value="Reels">Reels</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Media</label>
                  <div
                    className={`upload-dropzone ${uploadDragActive ? 'drag-active' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setUploadDragActive(true)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setUploadDragActive(false)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setUploadDragActive(false)
                      
                      const files = e.dataTransfer.files
                      if (files && files[0]) {
                        const file = files[0]
                        const input = document.querySelector('input[name="file"]')
                        const dataTransfer = new DataTransfer()
                        dataTransfer.items.add(file)
                        input.files = dataTransfer.files
                        
                        // Preview
                        if (file.type.startsWith('image/')) {
                          const reader = new FileReader()
                          reader.onload = (e) => setUploadPreviewUrl(e.target.result)
                          reader.readAsDataURL(file)
                        } else if (file.type.startsWith('video/')) {
                          setUploadPreviewUrl(URL.createObjectURL(file))
                        }
                      }
                    }}
                    onClick={() => document.querySelector('input[name="file"]').click()}
                  >
                    {uploadPreviewUrl ? (
                      <div className="upload-preview">
                        {uploadPreviewUrl.startsWith('blob:') ? (
                          <video src={uploadPreviewUrl} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} controls />
                        ) : (
                          <img src={uploadPreviewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadPreviewUrl(null)
                            document.querySelector('input[name="file"]').value = ''
                          }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#9ca3af', marginBottom: '12px' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#374151' }}>
                          Vedä ja pudota tiedosto tähän
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                          tai klikkaa valitaksesi tiedoston
                        </p>
                        <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                          JPG, PNG, MP4, MOV (max 50MB)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    name="file"
                    type="file"
                    required
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        if (file.type.startsWith('image/')) {
                          const reader = new FileReader()
                          reader.onload = (e) => setUploadPreviewUrl(e.target.result)
                          reader.readAsDataURL(file)
                        } else if (file.type.startsWith('video/')) {
                          setUploadPreviewUrl(URL.createObjectURL(file))
                        }
                      }
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Otsikko (valinnainen)</label>
                  <input
                    name="title"
                    type="text"
                    className="form-input"
                    placeholder="Anna julkaisulle otsikko..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Postaus (valinnainen)</label>
                  <textarea
                    name="caption"
                    rows={4}
                    className="form-textarea"
                    placeholder="Kirjoita postauksen teksti..."
                  />
                </div>
                <div className="modal-actions">
                  <div className="modal-actions-left">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowUploadModal(false)}
                    >
                      Peruuta
                    </Button>
                  </div>
                  <div className="modal-actions-right">
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      Tuo julkaisu
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Kesken Modal */}
      <KeskenModal
        show={showEditModal && editingPost && editingPost.status === 'Kesken' && editingPost.source === 'supabase'}
        editingPost={editingPost}
        user={user}
        onClose={() => {
          setShowEditModal(false)
          setEditingPost(null)
        }}
        onSave={(updatedPost) => {
          if (updatedPost) {
            setEditingPost(updatedPost)
            setSuccessMessage('Kuva vaihdettu onnistuneesti')
            // Älä sulje modaalia kun kuva vaihdetaan
          } else {
            setSuccessMessage('Tiedot tallennettu onnistuneesti')
            setShowEditModal(false)
            setEditingPost(null)
            fetchPosts()
          }
        }}
        t={t}
      />

      {/* Tarkistuksessa Modal */}
      <TarkistuksessaModal
        show={showEditModal && editingPost && editingPost.status === 'Tarkistuksessa'}
        editingPost={editingPost}
        onClose={() => {
          setShowEditModal(false)
          setEditingPost(null)
        }}
        onPublish={() => {
          setShowEditModal(false)
          setEditingPost(null)
          handlePublishPost(editingPost)
        }}
        t={t}
      />

      {/* Aikataulutettu Modal */}
      <AikataulutettuModal
        show={showEditModal && editingPost && (editingPost.status === 'Aikataulutettu' || editingPost.status === 'Luonnos')}
        editingPost={editingPost}
        onClose={() => {
          setShowEditModal(false)
          setEditingPost(null)
        }}
        onEdit={() => {
          // TODO: Implement edit functionality
        }}
        t={t}
      />

      {/* Yleinen Edit Modal - poistettu, korvattu sarakkeittain */}
      {false && showEditModal && editingPost && editingPost.type !== 'Avatar' && editingPost.type !== 'Reels' && createPortal(
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
                {editingPost.status === 'Tarkistuksessa' ? t('posts.modals.viewTitle') : t('posts.modals.editTitle')}
              </h2>
              {/* Vaihe-indikaattori */}
              {false && editingPost.status === 'Kesken' && editingPost.source === 'reels' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: editModalStep === 1 ? '#3b82f6' : '#e5e7eb' 
                  }}></div>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: editModalStep === 2 ? '#3b82f6' : '#e5e7eb' 
                  }}></div>
                </div>
              )}
              {/* Debug: Näytä status */}
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Status: {editingPost.status} | Source: {editingPost.source}
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPost(null)
                  setEditModalStep(1)
                  setSelectedAvatar(null)
                }}
                className="modal-close-btn"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-content">
              {/* Vaihe 1: Voiceover-tarkistus */}
              {editModalStep === 1 && (
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target)
                  
                  // Jos kyseessä on reels-postaus, siirry vaiheeseen 2
                  if (editingPost.source === 'reels') {
                    setEditModalStep(2)
                    return
                  }
                  
                  // Muuten tallenna normaalisti
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
                    
                                         // Avatar: Show image
                     if (editingPost.type === 'Avatar') {
                       // Get media URLs from the correct source
                       let mediaUrls = editingPost.originalData?.media_urls || 
                                      editingPost.originalData?.mediaUrls ||
                                      editingPost.media_urls || 
                                      editingPost.mediaUrls || 
                                      [];
                       
                       
                       // If mediaUrls is empty but thumbnail exists, use thumbnail
                       if (mediaUrls.length === 0 && editingPost.thumbnail) {
                         mediaUrls = [editingPost.thumbnail];
                       }
                       
                       if (mediaUrls.length === 0) {
                         return (
                           <div className="content-media-management">
                             <div className="placeholder-media">
                               <div className="placeholder-icon">🖼️</div>
                               <div className="placeholder-text">Avatar-kuva ei saatavilla</div>
                             </div>
                           </div>
                         );
                       }
                       
                       return (
                         <div className="content-media-management">
                           <div className="avatar-preview">
                             <img 
                               src={mediaUrls[0]} 
                               alt="Avatar"
                               className="avatar-image"
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
                               <div className="placeholder-icon">🖼️</div>
                               <div className="placeholder-text">Avatar-kuva ei latautunut</div>
                             </div>
                           </div>
                         </div>
                       );
                     }
                     
                     // Carousel: Show images and management
                     if (editingPost.type === 'Carousel') {
                       // Get media URLs from the correct source - use thumbnail if media_urls is empty
                       let mediaUrls = editingPost.originalData?.media_urls || 
                                      editingPost.originalData?.mediaUrls ||
                                      editingPost.media_urls || 
                                      editingPost.mediaUrls || 
                                      [];
                       
                       
                       // If mediaUrls is empty but thumbnail exists, use thumbnail
                       if (mediaUrls.length === 0 && editingPost.thumbnail) {
                         mediaUrls = [editingPost.thumbnail];
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
                    
                    const videoUrl = mediaUrls.find(url => 
                      url && (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('.avi'))
                    );
                    
                    if (videoUrl) {
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
                                       Sisältö
                 </Button>
                 <Button 
                   type="button" 
                   variant="secondary"
                   style={{ 
                     padding: '8px 16px', 
                     fontSize: '14px'
                   }}
                 >
                                        Status
                 </Button>
               </div>

                             {/* Content Fields */}
               <div className="content-fields">
                 {/* Avatar/Reels: Ei näytetä tässä, vaan AvatarModal-komponentissa */}

                 {/* Muut Kesken: Postauksen sisältö muokattava */}
                 {editingPost.status === 'Kesken' && !(editingPost.source === 'reels' || editingPost.type === 'Reels' || editingPost.type === 'Avatar') && (
                   <div className="form-group">
                     <label className="form-label">Postauksen sisältö</label>
                     <textarea
                       name="caption"
                       rows={6}
                       className="form-textarea"
                       defaultValue={editingPost.caption || ""}
                       placeholder="Kirjoita postauksen sisältö..."
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

                     {/* Voiceover näkyy vain jos kyseessä on Reels tai Avatar */}
                     {(editingPost.source === 'reels' || editingPost.type === 'Reels' || editingPost.type === 'Avatar') && (
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

                 {/* Näytä julkaisupäivä kenttä vain jos status ei ole "Avatar", "Kesken" tai "Tarkistuksessa" */}
                 {editingPost.status !== 'Avatar' && editingPost.status !== 'Kesken' && editingPost.status !== 'Tarkistuksessa' && (
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                </div>
                <div className="modal-actions-right">
                  {editingPost.status !== 'Tarkistuksessa' && (
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={editingPost.status === 'Kesken' && (editingPost.source === 'reels' || editingPost.type === 'Avatar') && editModalStep === 1 && !voiceoverReadyChecked}
                    >
                      {editingPost.status === 'Kesken' && (editingPost.source === 'reels' || editingPost.type === 'Avatar') && editModalStep === 1 ? 'Seuraava' : t('posts.buttons.saveChanges')}
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
              )}
              
              {/* Vaihe 2: Avatar-valinta */}
              {editModalStep === 2 && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                      Valitse avatar-kuva
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                      Valitse avatar-kuva jota haluat käyttää tässä postauksessa.
                    </p>
                  </div>
                  
                  {/* Avatar-kuvat grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    {avatarLoading ? (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280' }}>Ladataan kuvia…</div>
                    ) : avatarError ? (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#b91c1c' }}>{avatarError}</div>
                    ) : avatarImages.length === 0 ? (
                      <div style={{ 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        padding: '8px',
                        textAlign: 'center',
                        backgroundColor: '#f9fafb'
                      }}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Ei avatar-kuvia saatavilla
                        </div>
                      </div>
                    ) : (
                      avatarImages.map((img, idx) => {
                        const avatarId = img.variableId || img.id
                        const isSelected = selectedAvatar === avatarId
                        return (
                          <button
                            key={img.id || idx}
                            type="button"
                            onClick={() => setSelectedAvatar(avatarId)}
                            style={{
                              border: isSelected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              position: 'relative',
                              padding: 0,
                              cursor: 'pointer',
                              outline: 'none',
                              background: 'transparent'
                            }}
                            aria-pressed={isSelected}
                          >
                            <img 
                              src={img.url}
                              alt={`Avatar ${idx + 1}`}
                              style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                            />
                            {isSelected && (
                              <span style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                borderRadius: '9999px',
                                padding: '4px 8px',
                                fontSize: '12px'
                              }}>
                                Valittu
                              </span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                  
                  {/* Napit */}
                  <div className="modal-actions">
                    <div className="modal-actions-left">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditModalStep(1)}
                      >
                        ← Takaisin
                      </Button>
                    </div>
                    <div className="modal-actions-right">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={async () => {
                          if (!selectedAvatar) return
                          try {
                            // Hae company_id
                            const { data: userData, error: userError } = await supabase
                              .from('users')
                              .select('company_id')
                              .eq('auth_user_id', user.id)
                              .single()
                            if (userError || !userData?.company_id) {
                              setErrorMessage(t('posts.messages.errorCompanyId'))
                              return
                            }
                            // Lähetä endpointiin
                            await fetch('/api/voiceover-ready', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                recordId: editingPost.id,
                                voiceover: editingPost.voiceover || null,
                                voiceoverReady: !!editingPost.voiceoverReady,
                                companyId: userData.company_id,
                                selectedAvatarId: selectedAvatar,
                                action: 'avatar_selected'
                              })
                            })
                            setSuccessMessage('Avatar valittu tälle postaukselle')
                          } catch (e) {
                            console.error('Avatar selection send failed:', e)
                            setErrorMessage('Avatarin valinta epäonnistui')
                          } finally {
                            setShowEditModal(false)
                            setEditingPost(null)
                            setEditModalStep(1)
                          }
                        }}
                        disabled={!selectedAvatar}
                      >
                        Valmis
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal - Kesken & Tarkistuksessa poistettu erillisinä; palattu yleiseen modaalin käyttöön */}

      {/* Avatar Modal */}
      <AvatarModal
        show={showEditModal && editingPost && editingPost.source === 'reels'}
        editingPost={editingPost}
        editModalStep={editModalStep}
        setEditModalStep={setEditModalStep}
        selectedAvatar={selectedAvatar}
        setSelectedAvatar={setSelectedAvatar}
        avatarImages={avatarImages}
        setAvatarImages={setAvatarImages}
        avatarLoading={avatarLoading}
        setAvatarLoading={setAvatarLoading}
        avatarError={avatarError}
        setAvatarError={setAvatarError}
        voiceoverReadyChecked={voiceoverReadyChecked}
        setVoiceoverReadyChecked={setVoiceoverReadyChecked}
        user={user}
        onClose={() => {
          setShowEditModal(false)
          setEditingPost(null)
          setEditModalStep(1)
          setSelectedAvatar(null)
        }}
        onSave={() => {
          setSuccessMessage('Avatar valittu tälle postaukselle')
          setShowEditModal(false)
          setEditingPost(null)
          setEditModalStep(1)
          setSelectedAvatar(null)
          setVoiceoverReadyChecked(false)
          fetchPosts()
        }}
        t={t}
      />

      {/* Publish Modal */}
      <PublishModal
        show={showPublishModal}
        publishingPost={publishingPost}
        socialAccounts={socialAccounts}
        selectedAccounts={selectedAccounts}
        setSelectedAccounts={setSelectedAccounts}
        loadingAccounts={loadingAccounts}
        onClose={() => {
          setShowPublishModal(false)
          setShowEditModal(true)
        }}
        onConfirm={handleConfirmPublish}
        t={t}
      />

      {/* Monthly Limit Warning Modal */}
      {showLimitWarning && createPortal(
        <MonthlyLimitWarning
          limitData={monthlyLimit}
          onClose={() => setShowLimitWarning(false)}
          onCreateAnyway={() => {
            setShowLimitWarning(false)
            setShowCreateModal(true)
          }}
        />,
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
    </>
  )
}