import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'
import ReactMarkdown from 'react-markdown'
import './BlogNewsletterPage.css'

// Data muunnos funktio Supabase datasta
const transformSupabaseData = (supabaseData) => {
  if (!supabaseData || !Array.isArray(supabaseData)) return []
  

  
  return supabaseData.map(item => {

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
              <h2>Luo uusi sisältö</h2>
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
              handleCreateContent({
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
                  placeholder="Syötä sisällön otsikko..."
                />
              </div>
              <div className="form-group">
                <label>Tyyppi</label>
                <select
                  name="type"
                  required
                  className="form-select"
                >
                  <option value="Blog">📝 Blog</option>
                  <option value="Newsletter">📧 Newsletter</option>
                </select>
              </div>
              <div className="form-group">
                <label>Kuvaus</label>
                <textarea
                  name="caption"
                  rows={4}
                  className="form-textarea"
                  placeholder="Kirjoita sisällön kuvaus..."
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
                  Luo sisältö
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingContent && (
        <div 
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowViewModal(false)
              setViewingContent(null)
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <h2>Näytä sisältö</h2>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setViewingContent(null)
                }}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-form">
              {/* Thumbnail */}
              <div className="view-thumbnail">
                {viewingContent.thumbnail && viewingContent.thumbnail !== '/placeholder.png' && viewingContent.thumbnail !== '/media-placeholder.svg' ? (
                  <img
                    src={viewingContent.thumbnail}
                    alt="thumbnail"
                    className="view-thumbnail-image"
                    onError={(e) => {
                      e.target.src = '/media-placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="view-thumbnail-placeholder">
                    <span className="placeholder-icon">📄</span>
                    <p>Ei kuvaa</p>
                  </div>
                )}
              </div>

              {/* Sisällön tiedot */}
              <div className="view-content-info">
                {/* 1. Type */}
                <div className="view-field">
                  <label>Type</label>
                  <div className="view-value">
                    <span className="content-type-badge">
                      {viewingContent.type === 'Blog' ? '📝 Blog' : '📧 Newsletter'}
                    </span>
                  </div>
                </div>

                {/* 2. Caption */}
                <div className="view-field">
                  <label>Caption</label>
                  <div className="view-value">
                    {viewingContent.caption ? (
                      <div className="view-description">{viewingContent.caption}</div>
                    ) : (
                      <span className="empty-field">Ei captionia</span>
                    )}
                  </div>
                </div>

                {/* 3. Blog Post */}
                <div className="view-field">
                  <label>Blog Post</label>
                  <div className="view-value">
                    {viewingContent.blog_post ? (
                      <div className="view-blog-post">
                        <ReactMarkdown>{viewingContent.blog_post}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="empty-field">Ei blog postia</span>
                    )}
                  </div>
                </div>

                {/* Muut tiedot */}
                <div className="view-field">
                  <label>Status</label>
                  <div className="view-value">
                    <span className={`content-status-badge ${viewingContent.status.toLowerCase().replace(' ', '-')}`}>
                      {viewingContent.status}
                    </span>
                  </div>
                </div>

                <div className="view-field">
                  <label>Luotu</label>
                  <div className="view-value">{viewingContent.createdAt || 'Ei tietoa'}</div>
                </div>

                {viewingContent.scheduledDate && (
                  <div className="view-field">
                    <label>Ajastettu julkaisuun</label>
                    <div className="view-value">{viewingContent.scheduledDate}</div>
                  </div>
                )}

                {viewingContent.publishedAt && (
                  <div className="view-field">
                    <label>Julkaistu</label>
                    <div className="view-value">{viewingContent.publishedAt}</div>
                  </div>
                )}

                {viewingContent.hashtags && viewingContent.hashtags.length > 0 && (
                  <div className="view-field">
                    <label>Hashtagit</label>
                    <div className="view-value">
                      <div className="hashtags-list">
                        {viewingContent.hashtags.map((tag, index) => (
                          <span key={index} className="hashtag">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowViewModal(false)
                    setViewingContent(null)
                  }}
                >
                  Sulje
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
} 