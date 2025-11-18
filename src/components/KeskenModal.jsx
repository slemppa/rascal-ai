import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'
import Button from './Button'

const KeskenModal = ({ 
  show, 
  editingPost, 
  user,
  onClose, 
  onSave,
  t 
}) => {
  const [formData, setFormData] = useState({
    caption: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const fileInputRef = useRef(null)

  // Validoi media-tiedosto
  const validateMediaFile = (file) => {
    // Tarkista tiedostotyyppi - backend odottaa tiettyjä MIME-tyyppejä
    const validImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif'
    ]
    
    const validVideoTypes = [
      'video/mp4',
      'video/x-m4v'
    ]

    const validTypes = [...validImageTypes, ...validVideoTypes]
    
    if (!validTypes.includes(file.type)) {
      return `Tiedostotyyppi ${file.type} ei ole tuettu. Sallitut muodot: JPG, PNG, GIF, MP4, M4V`
    }

    return null // Ei virheitä
  }

  // Päivitä formData kun editingPost muuttuu
  // TÄRKEÄ: Älä resetoi formDataa jos käyttäjä on jo muuttanut sitä
  // Tämä estää tekstin katoamisen kun kuva vaihdetaan
  const hasUserEdited = useRef(false)
  const currentPostId = useRef(null)
  
  useEffect(() => {
    if (editingPost) {
      // Jos postaus on vaihtunut (eri ID), resetoi muokkaus-tila
      if (currentPostId.current !== editingPost.id) {
        hasUserEdited.current = false
        currentPostId.current = editingPost.id
        setFormData({
          caption: editingPost.caption || ''
        })
        return
      }
      
      // Jos sama postaus ja käyttäjä ei ole vielä muuttanut tekstiä, päivitä formData
      if (!hasUserEdited.current) {
        setFormData({
          caption: editingPost.caption || ''
        })
      }
      // Jos käyttäjä on muuttanut tekstiä, säilytä muokkaukset
      // Älä resetoi formDataa vaikka editingPost päivittyisi kuvan vaihdon jälkeen
    }
  }, [editingPost])
  
  // Seuraa kun käyttäjä muuttaa caption-kenttää
  const handleCaptionChange = (e) => {
    hasUserEdited.current = true
    setFormData({...formData, caption: e.target.value})
  }

  if (!show || !editingPost) return null

  // Kuvan poisto
  const handleDeleteImage = async (imageUrl) => {
    if (!imageUrl) return
    
    setImageLoading(true)
    setError('')
    
    try {
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user?.id)

      if (!userId) {
        setError('Käyttäjätietojen haku epäonnistui: Käyttäjää ei löytynyt')
        return
      }

      const response = await fetch('/api/content-media-management', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          contentId: editingPost.id,
          imageUrl: imageUrl
        })
      })

      if (!response.ok) {
        throw new Error('Kuvan poisto epäonnistui')
      }

      // Päivitä editingPost data
      const result = await response.json()
      onSave()
    } catch (err) {
      setError('Kuvan poisto epäonnistui: ' + err.message)
    } finally {
      setImageLoading(false)
    }
  }

  // Uuden kuvan lataus
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validoi tiedosto ennen latausta
    const validationError = validateMediaFile(file)
    if (validationError) {
      setError(validationError)
      // Tyhjennä file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setImageLoading(true)
    setError('')

    try {
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user?.id)

      if (!userId) {
        setError('Käyttäjätietojen haku epäonnistui: Käyttäjää ei löytynyt')
        return
      }

      // Jos on jo kuvia, poista ne kaikki ensin
      if (editingPost.media_urls && editingPost.media_urls.length > 0) {

        // Poista kaikki vanhat kuvat
        for (const imageUrl of editingPost.media_urls) {
          const deleteResponse = await fetch('/api/content-media-management', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              contentId: editingPost.id,
              imageUrl: imageUrl
            })
          })

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json().catch(() => ({}))
            throw new Error(`Vanhan kuvan poisto epäonnistui: ${errorData.error || deleteResponse.statusText}`)
          }
        }
      }

      const formData = new FormData()
      formData.append('image', file)
      formData.append('contentId', editingPost.id)
      formData.append('userId', userId)
      formData.append('replaceMode', 'true') // Flag että tämä on "vaihda kuva" -toiminto

      const response = await fetch('/api/content-media-management', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Kuvan lataus epäonnistui: ${errorData.error || response.statusText}`)
      }

      // Päivitä editingPost data
      const result = await response.json()
      
      // Tallenna myös caption tietokantaan samalla kun kuva vaihdetaan
      // Näin muokattu teksti ei katoa
      try {
        const userId = await getUserOrgId(user?.id)
        if (userId && formData.caption !== undefined) {
          const { error: updateError } = await supabase
            .from('content')
            .update({
              caption: formData.caption || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingPost.id)
            .eq('user_id', userId)

          if (updateError) {
            console.error('Caption update error:', updateError)
            // Jatketaan silti kuvan päivitystä
          }
        }
      } catch (captionError) {
        console.error('Error saving caption:', captionError)
        // Jatketaan silti kuvan päivitystä
      }
      
      // Päivitä editingPost state uudella kuvalla JA captionilla
      const updatedPost = {
        ...editingPost,
        media_urls: [result.publicUrl],
        mediaUrls: [result.publicUrl],
        thumbnail: result.publicUrl,
        caption: formData.caption || editingPost.caption || ''
      }
      
      // Tyhjennä file input Safari-yhteensopivuuden vuoksi
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Päivitä paikallinen state ensin, sitten kutsu onSave
      setFormData(prev => ({
        ...prev,
        // Lisää timestamp kuvan URL:een cache-busting:ia varten
        imageUpdated: Date.now()
      }))
      
      // Kutsu onSave pienen viiveen jälkeen, jotta state ehtii päivittyä
      // Älä sulje modaalia - anna käyttäjän nähdä uusi kuva ja jatkaa muokkausta
      setTimeout(() => {
        onSave(updatedPost)
      }, 100)
    } catch (err) {
      setError('Kuvan lataus epäonnistui: ' + err.message)
      // Tyhjennä file input myös virhetilanteessa
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setImageLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validoi merkkimäärä
    if (formData.caption.length > 2000) {
      setError('Postauksen pituus ylittää maksimin 2000 merkkiä')
      setLoading(false)
      return
    }

    try {
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user?.id)

      if (!userId) {
        setError('Käyttäjätietojen haku epäonnistui: Käyttäjää ei löytynyt')
        return
      }

      // Päivitä Supabase
      const { error: updateError } = await supabase
        .from('content')
        .update({
          caption: formData.caption || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id)
        .eq('user_id', userId)

      if (updateError) {
        setError('Tietojen tallentaminen epäonnistui')
        return
      }

      onSave()
    } catch (err) {
      setError('Tietojen tallentaminen epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div 
      className="modal-overlay modal-overlay--light"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // Tyhjennä file input kun modaali suljetaan
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          onClose()
        }
      }}
      onTouchEnd={(e) => {
        if (e.target === e.currentTarget) {
          // Tyhjennä file input kun modaali suljetaan
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          onClose()
        }
      }}
    >
      <div className="modal-container" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Muokkaa postausta</h2>
          <button
            onClick={() => {
              // Tyhjennä file input kun modaali suljetaan
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
              onClose()
            }}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
          {/* Luontipäivämäärä */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Luotu</label>
            <p className="form-text" style={{ 
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {editingPost.created_at ? new Date(editingPost.created_at).toLocaleString('fi-FI', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Ei tiedossa'}
            </p>
          </div>

            {/* Kaksi saraketta: media vasemmalle, kentät oikealle */}
            <div className="edit-modal-grid">
              {/* Vasen sarake: Media */}
              <div className="edit-modal-media">
                <div className="media-container">
                  {(() => {
                    const isCarousel = editingPost.type === 'Carousel'
                    const isPhotoType = editingPost.type === 'Photo' || editingPost.type === 'LinkedIn'
                    
                    // Carousel-tyyppisillä postauksilla näytetään kaikki slaidit
                    if (isCarousel && editingPost.segments && editingPost.segments.length > 0) {
                      return (
                        <div className="carousel-slides">
                          <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                            Slaidit ({editingPost.segments.length})
                          </h4>
                          <div className="slides-grid">
                            {editingPost.segments.map((segment, index) => (
                              <div key={segment.id || index} className="slide-item">
                                <div className="slide-number">
                                  {segment.slide_no || index + 1}
                                </div>
                                {segment.media_urls && segment.media_urls.length > 0 ? (
                                  <img 
                                    src={segment.media_urls[0]} 
                                    alt={`Slaidi ${segment.slide_no || index + 1}`}
                                    className="slide-image"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                      e.target.nextSibling.style.display = 'flex'
                                    }}
                                  />
                                ) : (
                                  <div className="slide-placeholder">
                                    <img src="/placeholder.png" alt="Ei mediaa" />
                                  </div>
                                )}
                                {/* Fallback placeholder - näkyy vain jos kuva ei lataa */}
                                <div className="slide-placeholder" style={{ display: 'none' }}>
                                  <img src="/placeholder.png" alt="Ei mediaa" />
                                </div>
                                {segment.caption && (
                                  <div className="slide-caption">
                                    {segment.caption}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    
                    // Muille tyypeille näytetään yksi kuva
                    const mediaUrl = editingPost.thumbnail || (editingPost.media_urls && editingPost.media_urls[0])
                    
                    if (!mediaUrl) {
                      return (
                        <div className="media-placeholder">
                          <img src="/placeholder.png" alt="Ei mediaa" />
                          {isPhotoType && (
                            <div className="media-controls">
                              <Button
                                type="button"
                                variant="primary"
                                size="small"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={imageLoading}
                                title="Sallitut muodot: JPG, PNG, GIF, MP4, M4V"
                              >
                                {imageLoading ? 'Ladataan...' : 'Lisää media'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    }
                    
                    if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
                      return (
                        <video 
                          src={mediaUrl} 
                          className="media-preview"
                          controls
                        />
                      )
                    }
                    
                    return (
                      <div className="media-wrapper">
                        {imageLoading && (
                          <div className="image-loading-overlay">
                            <div className="loading-spinner"></div>
                            <p>Ladataan uutta kuvaa...</p>
                          </div>
                        )}
                        <img 
                          src={`${mediaUrl}${formData.imageUpdated ? `?t=${formData.imageUpdated}` : ''}`}
                          alt="Postauksen media"
                          className="media-preview"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        {/* Kuvan hallintanapit - vain Photo-tyyppisille */}
                        {isPhotoType && (
                          <div className="media-controls">
                            <Button
                              type="button"
                              variant="secondary"
                              size="small"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={imageLoading}
                              style={{ marginRight: '8px' }}
                              title="Sallitut muodot: JPG, PNG, GIF, MP4, M4V"
                            >
                              {imageLoading ? 'Ladataan...' : 'Vaihda media'}
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="small"
                              onClick={() => handleDeleteImage(mediaUrl)}
                              disabled={imageLoading}
                            >
                              Poista kuva
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                  
                  {/* Fallback placeholder - näkyy vain jos kuva ei lataa */}
                  <div className="media-placeholder" style={{ display: 'none' }}>
                    <img src="/placeholder.png" alt="Ei mediaa" />
                    {(editingPost.type === 'Photo' || editingPost.type === 'LinkedIn') && (
                      <div className="media-controls">
                        <Button
                          type="button"
                          variant="primary"
                          size="small"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageLoading}
                          title="Sallitut muodot: JPG, PNG, GIF, WebP, MP4, WebM, MOV (max 10MB)"
                        >
                          {imageLoading ? 'Ladataan...' : 'Lisää media'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Piilotettu file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/x-m4v"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Oikea sarake: Postaus */}
              <div className="edit-modal-fields">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Postaus</label>
                    <span style={{ 
                      fontSize: '12px', 
                      color: formData.caption.length > 2000 ? '#ef4444' : '#6b7280',
                      fontWeight: formData.caption.length > 2000 ? '600' : '400'
                    }}>
                      {formData.caption.length} / 2000
                    </span>
                  </div>
                  <div className="post-content-box" style={{ height: '500px' }}>
                    <textarea
                      name="caption"
                      value={formData.caption}
                      onChange={handleCaptionChange}
                      className="form-textarea"
                      placeholder="Kirjoita postauksen kuvaus..."
                      style={{ 
                        border: formData.caption.length > 2000 ? '1px solid #ef4444' : '1px solid #e5e7eb', 
                        borderRadius: '8px', 
                        padding: '12px',
                        resize: 'none',
                        height: '100%',
                        width: '100%'
                      }}
                    />
                  </div>
                  {formData.caption.length > 2000 && (
                    <p style={{ 
                      color: '#ef4444', 
                      fontSize: '12px', 
                      marginTop: '4px',
                      fontWeight: '500'
                    }}>
                      Postauksen pituus ylittää maksimin 2000 merkkiä
                    </p>
                  )}
                </div>

              </div>
            </div>

            {error && (
              <div className="error-message" style={{ 
                color: '#ef4444', 
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <div className="modal-actions-left">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    // Tyhjennä file input kun modaali suljetaan
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                    onClose()
                  }}
                >
                  Peruuta
                </Button>
              </div>
              <div className="modal-actions-right">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || formData.caption.length > 2000}
                >
                  {loading ? 'Tallennetaan...' : 'Tallenna'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default KeskenModal

// CSS-tyylit
const styles = `
.edit-modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.edit-modal-media {
  display: flex;
  flex-direction: column;
}

.media-container {
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.media-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.image-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.image-loading-overlay p {
  margin: 0;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}

.media-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-controls {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.media-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  position: relative;
}

.media-placeholder img {
  width: 80px;
  height: 80px;
  opacity: 0.5;
  margin-bottom: 16px;
}

.edit-modal-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-content-box {
  background-color: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.carousel-slides {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.slides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  max-height: 450px;
  overflow-y: auto;
  padding-right: 8px;
}

.slide-item {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #f9fafb;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.slide-number {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  z-index: 2;
}

.slide-image {
  width: 100%;
  height: 80px;
  object-fit: cover;
  flex: 1;
}

.slide-placeholder {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  flex: 1;
}

.slide-placeholder img {
  width: 24px;
  height: 24px;
  opacity: 0.5;
}

.slide-caption {
  padding: 6px 8px;
  font-size: 11px;
  color: #6b7280;
  background: white;
  border-top: 1px solid #e5e7eb;
  max-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

@media (max-width: 768px) {
  .edit-modal-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .media-container {
    height: 250px;
  }
  
  .slides-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }
  
  .slide-item {
    min-height: 100px;
  }
  
  .slide-image {
    height: 60px;
  }
  
  .slide-placeholder {
    height: 60px;
  }
}
`

// Lisää tyylit head:iin
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
