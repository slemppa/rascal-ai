import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../utils/userApi'
import { useAuth } from '../contexts/AuthContext'
import { useMonthlyLimit } from '../hooks/useMonthlyLimit'
import { useNextMonthQuota } from '../hooks/useNextMonthQuota'
import { getUserOrgId } from '../lib/getUserOrgId'
import { usePosts } from '../hooks/usePosts'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { POST_STATUS_REVERSE_MAP } from '../constants/posts'
import Button from '../components/Button'
import PostsCalendar from '../components/PostsCalendar'
import PublishModal from '../components/PublishModal'
import AvatarModal from '../components/AvatarModal'
import KeskenModal from '../components/KeskenModal'
import TarkistuksessaModal from '../components/TarkistuksessaModal'
import AikataulutettuModal from '../components/AikataulutettuModal'
import MonthlyLimitWarning from '../components/MonthlyLimitWarning'
import UgcTab from '../components/UgcTab'
import CarouselsTab from '../components/CarouselsTab'
import KanbanTab from '../components/KanbanTab'
import PostCard from '../components/PostCard/PostCard'
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

// columns ja publishedColumn määritelmät siirretty KanbanTab-komponenttiin

// Transform funktiot siirretty usePosts hookiin


export default function ManagePostsPage() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const monthlyLimit = useMonthlyLimit()
  const nextMonthQuota = useNextMonthQuota()
  
  // Use usePosts hook for data management
  const {
    posts,
    reelsPosts,
    mixpostPosts,
    allPosts,
    socialAccounts,
    loading,
    reelsLoading,
    mixpostLoading,
    loadingAccounts,
    currentLoading,
    error,
    reelsError,
    currentError,
    fetchPosts,
    fetchReelsPosts,
    fetchMixpostPosts,
    fetchSocialAccounts,
    setPosts,
    setReelsPosts,
    setMixpostPosts
  } = usePosts(user, t)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dataSourceToggle, setDataSourceToggle] = useState('all') // 'all', 'supabase', 'reels'
  // Lataa tallennettu tab localStorageesta tai käytä oletusta
  const [activeTab, setActiveTabState] = useState(() => {
    const savedTab = localStorage.getItem('managePostsActiveTab')
    return savedTab && ['kanban', 'carousels', 'calendar', 'ugc'].includes(savedTab) ? savedTab : 'kanban'
  }) // 'kanban' | 'carousels' | 'calendar' | 'ugc'
  
  // Wrapper-funktio joka tallentaa tabin localStorageen
  const setActiveTab = (tab) => {
    setActiveTabState(tab)
    localStorage.setItem('managePostsActiveTab', tab)
  }
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createModalCount, setCreateModalCount] = useState(1)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadDragActive, setUploadDragActive] = useState(false)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishingPost, setPublishingPost] = useState(null)
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [editModalStep, setEditModalStep] = useState(1) // 1 = voiceover, 2 = avatar
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [avatarImages, setAvatarImages] = useState([]) // [{url, id}]
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [voiceoverReadyChecked, setVoiceoverReadyChecked] = useState(false)
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const [refreshingCalendar, setRefreshingCalendar] = useState(false)
  
  // Refs for character counting
  const textareaRef = useRef(null)
  const charCountRef = useRef(null)
  
  // Ref for file input
  const fileInputRef = useRef(null)
  
  // Ref for edit modal form
  const editFormRef = useRef(null)

  // fetchMixpostPosts siirretty usePosts hookiin

  // Hae avatar-kuvat kuten /settings sivulla (vain näyttö toistaiseksi)
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        if (!showEditModal || editModalStep !== 2) return
        if (!user) return

        setAvatarLoading(true)
        setAvatarError('')

        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
        const userId = await getUserOrgId(user.id)
        
        if (!userId) {
          setAvatarImages([])
          setAvatarError('Käyttäjää ei löytynyt')
          return
        }

        // Hae käyttäjätiedot API:n kautta
        const userData = await getCurrentUser()

        if (!userData?.company_id) {
          setAvatarImages([])
          setAvatarError('company_id puuttuu')
          return
        }

        // Kutsu avatar-status APIa
        const res = await fetch('/api/avatars/status', {
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

  // fetchPosts siirretty usePosts hookiin

  // Hae kaikki data kun sivu avataan (vain kerran)
  useEffect(() => {
    if (!user || hasInitialized.current) return
    
    hasInitialized.current = true
    fetchPosts()
    fetchReelsPosts() // Haetaan reels data automaattisesti
    fetchSocialAccounts() // Haetaan somekanavat
    fetchMixpostPosts() // Haetaan Mixpost postaukset
  }, [user])

  // Siirrä pois UGC-tabista jos feature poistetaan
  useEffect(() => {
    if (activeTab === 'ugc' && user) {
      const hasUgcFeature = user.features && Array.isArray(user.features) && user.features.includes('UGC')
      if (!hasUgcFeature) {
        setActiveTab('kanban')
      }
    }
  }, [user?.features, activeTab])

  // fetchSocialAccounts siirretty usePosts hookiin

  // Debounced search for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // fetchReelsPosts siirretty usePosts hookiin





  // allPosts, currentLoading, currentError käytetään hookista
  const currentPosts = allPosts
  
  // Filtteröidään postit
  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = (post.title?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
                         (post.caption?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase())
    const matchesStatus = statusFilter === '' || post.status === statusFilter
    const matchesType = typeFilter === '' || post.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // "Valmiina julkaisuun" (Tarkistuksessa) postaukset
  const readyPosts = filteredPosts.filter(post => post.status === 'Tarkistuksessa')

  // Kalenterin tarvitsemat eventit (ajastetut tai julkaisuajalla varustetut)
  const calendarItems = filteredPosts
    .map(p => {
      // Näytä kalenterissa vain julkaisut, joilla on publish_date (publishDate)
      if (!p.publishDate) return null

      let isoDate = null
      let time = ''

      try {
        // publishDate on joko ISO-muodossa (Z:llä) tai "YYYY-MM-DDTHH:MM" muodossa
        let d
        if (p.publishDate.includes('Z') || p.publishDate.includes('+')) {
          // ISO-muoto, käytä suoraan
          d = new Date(p.publishDate)
        } else {
          // Lisätään 'Z' loppuun jotta se tulkitaan UTC:nä
          const utcDateString = p.publishDate.endsWith('Z') ? p.publishDate : p.publishDate + 'Z'
          d = new Date(utcDateString)
        }
        
        if (!isNaN(d.getTime())) {
          isoDate = d.toISOString()
          // Näytä paikallinen aika (Europe/Helsinki)
          const localTime = d.toLocaleString('fi-FI', {
            timeZone: 'Europe/Helsinki',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
          time = localTime
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
      const count = postData.count || 1
      
      // Tarkista kuukausiraja ennen luontia
      // Jos luodaan useampi postaus, tarkista että riittää tilaa
      if (!monthlyLimit.canCreate) {
        setShowCreateModal(false)
        setErrorMessage('Kuukausiraja täynnä')
        return
      }
      
      // Tarkista että kuukausiraja riittää useamman postauksen luomiseen
      if (count > 1) {
        const remaining = monthlyLimit.remaining || 0
        if (remaining < count) {
          setShowCreateModal(false)
          setErrorMessage(`Kuukausiraja ei riitä. Voit luoda vielä ${remaining} postausta tässä kuussa.`)
          monthlyLimit.refresh()
          return
        }
      }

      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)
      
      if (!userId) {
        throw new Error(t('posts.messages.userIdNotFound'))
      }

      // Hae company_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', userId)
        .single()
      
      if (userError || !userData?.company_id) {
        throw new Error(t('posts.messages.companyIdNotFound'))
      }

      // Lähetetään idea-generation kutsu N8N:lle
      try {
        const response = await fetch('/api/ai/generate-ideas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idea: postData.title,
            type: postData.type,
            companyId: userData.company_id,
            caption: postData.caption,
            count: count
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
      if (count > 1) {
        setSuccessMessage(`${count} postausta lähetetty generoitavaksi`)
      } else {
        setSuccessMessage(t('posts.messages.ideaSent'))
      }
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
    console.log('handleEditPost called with:', { id: post.id, status: post.status, source: post.source, type: post.type })
    
    // Jos kyseessä on Mixpost-postaus, haetaan täysi data API:sta
    if (post.source === 'mixpost') {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token
        if (!token) {
          console.error('No auth token available')
          return
        }

        const response = await fetch('/api/integrations/mixpost/posts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          console.error('Failed to fetch Mixpost posts:', response.status)
          return
        }

        const data = await response.json()
        console.log('Fetched Mixpost posts:', data)
        
        // Etsi oikea postaus ID:n perusteella
        const fullPost = data.find(p => p.id === post.id)
        if (fullPost) {
          console.log('Found full Mixpost post:', fullPost)
          setEditingPost(fullPost)
          setShowEditModal(true)
          return
        } else {
          console.error('Post not found in Mixpost data')
        }
      } catch (error) {
        console.error('Error fetching Mixpost post:', error)
      }
    }
    
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
            segments: segmentsData || [],
            // Kopioi created_at suoraan editingPost:iin modaaleja varten
            created_at: post.originalData?.created_at || post.created_at
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
      // Kopioi created_at suoraan editingPost:iin modaaleja varten
      created_at: post.originalData?.created_at || post.created_at,
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
               // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
               const userId = await getUserOrgId(user.id)
               
               if (!userId) {
                 return
               }

               const { data: userData, error: userError } = await supabase
                 .from('users')
                 .select('company_id')
                 .eq('id', userId)
                 .single()

               if (userError || !userData?.company_id) {
                 console.error('Could not fetch company_id:', userError)
                 setErrorMessage(t('posts.messages.errorCompanyId'))
                 return
               }



               // Hae session token
               const { data: sessionData } = await supabase.auth.getSession()
               const token = sessionData?.session?.access_token
               
               if (!token) {
                 throw new Error('Käyttäjä ei ole kirjautunut')
               }

               const response = await fetch('/api/webhooks/voiceover-ready', {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${token}`
                 },
                 body: JSON.stringify({
                   recordId: editingPost.id,
                   voiceover: updatedData.voiceover,
                   voiceoverReady: updatedData.voiceoverReady
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


        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
        const userId = await getUserOrgId(user.id)

        if (!userId) {
          console.error('Could not fetch user_id')
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
          .eq('user_id', userId)

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
        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
        const userId = await getUserOrgId(user.id)

        if (!userId) {
          throw new Error(t('posts.messages.userIdNotFound'))
        }

        // Muutetaan status 'Deleted':ksi sen sijaan että poistetaan rivi
        const { error: updateError } = await supabase
          .from('content')
          .update({ status: 'Deleted' })
          .eq('id', post.id)
          .eq('user_id', userId)

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

  const handleSchedulePost = async (post, scheduledDate = null, selectedAccounts = []) => {
    try {
      // Jos päivämäärää ei annettu, kysytään käyttäjältä
      if (!scheduledDate) {
        scheduledDate = prompt(t('posts.messages.schedulePrompt'), 
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16))

        if (!scheduledDate) {
          return // Käyttäjä perui
        }
      }

      // Tarkista että on valittu vähintään yksi kanava
      if (!selectedAccounts || selectedAccounts.length === 0) {
        setErrorMessage('Valitse vähintään yksi somekanava')
        return
      }

      // Haetaan media-data suoraan Supabase:sta (sama logiikka kuin PublishModal)
      let mediaUrls = []
      let segments = []
      
      if (post.source === 'supabase') {
        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
        const userId = await getUserOrgId(user.id)

        if (!userId) {
          throw new Error(t('posts.messages.userIdNotFound'))
        }

        // Haetaan content data
        const { data: contentData, error: contentError } = await supabase
          .from('content')
          .select('*')
          .eq('id', post.id)
          .eq('user_id', userId)
          .single()

        if (contentError) {
          console.error('Error fetching content:', contentError)
        } else {
          mediaUrls = contentData.media_urls || []
          
          // Jos Carousel, haetaan segments data
          if (post.type === 'Carousel') {
            const { data: segmentsData, error: segmentsError } = await supabase
              .from('segments')
              .select('*')
              .eq('content_id', post.id)
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
        mediaUrls = post.mediaUrls || []
      }

      // Lähetetään data backend:iin, joka hoitaa Supabase-kyselyt (sama logiikka kuin PublishModal)
      const scheduleData = {
        post_id: post.id,
        user_id: user.id,
        auth_user_id: user.id,
        content: post.caption || post.title,
        media_urls: mediaUrls,
        scheduled_date: scheduledDate,
        publish_date: scheduledDate, // Käytetään scheduledDate myös publish_date:ksi
        post_type: post.type === 'Reels' ? 'reel' : post.type === 'Carousel' ? 'carousel' : 'post',
        action: 'schedule',
        selected_accounts: selectedAccounts // Lisätään valitut somekanavat
      }
      
      // Lisää segments-data Carousel-tyyppisillä postauksilla
      if (post.type === 'Carousel' && segments.length > 0) {
        scheduleData.segments = segments
      }

      const response = await fetch('/api/social/posts/actions', {
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

      // Optimistinen UI-päivitys - siirretään postaus heti sarakkeeseen
      const updatedPost = {
        ...post,
        status: 'Aikataulutettu',
        scheduledDate: scheduledDate,
        source: 'mixpost'
      }
      
      // Päivitetään paikallinen tila heti
      setPosts(prevPosts => {
        const filteredPosts = prevPosts.filter(p => p.id !== post.id)
        return [...filteredPosts, updatedPost]
      })

      setSuccessMessage(result.message || t('posts.messages.scheduleSuccess'))
      setShowEditModal(false)
      setEditingPost(null)

      // Haetaan data taustalla varmistamaan synkronointi
      setTimeout(async () => {
        await fetchPosts()
        if (post.source === 'reels') {
          await fetchReelsPosts()
        }
      }, 1000)
      
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
        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
        const userId = await getUserOrgId(user.id)

        if (!userId) {
          throw new Error(t('posts.messages.userIdNotFound'))
        }

        // Haetaan content data
        const { data: contentData, error: contentError } = await supabase
          .from('content')
          .select('*')
          .eq('id', publishingPost.id)
          .eq('user_id', userId)
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
      
      const response = await fetch('/api/social/posts/actions', {
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

      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)

      if (!userId) {
        throw new Error(t('posts.messages.userIdNotFound'))
      }

      // Käytetään vakiota status-mappaukselle
      const supabaseStatus = POST_STATUS_REVERSE_MAP[newStatus]
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
        .eq('user_id', userId)

      if (updateError) {
        throw new Error(t('posts.messages.supabaseUpdateFailed'))
      }

      // Optimistinen UI-päivitys - siirretään postaus heti sarakkeeseen
      const updatedPost = {
        ...post,
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      // Päivitetään paikallinen tila heti
      setPosts(prevPosts => {
        const filteredPosts = prevPosts.filter(p => p.id !== post.id)
        return [...filteredPosts, updatedPost]
      })

      setSuccessMessage(`Postaus siirretty sarakkeeseen: ${newStatus}`)

      // Haetaan data taustalla varmistamaan synkronointi
      setTimeout(async () => {
        await fetchPosts()
      }, 1000)
      
    } catch (error) {
      console.error('Move to next error:', error)
      setErrorMessage(t('posts.messages.moveError') + ' ' + error.message)
    }
  }

  const deleteMixpostPost = async (postUuid) => {
    try {
      console.log('🔵 deleteMixpostPost called with postUuid:', postUuid)
      console.log('🔵 postUuid type:', typeof postUuid)
      console.log('🔵 postUuid length:', postUuid?.length)
      
      // Hae access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Käyttäjä ei ole kirjautunut')
      }

      console.log('🔵 Access token found:', session.access_token.substring(0, 20) + '...')

      const requestBody = { postUuid }
      console.log('🔵 Request body:', requestBody)

      // Kutsu API endpointia
      const response = await fetch('/api/integrations/mixpost/delete-post', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('🔵 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API error response:', errorData)
        throw new Error(errorData.error || 'Postauksen poisto epäonnistui')
      }

      const result = await response.json()
      console.log('✅ Post deleted successfully:', result)

      // Päivitä paikallinen state
      await fetchPosts()
      await fetchMixpostPosts()

      return true
    } catch (error) {
      console.error('❌ Error deleting Mixpost post:', error)
      throw error
    }
  }

  // Kuvien hallinta content-media bucket:iin
  const handleDeleteImage = async (imageUrl, contentId) => {
    try {
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)
      
      if (!userId) {
        throw new Error('User ID not found')
      }

      const response = await fetch('/api/content/media-management', {
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
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)

      if (!userId) {
        throw new Error('User ID not found')
      }

      const formData = new FormData()
      formData.append('image', file)
      formData.append('contentId', contentId)
      formData.append('userId', userId)

      // Hae session ja tarkista että se on voimassa
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error('Session expired or invalid. Please log in again.')
      }

      console.log('DEBUG - Sending image upload request:', { contentId, userId })

      // Luodaan AbortController timeout:lle
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 sekuntia timeout

      const response = await fetch('/api/content/media-management', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('DEBUG - Upload failed:', errorData)
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
      
      let errorMessage = 'Image addition failed: ' + error.message
      
      // Jos timeout, anna selkeämpi viesti
      if (error.name === 'AbortError') {
        errorMessage = 'Image upload timed out. Please try again with a smaller image.'
      }
      
      // Jos network error, anna selkeämpi viesti
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      }
      
      setErrorMessage(errorMessage)
      
      // Näytä myös alert käyttäjälle
      alert('🚨 KUVA-LATAUS EPÄONNISTUI 🚨\n\nVirhe: ' + errorMessage + '\n\nOle hyvä ja:\n1. Tarkista internetyhteytesi\n2. Kokeile uudelleen\n3. Jos ongelma jatkuu, ota yhteyttä tukeen')
      
      // Jos session on vanhentunut, ohjaa takaisin login-sivulle
      if (error.message.includes('Session expired')) {
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
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
  useEscapeKey(() => {
    if (showEditModal) {
      setShowEditModal(false)
      setEditingPost(null)
    }
    if (showCreateModal) {
      setShowCreateModal(false)
    }
  })

  // Merkkien laskenta "Valmiina julkaisuun" (Tarkistuksessa) sarakkeelle
  useEffect(() => {
    if (showEditModal && editingPost && editingPost.status === 'Tarkistuksessa') {
      const textarea = textareaRef.current
      const charCount = charCountRef.current

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

      {/* Tabs + Search and Filters */}

      {/* Page Header */}
      <div className="posts-header">
        <h2>{t('posts.header')}</h2>
        <div className="quota-indicators">
          {monthlyLimit.loading ? (
            <div className="monthly-limit-indicator loading">
              Ladataan kuukausirajaa...
            </div>
          ) : (
            <div className={`monthly-limit-indicator ${monthlyLimit.remaining <= 5 ? 'warning' : 'normal'}`}>
              <span className="limit-text">
                {monthlyLimit.currentCount}/{monthlyLimit.monthlyLimit} generoitua sisältöä tässä kuussa
              </span>
              {monthlyLimit.remaining <= 5 && monthlyLimit.remaining > 0 && (
                <span className="warning-text">Vain {monthlyLimit.remaining} jäljellä</span>
              )}
              {monthlyLimit.remaining === 0 && (
                <span className="limit-reached">Kuukausiraja täynnä</span>
              )}
            </div>
          )}
          
          {nextMonthQuota.loading ? (
            <div className="monthly-limit-indicator loading">
              Ladataan seuraavan kuun kiintiötä...
            </div>
          ) : (
            <div className={`monthly-limit-indicator ${nextMonthQuota.nextMonthRemaining <= 5 ? 'warning' : 'normal'}`}>
              <span className="limit-text">
                {nextMonthQuota.nextMonthCount}/{nextMonthQuota.nextMonthLimit} generoitua sisältöä seuraavassa kuussa
              </span>
              {nextMonthQuota.nextMonthRemaining <= 5 && nextMonthQuota.nextMonthRemaining > 0 && (
                <span className="warning-text">Vain {nextMonthQuota.nextMonthRemaining} jäljellä</span>
              )}
              {nextMonthQuota.nextMonthRemaining === 0 && (
                <span className="limit-reached">Seuraavan kuun kiintiö täynnä</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs (moved below quotas, above search) */}
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'kanban' ? 'active' : ''}`}
          onClick={() => setActiveTab('kanban')}
        >
          Julkaisut
        </button>
        <button 
          className={`tab-button ${activeTab === 'carousels' ? 'active' : ''}`}
          onClick={() => setActiveTab('carousels')}
        >
          Karusellit
        </button>
        <button 
          className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Kalenteri
        </button>
        {user?.features && Array.isArray(user.features) && user.features.includes('UGC') && (
          <button 
            className={`tab-button ${activeTab === 'ugc' ? 'active' : ''}`}
            onClick={() => setActiveTab('ugc')}
          >
            UGC
          </button>
        )}
      </div>

      {/* Search and Filters - Piilotettu UGC-tabilta */}
      {activeTab !== 'ugc' && (
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
          <div className="button-group">
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
                  setCreateModalCount(1)
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
      )}


      {/* Error State */}
      {currentError && (
        <div className="error-state">
          <p>Virhe: {currentError}</p>
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
      {!currentError && !currentLoading && activeTab === 'kanban' && (
        <KanbanTab
          posts={filteredPosts}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          onPublish={handlePublishPost}
          onSchedule={handleSchedulePost}
          onMoveToNext={handleMoveToNext}
          t={t}
          onDeleteMixpostPost={deleteMixpostPost}
          onRefreshPosts={async () => {
            await fetchPosts()
            await fetchReelsPosts()
            await fetchMixpostPosts()
          }}
        />
      )}

      {/* Carousels View */}
      {activeTab === 'carousels' && (
        <CarouselsTab
          posts={filteredPosts}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          onPublish={handlePublishPost}
          onSchedule={handleSchedulePost}
          onMoveToNext={handleMoveToNext}
          t={t}
        />
      )}

      {/* Calendar View */}
      {activeTab === 'calendar' && (
        <div className="calendar-wrapper">
          <PostsCalendar 
            items={calendarItems}
            readyPosts={readyPosts}
            onSchedulePost={handleSchedulePost}
            socialAccounts={socialAccounts}
            selectedAccounts={selectedAccounts}
            setSelectedAccounts={setSelectedAccounts}
            loadingAccounts={loadingAccounts}
            onFetchSocialAccounts={fetchSocialAccounts}
            onRefresh={async () => {
              setRefreshingCalendar(true)
              try {
                await fetchPosts()
                await fetchReelsPosts()
                await fetchMixpostPosts()
              } catch (error) {
                console.error('Error refreshing calendar:', error)
              } finally {
                setRefreshingCalendar(false)
              }
            }}
            refreshing={refreshingCalendar}
            onEventClick={(ev) => {
              // Etsi vastaava postaus kaikista nykyisistä posteista
              const post = allPosts.find(p => p.id === ev.id)
              if (post) {
                handleEditPost(post)
              }
            }}
          />
        </div>
      )}

      {/* UGC View */}
      {activeTab === 'ugc' && <UgcTab />}

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
                const title = formData.get('title')?.trim() || ''
                const count = createModalCount || 1
                const type = formData.get('type') || ''
                
                // Validoi: otsikko vaaditaan vain jos lukumäärä on 1
                if (count === 1 && !title) {
                  alert('Otsikko on pakollinen kun luodaan yksi julkaisu')
                  return
                }
                
                // Validoi: tyyppi vaaditaan vain jos lukumäärä on 1
                if (count === 1 && !type) {
                  alert('Tyyppi on pakollinen kun luodaan yksi julkaisu')
                  return
                }
                
                handleCreatePost({
                  title: title,
                  type: count === 1 ? type : null,
                  caption: formData.get('caption'),
                  count: count
                })
                }}
                noValidate
              >
                <div className="form-group">
                  <label className="form-label">
                    Otsikko {createModalCount === 1 && <span className="form-required">*</span>}
                  </label>
                  <input
                    name="title"
                    type="text"
                    className="form-input"
                    placeholder="Anna julkaisulle otsikko..."
                  />
                  {createModalCount > 1 && (
                    <p className="form-hint">
                      Otsikko on valinnainen useamman julkaisun luonnissa
                    </p>
                  )}
                </div>
                {createModalCount === 1 && (
                  <div className="form-group">
                    <label className="form-label">Tyyppi <span className="form-required">*</span></label>
                    <select
                      name="type"
                      className="form-select"
                      defaultValue="Photo"
                    >
                      <option value="Photo">Photo</option>
                      <option value="Carousel">Carousel</option>
                      <option value="Reels">Reels</option>
                      <option value="LinkedIn">LinkedIn</option>
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Lukumäärä</label>
                  <input
                    name="count"
                    type="number"
                    min="1"
                    max="10"
                    value={createModalCount}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || 1
                      const clampedValue = Math.min(Math.max(newValue, 1), 10)
                      setCreateModalCount(clampedValue)
                    }}
                    required
                    className="form-input form-input-full"
                    placeholder="Kuinka monta postausta generoidaan?"
                  />
                  <p className="form-hint">
                    Valitse kuinka monta postausta haluat generoida (1-10)
                  </p>
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
                    // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
                    const userId = await getUserOrgId(user.id)
                    
                    if (!userId) {
                      throw new Error('Käyttäjän ID ei löytynyt')
                    }

                    // 2. Lataa tiedosto Supabase Storageen
                    const bucket = 'content-media'
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                    const filePath = `${userId}/${fileName}`

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
                        user_id: userId,
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
                        if (fileInputRef.current) {
                          const dataTransfer = new DataTransfer()
                          dataTransfer.items.add(file)
                          fileInputRef.current.files = dataTransfer.files
                        }
                        
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
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadPreviewUrl ? (
                      <div className="upload-preview">
                        {uploadPreviewUrl.startsWith('blob:') ? (
                          <video src={uploadPreviewUrl} className="upload-preview-video" controls />
                        ) : (
                          <img src={uploadPreviewUrl} alt="Preview" className="upload-preview-image" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadPreviewUrl(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ''
                            }
                          }}
                          className="upload-remove-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="upload-icon">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p className="upload-title">
                          Vedä ja pudota tiedosto tähän
                        </p>
                        <p className="upload-subtitle">
                          tai klikkaa valitaksesi tiedoston
                        </p>
                        <p className="upload-hint">
                          JPG, PNG, MP4, MOV (max 50MB)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    name="file"
                    type="file"
                    required
                    accept="image/*,video/*"
                    className="file-input-hidden"
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
            // Päivitä editingPost state uudella datalla
            setEditingPost(updatedPost)
            setSuccessMessage('Kuva vaihdettu onnistuneesti')
            
            // Päivitä myös posts-lista uudella datalla
            setPosts(prevPosts => 
              prevPosts.map(post => 
                post.id === updatedPost.id ? updatedPost : post
              )
            )
            
            // Älä sulje modaalia kun kuva vaihdetaan - anna käyttäjän nähdä uusi kuva
            // Modaali pysyy auki kunnes käyttäjä sulkee sen manuaalisesti
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
        show={showEditModal && editingPost && (
          editingPost.source === 'mixpost' || 
          editingPost.status === 'Aikataulutettu' || 
          editingPost.status === 'Luonnos'
        )}
        editingPost={editingPost}
        onClose={() => {
          setShowEditModal(false)
          setEditingPost(null)
        }}
        onEdit={async (result) => {
          console.log('ManagePostsPage - onEdit callback called with:', result)
          console.log('ManagePostsPage - result type:', typeof result)
          console.log('ManagePostsPage - result.wasScheduled:', result?.wasScheduled)
          console.log('ManagePostsPage - result.originalPost:', result?.originalPost)
          
          // Jos postaus ajastettiin Supabase-postauksesta, muunnetaan se Mixpost-postauksen muotoon
          // ja lisätään se mixpostPosts-listaan heti, jotta se näkyy "Aikataulutettu" -sarakkeessa
          if (result && result.wasScheduled && result.originalPost) {
            console.log('ManagePostsPage - Ajastetaan Supabase-postaus, muunnetaan Mixpost-postaukseksi')
            const originalPost = result.originalPost
            
            // Muunnetaan Supabase-postaus Mixpost-postauksen muotoon
            const mixpostPost = {
              id: result.mixpostUuid || originalPost.id,
              uuid: result.mixpostUuid || originalPost.id,
              title: originalPost.title || originalPost.caption || 'Ei otsikkoa',
              caption: originalPost.caption || '',
              status: 'Aikataulutettu',
              source: 'mixpost',
              thumbnail: originalPost.thumbnail || null,
              type: originalPost.type || 'Photo',
              scheduled_at: result.scheduledAt || null,
              createdAt: originalPost.createdAt || new Date().toISOString().split('T')[0],
              accounts: originalPost.accounts || [],
              versions: originalPost.versions || [],
              publishDate: result.scheduledAt ? new Date(result.scheduledAt).toISOString().slice(0, 16) : null,
              mediaUrls: originalPost.mediaUrls || originalPost.media_urls || [],
              media_urls: originalPost.mediaUrls || originalPost.media_urls || [],
              originalData: originalPost.originalData || {}
            }
            
            // Poistetaan postaus posts-listasta
            setPosts(prevPosts => prevPosts.filter(p => p.id !== originalPost.id))
            
            // Lisätään se mixpostPosts-listaan heti
            setMixpostPosts(prevPosts => {
              // Varmistetaan ettei postaus ole jo listassa
              const exists = prevPosts.some(p => p.uuid === mixpostPost.uuid || p.id === mixpostPost.id)
              if (exists) {
                // Päivitetään olemassa oleva postaus
                return prevPosts.map(p => 
                  (p.uuid === mixpostPost.uuid || p.id === mixpostPost.id) ? mixpostPost : p
                )
              }
              // Lisätään uusi postaus
              return [...prevPosts, mixpostPost]
            })
            
            // Haetaan Mixpost-postaukset taustalla varmistamaan synkronointi
            fetchMixpostPosts().catch(err => {
              console.warn('Mixpost-postauksien haku epäonnistui, mutta postaus näkyy jo listassa:', err)
            })
          } else {
            // Muuten päivitetään molemmat datalähteet
            await Promise.all([
              fetchPosts(),
              fetchMixpostPosts()
            ])
          }
          
          setShowEditModal(false)
          setEditingPost(null)
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
                <div className="status-indicator">
                  <div className={`status-dot ${editModalStep === 1 ? 'active' : ''}`}></div>
                  <div className={`status-dot ${editModalStep === 2 ? 'active' : ''}`}></div>
                </div>
              )}
              {/* Debug: Näytä status */}
              <div className="status-info">
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
                <form ref={editFormRef} onSubmit={(e) => {
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
                                      <div className="video-fallback hidden">
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
                                      <div className="video-fallback hidden">
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
                                 <div className="media-fallback hidden">
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
                   className="button-primary-inline"
                 >
                                       Sisältö
                 </Button>
                 <Button 
                   type="button" 
                   variant="secondary"
                   className="button-primary-inline"
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
                       <label className="form-label">
                         Kuvaus
                         <span ref={charCountRef} className="char-count char-count-inline"></span>
                       </label>
                       <textarea
                         ref={textareaRef}
                         name="caption"
                         rows={6}
                         className="form-textarea"
                         defaultValue={editingPost.caption || ""}
                         placeholder="Kuvaus (vain luku)"
                         readOnly
                         className="form-textarea form-input-disabled"
                       />
                     </div>

                     {/* Voiceover näkyy vain jos kyseessä on Reels tai Avatar */}
                     {(editingPost.source === 'reels' || editingPost.type === 'Reels' || editingPost.type === 'Avatar') && (
                       <div className="form-group">
                         <label className="form-label">Voiceover (vain luku)</label>
                         <textarea
                           name="voiceover"
                           rows={4}
                           className="form-textarea form-input-disabled"
                           defaultValue={editingPost.voiceover || ""}
                           placeholder="Voiceover-teksti..."
                           readOnly
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
                        if (!editFormRef.current) return
                        const formData = new FormData(editFormRef.current)
                        
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
                      className="button-success-inline"
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
                  <div className="avatar-section">
                    <h3 className="avatar-section-title">
                      Valitse avatar-kuva
                    </h3>
                    <p className="avatar-section-description">
                      Valitse avatar-kuva jota haluat käyttää tässä postauksessa.
                    </p>
                  </div>
                  
                  {/* Avatar-kuvat grid */}
                  <div className="avatar-grid">
                    {avatarLoading ? (
                      <div className="avatar-grid-loading">Ladataan kuvia…</div>
                    ) : avatarError ? (
                      <div className="avatar-grid-error">{avatarError}</div>
                    ) : avatarImages.length === 0 ? (
                      <div className="avatar-grid-empty">
                        <div className="avatar-grid-empty-text">
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
                            className={`avatar-item ${isSelected ? 'selected' : ''}`}
                            aria-pressed={isSelected}
                          >
                            <img 
                              src={img.url}
                              alt={`Avatar ${idx + 1}`}
                              className="avatar-item-image"
                            />
                            {isSelected && (
                              <span className="avatar-item-check">
                                ✓
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
                            // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
                            const userId = await getUserOrgId(user.id)
                            
                            if (!userId) {
                              setErrorMessage(t('posts.messages.userIdNotFound'))
                              return
                            }

                            const { data: userData, error: userError } = await supabase
                              .from('users')
                              .select('company_id')
                              .eq('id', userId)
                              .single()
                            if (userError || !userData?.company_id) {
                              setErrorMessage(t('posts.messages.errorCompanyId'))
                              return
                            }
                            // Hae session token
                            const { data: sessionData } = await supabase.auth.getSession()
                            const token = sessionData?.session?.access_token
                            
                            if (!token) {
                              throw new Error('Käyttäjä ei ole kirjautunut')
                            }

                            // Lähetä endpointiin
                            await fetch('/api/webhooks/voiceover-ready', {
                              method: 'POST',
                              headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                recordId: editingPost.id,
                                voiceover: editingPost.voiceover || null,
                                voiceoverReady: !!editingPost.voiceoverReady,
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
            setCreateModalCount(1)
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