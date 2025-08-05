import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'
import ReactMarkdown from 'react-markdown'
import '../components/ModalComponents.css'
import './BlogNewsletterPage.css'

// Data muunnos funktio Supabase datasta
const transformSupabaseData = (supabaseData) => {
  console.log('=== DEBUG: transformSupabaseData called ===')
  console.log('Input data:', supabaseData)
  console.log('Input data length:', supabaseData?.length || 0)
  
  if (!supabaseData || !Array.isArray(supabaseData)) {
    console.log('No data or not array, returning empty array')
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
      'Deleted': 'Poistettu'
    }
    
    let status = statusMap[item.status] || 'Luonnos'
    
    // Jos status on "Done" mutta publish_date on tulevaisuudessa, se on "Aikataulutettu"
    const now = new Date()
    const publishDate = item.publish_date ? new Date(item.publish_date) : null
    
    if (publishDate && publishDate > now && status === 'Julkaistu') {
      status = 'Aikataulutettu'
    }
    
    const transformedItem = {
      id: item.id,
      title: item.idea || item.caption || 'Nimetön sisältö',
      status: status,
      thumbnail: item.media_urls?.[0] || '/media-placeholder.svg',
      caption: item.caption || item.idea || 'Ei kuvausta',
      type: item.type || 'Blog',
      idea: item.idea || '',
      blog_post: item.blog_post || '',
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
  
  console.log('=== DEBUG: transformSupabaseData result ===')
  console.log('Transformed result:', transformed)
  console.log('Transformed result length:', transformed.length)
  
  return transformed
}

function ContentCard({ content, onView, onPublish }) {
  return (
    <div className="content-card">
      <div className="content-card-content">
        <div className="content-thumbnail">
          {content.thumbnail && content.thumbnail !== '/placeholder.png' && content.thumbnail !== '/media-placeholder.svg' ? (
            <img
              src={content.thumbnail}
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
                <div className="placeholder-icon">📄</div>
                <div className="placeholder-text">Ei kuvaa</div>
              </div>
            </div>
          )}
        </div>
        <div className="content-info">
          <div className="content-header">
            <h3 className="content-title">
              {content.title.length > 60 ? content.title.slice(0, 60) + '…' : content.title}
            </h3>
            <div className="content-badges">
              <span className="content-type">
                {content.type === 'Blog' ? '📝 Blog' : 
                 content.type === 'Newsletter' ? '📧 Newsletter' : 
                 content.type}
              </span>
              <span className={`content-status ${content.status.toLowerCase().replace(' ', '-')}`}>
                {content.status}
              </span>
            </div>
          </div>
          <p className="content-caption">
            {content.caption.length > 120 ? content.caption.slice(0, 120) + '…' : content.caption}
          </p>
          <div className="content-footer">
            <span className="content-date">
              {content.scheduledDate ? `📅 ${content.scheduledDate}` : content.createdAt || content.publishedAt}
            </span>
            <div className="content-actions">
              <Button 
                variant="secondary" 
                onClick={() => onView(content)}
                style={{ fontSize: '11px', padding: '6px 10px' }}
              >
                👁️ Näytä
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
                  📤 Julkaise
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
  const { user } = useAuth()
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingContent, setViewingContent] = useState(null)
 
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
      console.log('=== DEBUG: Raw data from Supabase ===')
      console.log('Raw data count:', data?.length || 0)
      console.log('Raw data:', data)
      console.log('=== DEBUG: Transformed data ===')
      console.log('Transformed data count:', transformedData?.length || 0)
      console.log('Transformed data:', transformedData)
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
  const filteredContents = contents.filter(content => {
    const matchesSearch = (content.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (content.caption?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === '' || content.status === statusFilter
    const matchesType = typeFilter === '' || content.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Debug: Tulostetaan filtteröity data
  console.log('=== DEBUG: Filtered contents ===')
  console.log('All contents count:', contents.length)
  console.log('Filtered contents count:', filteredContents.length)
  console.log('Search term:', searchTerm)
  console.log('Status filter:', statusFilter)
  console.log('Type filter:', typeFilter)
  console.log('Filtered contents:', filteredContents)

  const handleCreateContent = async (contentData) => {
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
          idea: contentData.title,
          type: contentData.type,
          companyId: userData.company_id
        })

        const response = await fetch('/api/idea-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idea: contentData.title,
            type: contentData.type,
            companyId: userData.company_id
          })
        })

        if (!response.ok) {
          console.error('Idea generation failed:', response.status)
        } else {
          const result = await response.json()
          console.log('Idea generation success:', result)
        }
      } catch (webhookError) {
        console.error('Idea generation webhook error:', webhookError)
      }

      setShowCreateModal(false)
      alert('Idea lähetetty AI:lle! Sisältö generoidaan taustalla.')
      
    } catch (error) {
      console.error('Virhe uuden sisällön luomisessa:', error)
      alert('Virhe: Ei voitu luoda sisältöä. Yritä uudelleen.')
    }
  }









  const handleViewContent = async (content) => {
    console.log('=== handleViewContent called ===')
    console.log('View content:', content)
    console.log('Content idea:', content.idea)
    console.log('Content blog_post:', content.blog_post)
    console.log('Content originalData:', content.originalData)
    
    setViewingContent(content)
    setShowViewModal(true)
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
      alert(result.message || 'Julkaisu onnistui!')
      
    } catch (error) {
      console.error('Publish error:', error)
      alert('Julkaisu epäonnistui: ' + error.message)
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
      alert('Sisältö poistettu onnistuneesti!')
      
    } catch (error) {
      console.error('Delete error:', error)
      alert('Poisto epäonnistui: ' + error.message)
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
      }
    }

    if (showCreateModal || showViewModal) {
      document.addEventListener('keydown', handleEscKey)
      return () => document.removeEventListener('keydown', handleEscKey)
    }
  }, [showCreateModal, showViewModal])

  return (
    <div className="blog-newsletter-container">
      {/* Page Header */}
      <div className="blog-newsletter-header">
        <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: '#1f2937', margin: 0 }}>Blog & Newsletter</h2>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <input
          type="text"
          placeholder="Etsi sisältöä..."
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
          <option value="Luonnos">Luonnos</option>
          <option value="Kesken">Kesken</option>
          <option value="Tarkistuksessa">Tarkistuksessa</option>
          <option value="Aikataulutettu">Aikataulutettu</option>
          <option value="Valmis">Valmis</option>
          <option value="Julkaistu">Julkaistu</option>
        </select>
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="type-filter"
        >
          <option value="">Kaikki tyypit</option>
          <option value="Blog">Blog</option>
          <option value="Newsletter">Newsletter</option>
        </select>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Luo uusi sisältö
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
            Yritä uudelleen
          </Button>
        </div>
      )}
        
      {/* Content Grid */}
      {!error && (
        <div className="content-grid">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Ladataan sisältöä...</p>
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>Ei sisältöä</h3>
              <p>Aloita luomalla uusi blog-artikkeli tai newsletter</p>
              <Button 
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                Luo ensimmäinen sisältö
              </Button>
            </div>
          ) : (
            filteredContents.map(content => (
              <ContentCard
                key={content.id}
                content={content}
                onView={handleViewContent}
                onPublish={handlePublishContent}
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
              <h2 className="modal-title">Luo uusi sisältö</h2>
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
                  <label className="form-label">Otsikko</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Syötä sisällön otsikko..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tyyppi</label>
                  <select
                    name="type"
                    required
                    className="form-select"
                  >
                    <option value="blog">📝 Blog</option>
                    <option value="newsletter">📧 Newsletter</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sisältö</label>
                  <textarea
                    name="content"
                    rows={12}
                    className="form-textarea"
                    placeholder="Kirjoita sisältö..."
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
                      Luo sisältö
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
                <div className="content-meta">
                  <span className="content-type">
                    {viewingContent.type === 'Blog' ? '📝 Blog' : '📧 Newsletter'}
                  </span>
                  <span className="content-date">
                    {viewingContent.createdAt ? new Date(viewingContent.createdAt).toLocaleDateString('fi-FI') : 'Ei päivämäärää'}
                  </span>
                </div>
                <div className="content-body">
                  {/* Näytä blog_post jos se on olemassa, muuten caption */}
                  {viewingContent.blog_post ? (
                    <ReactMarkdown>{viewingContent.blog_post}</ReactMarkdown>
                  ) : viewingContent.caption ? (
                    <ReactMarkdown>{viewingContent.caption}</ReactMarkdown>
                  ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>Ei sisältöä saatavilla</p>
                  )}
                </div>
                
                {/* Näytä lisätietoja jos saatavilla */}
                {viewingContent.idea && viewingContent.idea !== viewingContent.title && (
                  <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>Alkuperäinen idea:</h4>
                    <p style={{ margin: '0', fontSize: '14px' }}>{viewingContent.idea}</p>
                  </div>
                )}
                
                {/* Näytä status */}
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                    Status: {viewingContent.status}
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
                    Sulje
                  </Button>
                </div>
                <div className="modal-actions-right">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      if (window.confirm('Oletko varma, että haluat poistaa tämän sisällön?')) {
                        handleDeleteContent(viewingContent.id)
                        setShowViewModal(false)
                      }
                    }}
                  >
                    Poista
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
} 