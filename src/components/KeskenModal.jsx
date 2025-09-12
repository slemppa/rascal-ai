import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
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

  // Päivitä formData kun editingPost muuttuu
  useEffect(() => {
    if (editingPost) {
      setFormData({
        caption: editingPost.caption || ''
      })
    }
  }, [editingPost])

  if (!show || !editingPost) return null

  // Kuvan poisto
  const handleDeleteImage = async (imageUrl) => {
    if (!imageUrl) return
    
    setImageLoading(true)
    setError('')
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single()

      if (userError || !userData?.id) {
        setError('Käyttäjätietojen haku epäonnistui: ' + (userError?.message || 'Käyttäjää ei löytynyt'))
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

    setImageLoading(true)
    setError('')

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single()

      if (userError || !userData?.id) {
        setError('Käyttäjätietojen haku epäonnistui: ' + (userError?.message || 'Käyttäjää ei löytynyt'))
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
            throw new Error('Vanhan kuvan poisto epäonnistui')
          }
        }
      }

      const formData = new FormData()
      formData.append('image', file)
      formData.append('contentId', editingPost.id)
      formData.append('userId', userData.id)
      formData.append('replaceMode', 'true') // Flag että tämä on "vaihda kuva" -toiminto

      const response = await fetch('/api/content-media-management', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Kuvan lataus epäonnistui')
      }

      // Päivitä editingPost data
      const result = await response.json()
      
      // Päivitä editingPost state uudella kuvalla
      const updatedPost = {
        ...editingPost,
        media_urls: [result.publicUrl],
        mediaUrls: [result.publicUrl],
        thumbnail: result.publicUrl
      }
      
      onSave(updatedPost)
    } catch (err) {
      setError('Kuvan lataus epäonnistui: ' + err.message)
    } finally {
      setImageLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Hae käyttäjän user_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single()

      if (userError || !userData?.id) {
        setError('Käyttäjätietojen haku epäonnistui: ' + (userError?.message || 'Käyttäjää ei löytynyt'))
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
        .eq('user_id', userData.id)

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
          onClose()
        }
      }}
    >
      <div className="modal-container" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Muokkaa postausta</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            {/* Kaksi saraketta: media vasemmalle, kentät oikealle */}
            <div className="edit-modal-grid">
              {/* Vasen sarake: Media */}
              <div className="edit-modal-media">
                <div className="media-container">
                  {(() => {
                    const mediaUrl = editingPost.thumbnail || (editingPost.media_urls && editingPost.media_urls[0])
                    const isPhotoType = editingPost.type === 'Photo' || editingPost.type === 'LinkedIn'
                    
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
                              >
                                {imageLoading ? 'Ladataan...' : 'Lisää kuva'}
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
                        <img 
                          src={mediaUrl} 
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
                            >
                              {imageLoading ? 'Ladataan...' : 'Vaihda kuva'}
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
                        >
                          {imageLoading ? 'Ladataan...' : 'Lisää kuva'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Piilotettu file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Oikea sarake: Postaus */}
              <div className="edit-modal-fields">
                <div className="form-group">
                  <label className="form-label">Postaus</label>
                  <div className="post-content-box" style={{ height: '500px' }}>
                    <textarea
                      name="caption"
                      value={formData.caption}
                      onChange={(e) => setFormData({...formData, caption: e.target.value})}
                      className="form-textarea"
                      placeholder="Kirjoita postauksen kuvaus..."
                      style={{ 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px', 
                        padding: '12px',
                        resize: 'none',
                        height: '100%',
                        width: '100%'
                      }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {error && (
              <div className="error-message" style={{ color: '#ef4444', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div className="modal-actions">
              <div className="modal-actions-left">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                >
                  Peruuta
                </Button>
              </div>
              <div className="modal-actions-right">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
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

@media (max-width: 768px) {
  .edit-modal-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .media-container {
    height: 250px;
  }
}
`

// Lisää tyylit head:iin
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
