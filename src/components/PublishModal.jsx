import React from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import './PublishModal.css'

const PublishModal = ({ 
  show, 
  publishingPost, 
  socialAccounts,
  selectedAccounts,
  setSelectedAccounts,
  loadingAccounts,
  onClose, 
  onConfirm,
  t 
}) => {
  if (!show || !publishingPost) return null

  const [publishDate, setPublishDate] = React.useState('')

  const toggleAccount = (accountId) => {
    if (selectedAccounts.includes(accountId)) {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId))
    } else {
      setSelectedAccounts([...selectedAccounts, accountId])
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
      <div className="modal-container" style={{ maxWidth: '1200px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Valitse somekanavat julkaisua varten</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>
        
        <div className="modal-content">
          {/* Grid: Kuva vasemmalla (1/3), Caption+Aikataulu oikealla (2/3), Somet alhaalla koko leveydellä */}
          <div className="publish-modal-grid">
            {/* Vasen: Kuva/Video */}
            <div className="publish-modal-media">
              <div className="media-container">
                {(() => {
                  const isCarousel = publishingPost.type === 'Carousel'
                  
                  // Carousel-tyyppisillä postauksilla näytetään kaikki slaidit
                  if (isCarousel && publishingPost.segments && publishingPost.segments.length > 0) {
                    return (
                      <div className="carousel-slides">
                        <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          Slaidit ({publishingPost.segments.length})
                        </h4>
                        <div className="slides-grid">
                          {publishingPost.segments.map((segment, index) => (
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
                              {/* Fallback placeholder */}
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
                  const mediaUrl = publishingPost.thumbnail || (publishingPost.media_urls && publishingPost.media_urls[0])
                  
                  if (!mediaUrl) {
                    return (
                      <div className="media-placeholder">
                        <img src="/placeholder.png" alt="Ei mediaa" />
                      </div>
                    )
                  }
                  
                  if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
                    return (
                      <video 
                        src={mediaUrl} 
                        className="media-preview"
                        controls
                        style={{ objectFit: 'contain' }}
                      />
                    )
                  }
                  
                  return (
                    <div className="media-wrapper">
                      <img 
                        src={mediaUrl} 
                        alt="Postauksen media"
                        className="media-preview"
                        style={{ objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    </div>
                  )
                })()}
                
                {/* Fallback placeholder */}
                <div className="media-placeholder" style={{ display: 'none' }}>
                  <img src="/placeholder.png" alt="Ei mediaa" />
                </div>
              </div>
            </div>

            {/* Oikea: Caption + Aikataulu allekkain */}
            <div className="publish-modal-right-column" style={{ height: '400px' }}>
              {/* Caption/Postaus */}
              <div className="publish-modal-fields" style={{ height: '50%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    Postaus
                  </h3>
                  <span style={{ 
                    fontSize: '12px', 
                    color: (publishingPost.caption?.length || 0) > 2000 ? '#ef4444' : '#6b7280',
                    fontWeight: (publishingPost.caption?.length || 0) > 2000 ? '600' : '400'
                  }}>
                    {publishingPost.caption?.length || 0} / 2000
                  </span>
                </div>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#ffffff', 
                  border: (publishingPost.caption?.length || 0) > 2000 ? '1px solid #ef4444' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  height: 'calc(100% - 40px)',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#374151'
                }}>
                  {publishingPost.caption || 'Ei kuvausta'}
                </div>
                {(publishingPost.caption?.length || 0) > 2000 && (
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

              {/* Julkaisupäivä */}
              <div className="publish-modal-schedule" style={{ height: '50%' }}>
                <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  Julkaisupäivä
                </h3>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '6px', 
                      fontSize: '14px', 
                      outline: 'none' 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Ala: Somekanavat */}
            <div className="publish-modal-accounts">
              <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                Kanavat
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
                {loadingAccounts ? (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#6b7280',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    Ladataan tilejä...
                  </div>
                ) : socialAccounts && socialAccounts.length > 0 ? (
                  socialAccounts.map((account) => {
                    const isSelected = selectedAccounts.includes(account.mixpost_account_uuid)
                    return (
                      <div 
                        key={account.mixpost_account_uuid}
                        onClick={() => toggleAccount(account.mixpost_account_uuid)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer'
                          }}
                        />
                        {account.profile_image_url && (
                          <img 
                            src={account.profile_image_url} 
                            alt={account.account_name}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
                            {account.account_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {account.provider} • @{account.username}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#6b7280',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    Ei yhdistettyjä sometilejä
                  </div>
                )}
              </div>
            </div>

         
          </div>

          {/* Modal actions */}
          <div className="modal-actions">
            <div className="modal-actions-left">
              <Button type="button" variant="secondary" onClick={onClose}>
                Peruuta
              </Button>
            </div>
            <div className="modal-actions-right">
              <Button 
                type="button" 
                variant="primary" 
                onClick={() => onConfirm(publishDate)}
                disabled={selectedAccounts.length === 0 || (publishingPost.caption?.length || 0) > 2000}
              >
                {publishDate ? 'Aikatauluta' : 'Julkaise heti'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PublishModal
