import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useMonthlyLimit } from '../hooks/useMonthlyLimit'
import { useNextMonthQuota } from '../hooks/useNextMonthQuota'
import Button from '../components/Button'
import ReactMarkdown from 'react-markdown'
import '../components/ModalComponents.css'
import './BlogNewsletterPage.css'

// Data muunnos funktio Supabase datasta
const transformSupabaseData = (supabaseData) => {
  if (!supabaseData || !Array.isArray(supabaseData)) {
    return []
  }
  

  
  const transformed = supabaseData.map(item => {

    // Muunnetaan Supabase status suomeksi
    const statusMap = {
      'Draft': 'Luonnos',
      'In Progress': 'Kesken', 
      'Under Review': 'Tarkistuksessa',
      'Scheduled': 'Aikataulutettu',
      'Done': 'Valmis',
      'Published': 'Julkaistu',
      'Deleted': 'Poistettu',
      'Archived': 'Arkistoitu'
    }
    
    let status = statusMap[item.status] || 'Luonnos'
    
    // Jos status on "Done" mutta publish_date on tulevaisuudessa, se on "Aikataulutettu"
    const now = new Date()
    const publishDate = item.publish_date ? new Date(item.publish_date) : null
    
    if (publishDate && publishDate > now && status === 'Julkaistu') {
      status = 'Aikataulutettu'
    }
    
    // Käytetään placeholder-kuvaa jos media_urls ei ole saatavilla tai on tyhjä
    const thumbnail = item.media_urls && item.media_urls.length > 0 && item.media_urls[0] 
      ? item.media_urls[0] 
      : '/placeholder.png'
    
    const transformedItem = {
      id: item.id,
      title: item.idea || item.caption || 'Nimetön sisältö',
      status: status,
      thumbnail: thumbnail,
      caption: item.caption || item.idea || 'Ei kuvausta',
      type: item.type || 'Blog',
      idea: item.idea || '',
      blog_post: item.blog_post || '',
      meta_description: item.meta_description || '',
      createdAt: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : null,
      scheduledDate: item.publish_date && publishDate > now ? new Date(item.publish_date).toISOString().split('T')[0] : null,
      publishedAt: item.publish_date && publishDate <= now ? new Date(item.publish_date).toISOString().split('T')[0] : null,
      publishDate: item.publish_date ? new Date(item.publish_date).toISOString().slice(0, 16) : null,
      mediaUrls: item.media_urls || [],
      hashtags: item.hashtags || [],
      voiceover: item.voiceover || '',
      voiceoverReady: item.voiceover_ready || false,
      originalData: item,
      source: 'supabase'
    }
    
    return transformedItem
  })
  
  return transformed
}

