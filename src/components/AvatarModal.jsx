import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'
import Button from './Button'

const AvatarModal = ({ 
  show, 
  editingPost, 
  editModalStep, 
  setEditModalStep,
  selectedAvatar, 
  setSelectedAvatar,
  avatarImages, 
  setAvatarImages,
  avatarLoading, 
  setAvatarLoading,
  avatarError, 
  setAvatarError,
  voiceoverReadyChecked,
  setVoiceoverReadyChecked,
  user,
  onClose, 
  onSave,
  t 
}) => {
  if (!show || !editingPost) return null

  // Hae avatar-kuvat kun vaihe on 2
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        if (editModalStep !== 2) return

        setAvatarLoading(true)
        setAvatarError('')

        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
        const userId = await getUserOrgId(user.id)
        
        if (!userId) {
          setAvatarImages([])
          setAvatarError('Käyttäjää ei löytynyt')
          return
        }

        // Hae company_id Supabasesta
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', userId)
          .single()

        if (userError || !userData?.company_id) {
          setAvatarImages([])
          setAvatarError('company_id puuttuu')
          return
        }

        // Kutsu avatar-status APIa
        const response = await fetch('/api/avatar-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: userData.company_id })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Avatar data received:', data)
        
        // Käsittele data riippuen siitä, onko se array vai objekti avatars-kentällä
        let avatars = []
        if (Array.isArray(data)) {
          avatars = data
        } else if (data.avatars && Array.isArray(data.avatars)) {
          avatars = data.avatars
        } else if (data.avatarImages && Array.isArray(data.avatarImages)) {
          avatars = data.avatarImages
        }
        
        setAvatarImages(avatars)
      } catch (error) {
        console.error('Avatar fetch error:', error)
        setAvatarError('Avatar-kuvien haku epäonnistui')
        setAvatarImages([])
      } finally {
        setAvatarLoading(false)
      }
    }

    fetchAvatars()
  }, [editModalStep, user?.id])

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
        <div className="modal-header" style={{ paddingTop: '0', paddingBottom: '0' }}>
          <h2 className="modal-title">
            {editModalStep === 1 ? 'Voiceover-tarkistus' : 'Valitse avatar-kuva'}
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          {/* Vaihe 1: Voiceover-tarkistus */}
          {editModalStep === 1 && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              
              // Siirry vaiheeseen 2
              setEditModalStep(2)
            }}>
              <div className="form-group">
                <label className="form-label">Voiceover</label>
                <textarea
                  name="voiceover"
                  rows={8}
                  className="form-textarea"
                  defaultValue={editingPost.voiceover || ""}
                  placeholder="Kirjoita voiceover-teksti..."
                />
                <div className="voiceover-checkbox">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="voiceoverReady" 
                      checked={voiceoverReadyChecked}
                      onChange={(e) => setVoiceoverReadyChecked(e.target.checked)}
                    />
                    <span className="checkbox-text">Vahvistan että voiceover on valmis ja tarkistettu</span>
                  </label>
                </div>
              </div>
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
                    disabled={!voiceoverReadyChecked}
                  >
                    Seuraava
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Vaihe 2: Avatar-valinta */}
          {editModalStep === 2 && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Valitse avatar-kuva</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Valitse avatar-kuva, jota käytetään tässä postauksessa.
                </p>
              </div>

              {avatarLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-spinner"></div>
                  <p>Haetaan avatar-kuvia...</p>
                </div>
              ) : avatarError ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: '#ef4444',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca'
                }}>
                  <p>{avatarError}</p>
                </div>
              ) : avatarImages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: '#666',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <p>Ei avatar-kuvia saatavilla</p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                  gap: '20px',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  padding: '24px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  {avatarImages.map((img, idx) => {
                    // Käsittele eri data-muodot
                    let avatarId, imageUrl
                    
                    if (img.Media && img.Media[0]) {
                      // Dummy data muoto: { id: 'avatar-1', Media: [{ url: '...' }], "Variable ID": 'var-1' }
                      avatarId = img["Variable ID"] || img.id
                      imageUrl = img.Media[0].url
                    } else if (img.url) {
                      // Suora muoto: { id: '...', url: '...' }
                      avatarId = img.variableId || img.id
                      imageUrl = img.url
                    } else {
                      // Skip jos ei ole kunnollista dataa
                      return null
                    }
                    
                    const isSelected = selectedAvatar === avatarId
                    return (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => {
                          console.log('Avatar clicked:', { avatarId, img })
                          setSelectedAvatar(avatarId)
                        }}
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
                          src={imageUrl}
                          alt={`Avatar ${idx + 1}`}
                          style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
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
                  })}
                </div>
              )}

              <div className="modal-actions" style={{ margin: '0', padding: '16px 0 0 0' }}>
                <div className="modal-actions-left">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditModalStep(1)}
                  >
                    Edellinen
                  </Button>
                </div>
                <div className="modal-actions-right">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={async () => {
                      try {
                        // Tarkista että avatar on valittu
                        if (!selectedAvatar) {
                          setAvatarError('Valitse avatar ennen jatkamista')
                          return
                        }

                        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
                        const userId = await getUserOrgId(user.id)
                        
                        if (!userId) {
                          setAvatarError('Käyttäjää ei löytynyt')
                          return
                        }

                        // Hae company_id
                        const { data: userData, error: userError } = await supabase
                          .from('users')
                          .select('company_id')
                          .eq('id', userId)
                          .single()

                        if (userError || !userData?.company_id) {
                          setAvatarError('company_id puuttuu')
                          return
                        }

                        // Debug: tarkista selectedAvatar
                        console.log('Avatar selection debug:', {
                          selectedAvatar,
                          editingPostId: editingPost.id,
                          companyId: userData.company_id,
                          voiceoverReady: voiceoverReadyChecked
                        })

                        // Hae voiceover-teksti lomakkeesta
                        const voiceoverTextarea = document.querySelector('textarea[name="voiceover"]')
                        const voiceoverText = voiceoverTextarea ? voiceoverTextarea.value : (editingPost.voiceover || '')

                        const requestData = {
                          recordId: editingPost.originalData?.['Record ID'] || editingPost.originalData?.id || editingPost.id,
                          voiceover: voiceoverText || null,
                          voiceoverReady: !!voiceoverReadyChecked,
                          companyId: userData.company_id,
                          selectedAvatarId: selectedAvatar,
                          action: 'avatar_selected'
                        }

                        console.log('DEBUG: Sending voiceover-ready data:', requestData)
                        console.log('DEBUG: editingPost.originalData:', editingPost.originalData)
                        console.log('DEBUG: Record ID options:', {
                          'Record ID': editingPost.originalData?.['Record ID'],
                          'id': editingPost.originalData?.id,
                          'editingPost.id': editingPost.id
                        })

                        // Lähetä endpointiin
                        const response = await fetch('/api/voiceover-ready', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(requestData)
                        })

                        if (!response.ok) {
                          throw new Error(`HTTP error! status: ${response.status}`)
                        }

                        const result = await response.json()
                        console.log('Avatar selection response:', result)
                        
                        // Sulje modaali ja kutsu parentin onSave
                        onSave()
                      } catch (e) {
                        console.error('Avatar selection error:', e)
                        setAvatarError('Avatar-valinnan tallentaminen epäonnistui')
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
  )
}

export default AvatarModal