function ContentCard({ content, onView, onPublish, onArchive, onDownload, onEdit }) {
  const { t } = useTranslation('common')
  return (
    <div className="content-card">
      <div className="content-card-content">
        <div className="content-thumbnail">
          {content.thumbnail && content.thumbnail !== '/placeholder.png' ? (
            <>
              <img
                src={content.thumbnail}
                alt="thumbnail"
                onError={(e) => {
                  e.target.src = '/placeholder.png';
                }}
              />
              <button 
                className="download-button"
                onClick={() => onDownload(content.thumbnail, content.title)}
                title={t('blogNewsletter.actions.download')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </>
          ) : (
            <div className="placeholder-content">
              <img 
                src="/placeholder.png" 
                alt={t('blogNewsletter.placeholders.noMedia')}
                className="placeholder-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="placeholder-fallback" style={{ display: 'none' }}>
                <div className="placeholder-icon">📄</div>
                <div className="placeholder-text">{t('blogNewsletter.placeholders.noImage')}</div>
              </div>
            </div>
          )}
        </div>
        <div className="content-info">
          <div className="content-header">
            <h3 className="content-title">
              {content.title.includes('.') ? content.title.split('.')[0] + '.' : content.title}
            </h3>
            <div className="content-badges">
              <span className="content-type">
                {content.type === 'Blog' ? 'Blog' : content.type === 'Newsletter' ? 'Newsletter' : content.type}
              </span>
              <span className={`content-status ${content.status.toLowerCase().replace(' ', '-')}`}>
                {content.status}
              </span>
            </div>
          </div>
          <p className="content-caption">
            {content.meta_description ? 
              (content.meta_description.includes('.') ? content.meta_description.split('.')[0] + '.' : content.meta_description) :
              (content.caption.includes('.') ? content.caption.split('.')[0] + '.' : content.caption)
            }
          </p>
          <div className="content-footer">
            <span className="content-date">
              {content.scheduledDate ? content.scheduledDate : content.createdAt || content.publishedAt}
            </span>
            <div className="content-actions">
              <Button 
                variant="secondary" 
                onClick={() => onView(content)}
                style={{ fontSize: '11px', padding: '6px 10px' }}
              >
                {t('blogNewsletter.actions.view')}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => onEdit(content)}
                style={{ fontSize: '11px', padding: '6px 10px' }}
              >
                ✏️ Muokkaa
              </Button>
              {/* Julkaisu-nappi vain jos status on "Tarkistuksessa" */}
              {content.status === 'Tarkistuksessa' && (
                <Button
                  variant="primary"
                  onClick={() => onPublish(content)}
                  style={{ 
                    backgroundColor: '#22c55e', 
                    fontSize: '11px', 
                    padding: '6px 10px' 
                  }}
                >
                  {t('blogNewsletter.actions.publish')}
                </Button>
              )}
              {/* Arkistoi-nappi kaikille muille paitsi jo arkistoiduille */}
              {content.status !== 'Arkistoitu' && (
                <Button
                  variant="secondary"
                  onClick={() => onArchive(content)}
                  style={{ 
                    backgroundColor: '#e5e7eb', 
                    fontSize: '11px', 
                    padding: '6px 10px'
                  }}
                >
                  Arkistoi
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BlogNewsletterPage() {
  const { t, i18n } = useTranslation('common')
  const { user } = useAuth()
  const monthlyLimit = useMonthlyLimit()
  const nextMonthQuota = useNextMonthQuota()
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [activeTab, setActiveTab] = useState('main') // 'main' | 'archive'
  const [toast, setToast] = useState({ visible: false, message: '' })
    const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewingContent, setViewingContent] = useState(null)
  const [editingContent, setEditingContent] = useState(null)
 
  const hasInitialized = useRef(false)

  // Data haku Supabasesta
  const fetchContents = async () => {
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
      
      // Haetaan käyttäjän Blog ja Newsletter sisältö
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', userData.id)
        .in('type', ['Blog', 'Newsletter'])
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      const transformedData = transformSupabaseData(data)
      setContents(transformedData || [])
      
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
    fetchContents()
  }, [user])

  // Filtteröidään sisältö
  const filteredContents = contents
    // Tab-kohtainen perussuodatus
    .filter(content => activeTab === 'archive' ? content.status === 'Arkistoitu' : content.status !== 'Arkistoitu')
    // Hakusana, status ja tyyppi
    .filter(content => {
    const matchesSearch = (content.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (content.caption?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === '' || content.status === statusFilter
    const matchesType = typeFilter === '' || content.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })



  const handleCreateContent = async (contentData) => {
    try {
      // Estä luonti jos kuukausiraja täynnä
      if (!monthlyLimit.canCreate) {
        setShowCreateModal(false)
        setToast({ visible: true, message: 'Kuukausiraja täynnä' })
        setTimeout(() => setToast({ visible: false, message: '' }), 2500)
        return
      }
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


        const response = await fetch('/api/idea-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idea: contentData.title,
            content: contentData.content,
            type: contentData.type,
            companyId: userData.company_id
          })
        })

        if (!response.ok) {
          console.error('Idea generation failed:', response.status)
        } else {
          const result = await response.json()
        }
      } catch (webhookError) {
        console.error('Idea generation webhook error:', webhookError)
      }

      setShowCreateModal(false)
      setToast({ visible: true, message: 'Idea lähetetty! Sisältö generoidaan taustalla' })
      setTimeout(() => setToast({ visible: false, message: '' }), 2500)
      monthlyLimit.refresh()
      
    } catch (error) {
      console.error('Virhe uuden sisällön luomisessa:', error)
      setToast({ visible: true, message: 'Virhe: Ei voitu luoda sisältöä' })
      setTimeout(() => setToast({ visible: false, message: '' }), 2500)
    }
  }









  const handleViewContent = async (content) => {
    setViewingContent(content)
    setShowViewModal(true)
  }

  const handleEditContent = async (content) => {
    setEditingContent(content)
    setShowEditModal(true)
  }

  const handleUpdateContent = async (contentData) => {
    try {
      // Haetaan käyttäjän user_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      // Päivitetään content Supabase:sta
      const { error } = await supabase
        .from('content')
        .update({
          idea: contentData.title,
          caption: contentData.caption,
          meta_description: contentData.meta_description,
          type: contentData.type,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentData.id)
        .eq('user_id', userData.id)

      if (error) {
        throw error
      }

      // Päivitetään UI
      await fetchContents()
      setShowEditModal(false)
      setEditingContent(null)
      setToast({ visible: true, message: 'Sisältö päivitetty' })
      setTimeout(() => setToast({ visible: false, message: '' }), 2500)
      
    } catch (error) {
      console.error('Update error:', error)
      setToast({ visible: true, message: 'Päivitys epäonnistui: ' + error.message })
      setTimeout(() => setToast({ visible: false, message: '' }), 2500)
    }
  }

  const handleImageUpload = async (event, contentId) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      // Haetaan käyttäjän user_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      const formData = new FormData()
      formData.append('image', file)
      formData.append('contentId', contentId)
      formData.append('userId', userData.id)
      formData.append('replaceMode', 'true')

      const response = await fetch('/api/content-media-management', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Kuvan lataus epäonnistui')
      }

      // Päivitetään UI
      await fetchContents()
      setToast({ visible: true, message: 'Kuva päivitetty' })
      setTimeout(() => setToast({ visible: false, message: '' }), 2500)
      
    } catch (error) {
      console.error('Image upload error:', error)
      
      let errorMessage = 'Kuvan lataus epäonnistui: ' + error.message
      
      // Jos network error, anna selkeämpi viesti
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Verkkoyhteys ongelma. Tarkista internetyhteytesi ja kokeile uudelleen.'
      }
      
      setToast({ visible: true, message: errorMessage })
      setTimeout(() => setToast({ visible: false, message: '' }), 2500)
      
      // Näytä myös alert käyttäjälle
      alert('🚨 KUVA-LATAUS EPÄONNISTUI 🚨\n\nVirhe: ' + errorMessage + '\n\nOle hyvä ja:\n1. Tarkista internetyhteytesi\n2. Kokeile uudelleen\n3. Jos ongelma jatkuu, ota yhteyttä tukeen')
    }
  }

  const handlePublishContent = async (content) => {
    try {
      // Haetaan media-data suoraan Supabase:sta
      let mediaUrls = []
      let segments = []
      let mixpostConfig = null
      
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
      const { data: mixpostConfigData, error: mixpostError } = await supabase
        .from('user_mixpost_config')
        .select('mixpost_api_token, mixpost_workspace_uuid')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (mixpostError) {
        console.error('Error fetching Mixpost config:', mixpostError)
      } else {
        mixpostConfig = mixpostConfigData
      }

      // Haetaan content data
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .select('*')
        .eq('id', content.id)
        .eq('user_id', userData.id)
        .single()

      if (contentError) {
        console.error('Error fetching content:', contentError)
      } else {
        mediaUrls = contentData.media_urls || []
      }

      // Lähetetään data backend:iin, joka hoitaa Supabase-kyselyt
      const publishData = {
        post_id: content.id,
        user_id: user.id,
        auth_user_id: user.id,
        content: content.caption || content.title,
        media_urls: mediaUrls,
        scheduled_date: content.scheduledDate || null,
        publish_date: content.publishDate || null,
        post_type: content.type === 'Newsletter' ? 'post' : 'post', // Blog ja Newsletter ovat 'post' tyyppiä
        action: 'publish'
      }
      
      // Lisää Mixpost config data jos saatavilla
      if (mixpostConfig) {
        publishData.mixpost_api_token = mixpostConfig.mixpost_api_token
        publishData.mixpost_workspace_uuid = mixpostConfig.mixpost_workspace_uuid
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
      await fetchContents()
      setToast({ visible: true, message: result.message || 'Julkaistu' })
      setTimeout(() => setToast({ visible: false, message: '' }), 2500)
      
    } catch (error) {
      console.error('Publish error:', error)
      alert('Julkaisu epäonnistui: ' + error.message)
    }
  }

  const handleArchiveContent = async (content) => {
    try {
      // Haetaan käyttäjän user_id users-taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      const { error } = await supabase
        .from('content')
        .update({ status: 'Archived' })
        .eq('id', content.id)
        .eq('user_id', userData.id)

      if (error) throw error

      await fetchContents()
      setToast({ visible: true, message: 'Siirretty arkistoon' })
      setTimeout(() => setToast({ visible: false, message: '' }), 2500)
    } catch (err) {
      console.error('Archive error:', err)
      alert('Arkistointi epäonnistui: ' + err.message)
    }
  }

  const handleDeleteContent = async (contentId) => {
    try {
      // Haetaan käyttäjän user_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      // Poistetaan sisältö Supabase:sta
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId)
        .eq('user_id', userData.id)

      if (error) {
        throw error
      }

      // Päivitetään UI
      await fetchContents()
      setToast({ visible: true, message: 'Poistettu' })
      setTimeout(() => setToast({ visible: false, message: '' }), 2500)
      
    } catch (error) {
      console.error('Delete error:', error)
      alert('Poisto epäonnistui: ' + error.message)
    }
  }

  const handleDownloadImage = async (imageUrl, title) => {
    try {
      // Luodaan turvallinen tiedostonimi
      const safeTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
      const fileName = `${safeTitle}_image.jpg`
      
      // Haetaan kuva
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error('Kuvan lataus epäonnistui')
      }
      
      const blob = await response.blob()
      
      // Luodaan latauslinkki
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      
      // Siivotaan
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setToast({ visible: true, message: 'Kuva ladattu' })
      setTimeout(() => setToast({ visible: false, message: '' }), 2500)
      
    } catch (error) {
      console.error('Download error:', error)
      setToast({ visible: true, message: 'Lataus epäonnistui' })
      setTimeout(() => setToast({ visible: false, message: '' }), 2500)
    }
  }

  // ESC-näppäimellä sulkeutuminen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showCreateModal) {
          setShowCreateModal(false)
        }
        if (showViewModal) {
          setShowViewModal(false)
          setViewingContent(null)
        }
        if (showEditModal) {
          setShowEditModal(false)
          setEditingContent(null)
        }
      }
    }

    if (showCreateModal || showViewModal || showEditModal) {
      document.addEventListener('keydown', handleEscKey)
      return () => document.removeEventListener('keydown', handleEscKey)
    }
  }, [showCreateModal, showViewModal, showEditModal])

  return (
    <div className="blog-newsletter-container">
      {toast.visible && (
        <div className="toast-notice" role="status" aria-live="polite">{toast.message}</div>
      )}

      {/* Page Header */}
      <div className="blog-newsletter-header">
        <h2>{t('blogNewsletter.header')}</h2>
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

      {/* Tabs */}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'main' ? 'active' : ''}`}
          onClick={() => setActiveTab('main')}
        >
          Sisältö
        </button>
        <button 
          className={`tab-button ${activeTab === 'archive' ? 'active' : ''}`}
          onClick={() => setActiveTab('archive')}
        >
          Arkisto
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <input
          type="text"
          placeholder={t('blogNewsletter.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="">{t('blogNewsletter.filters.allStatuses')}</option>
          <option value="Luonnos">{t('blogNewsletter.status.Luonnos')}</option>
          <option value="Kesken">{t('blogNewsletter.status.Kesken')}</option>
          <option value="Tarkistuksessa">{t('blogNewsletter.status.Tarkistuksessa')}</option>
          <option value="Aikataulutettu">{t('blogNewsletter.status.Aikataulutettu')}</option>
          <option value="Valmis">{t('blogNewsletter.status.Valmis')}</option>
          <option value="Julkaistu">{t('blogNewsletter.status.Julkaistu')}</option>
        </select>
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="type-filter"
        >
          <option value="">{t('blogNewsletter.filters.allTypes')}</option>
          <option value="Blog">{t('blogNewsletter.types.blog')}</option>
          <option value="Newsletter">{t('blogNewsletter.types.newsletter')}</option>
        </select>
        <Button 
          variant="primary"
          onClick={() => {
            if (monthlyLimit.canCreate) {
              setShowCreateModal(true)
            } else {
              setToast({ visible: true, message: 'Kuukausiraja täynnä' })
              setTimeout(() => setToast({ visible: false, message: '' }), 2500)
            }
          }}
          disabled={!monthlyLimit.canCreate}
        >
          {t('blogNewsletter.actions.createNew')}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p>❌ {error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              window.location.reload()
            }}
          >
            {t('blogNewsletter.actions.retry')}
          </Button>
        </div>
      )}
        
      {/* Content Grid */}
      {!error && (
        <div className="content-grid">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>{t('blogNewsletter.loading.loadingContent')}</p>
            </div>
          ) : filteredContents.length === 0 ? (
            activeTab === 'archive' ? (
              <div className="empty-state">
                <div className="empty-icon"></div>
                <h3>Täällä ei ole vielä mitään</h3>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"></div>
                <h3>{t('blogNewsletter.empty.title')}</h3>
                <p>{t('blogNewsletter.empty.description')}</p>
                <Button 
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  {t('blogNewsletter.empty.createFirst')}
                </Button>
              </div>
            )
          ) : (
            filteredContents.map(content => (
              <ContentCard
                key={content.id}
                content={content}
                onView={handleViewContent}
                onPublish={handlePublishContent}
                onArchive={handleArchiveContent}
                onDownload={handleDownloadImage}
                onEdit={handleEditContent}
              />
            ))
          )}
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
          <div className="modal-container" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{t('blogNewsletter.createModal.title')}</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                handleCreateContent({
                  title: formData.get('title'),
                  content: formData.get('content'),
                  type: formData.get('type')
                })
              }}>
                <div className="form-group">
                  <label className="form-label">{t('blogNewsletter.createModal.fields.title')}</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="form-input"
                    placeholder={t('blogNewsletter.createModal.placeholders.title')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('blogNewsletter.createModal.fields.type')}</label>
                  <select
                    name="type"
                    required
                    className="form-select"
                  >
                    <option value="blog">Blog</option>
                    <option value="newsletter">Newsletter</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('blogNewsletter.createModal.fields.content')}</label>
                  <textarea
                    name="content"
                    rows={12}
                    required
                    className="form-textarea"
                    placeholder={t('blogNewsletter.createModal.placeholders.content')}
                  />
                </div>
                <div className="modal-actions">
                  <div className="modal-actions-left">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      {t('blogNewsletter.actions.cancel')}
                    </Button>
                  </div>
                  <div className="modal-actions-right">
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      {t('blogNewsletter.createModal.create')}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Modal */}
      {showViewModal && viewingContent && createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowViewModal(false)
            }
          }}
        >
          <div className="modal-container" style={{ maxWidth: '900px', height: '80vh' }}>
            <div className="modal-header">
              <h2 className="modal-title">{viewingContent.title}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="content-view">
                {/* Näytä thumbnail kuva jos saatavilla */}
                {viewingContent.thumbnail && viewingContent.thumbnail !== '/placeholder.png' ? (
                  <div className="view-thumbnail">
                    <img
                      src={viewingContent.thumbnail}
                      alt="Thumbnail"
                      className="view-thumbnail-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="view-thumbnail-placeholder" style={{ display: 'none' }}>
                      <img 
                        src="/placeholder.png" 
                        alt="Placeholder"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="view-thumbnail">
                    <img 
                      src="/placeholder.png" 
                      alt="Placeholder"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                    />
                  </div>
                )}
                
                <div className="content-meta">
                  <span className="content-type">
                {viewingContent.type === 'Blog' ? 'Blog' : 'Newsletter'}
                  </span>
                  <span className="content-date">
                    {viewingContent.createdAt ? new Date(viewingContent.createdAt).toLocaleDateString(i18n.language === 'fi' ? 'fi-FI' : 'en-US') : t('blogNewsletter.placeholders.noDate')}
                  </span>
                </div>
                <div className="content-body">
                  {/* Näytä blog_post jos se on olemassa, muuten caption */}
                  {viewingContent.blog_post ? (
                    <ReactMarkdown>{viewingContent.blog_post}</ReactMarkdown>
                  ) : viewingContent.caption ? (
                    <ReactMarkdown>{viewingContent.caption}</ReactMarkdown>
                  ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>{t('blogNewsletter.placeholders.noContent')}</p>
                  )}
                </div>
                
                {/* Näytä lisätietoja jos saatavilla */}
                {viewingContent.idea && viewingContent.idea !== viewingContent.title && (
                  <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>{t('blogNewsletter.viewModal.originalIdea')}</h4>
                    <p style={{ margin: '0', fontSize: '14px' }}>{viewingContent.idea}</p>
                  </div>
                )}
                
                {/* Näytä status */}
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                    {t('blogNewsletter.viewModal.status')} {viewingContent.status}
                  </span>
                </div>
              </div>
              <div className="modal-actions">
                <div className="modal-actions-left">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowViewModal(false)}
                  >
                    {t('blogNewsletter.actions.close')}
                  </Button>
                </div>
                <div className="modal-actions-right">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(t('blogNewsletter.alerts.deleteConfirm'))) {
                        handleDeleteContent(viewingContent.id)
                        setShowViewModal(false)
                      }
                    }}
                  >
                    {t('blogNewsletter.actions.delete')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {showEditModal && editingContent && createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false)
              setEditingContent(null)
            }
          }}
        >
          <div className="modal-container" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Muokkaa sisältöä</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingContent(null)
                }}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                handleUpdateContent({
                  id: editingContent.id,
                  title: formData.get('title'),
                  caption: formData.get('caption'),
                  meta_description: formData.get('meta_description'),
                  type: formData.get('type')
                })
              }}>
                <div className="form-group">
                  <label className="form-label">Otsikko</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="form-input"
                    defaultValue={editingContent.title}
                    placeholder="Sisällön otsikko"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tyyppi</label>
                  <select
                    name="type"
                    required
                    className="form-select"
                    defaultValue={editingContent.type}
                  >
                    <option value="Blog">Blog</option>
                    <option value="Newsletter">Newsletter</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kuvaus</label>
                  <textarea
                    name="caption"
                    rows={4}
                    className="form-textarea"
                    defaultValue={editingContent.caption}
                    placeholder="Sisällön kuvaus"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Meta Description</label>
                  <textarea
                    name="meta_description"
                    rows={3}
                    className="form-textarea"
                    defaultValue={editingContent.meta_description}
                    placeholder="SEO-kuvaus (näkyy hakukoneissa)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kuva</label>
                  <div className="image-upload-section">
                    {editingContent.thumbnail && editingContent.thumbnail !== '/placeholder.png' ? (
                      <div className="current-image">
                        <img src={editingContent.thumbnail} alt="Nykyinen kuva" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                        <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0' }}>
                          Nykyinen kuva. Käytä "Vaihda kuva" -nappia vaihtaaksesi.
                        </p>
                      </div>
                    ) : (
                      <p style={{ fontSize: '14px', color: '#666' }}>Ei kuvaa</p>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, editingContent.id)}
                      style={{ marginTop: '12px' }}
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <div className="modal-actions-left">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowEditModal(false)
                        setEditingContent(null)
                      }}
                    >
                      Peruuta
                    </Button>
                  </div>
                  <div className="modal-actions-right">
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      Tallenna muutokset
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
} 