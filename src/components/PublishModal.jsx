import React, { useState, useEffect } from 'react'
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
  const [publishDate, setPublishDate] = useState('')
  
  // Päivitä publishDate kun publishingPost muuttuu
  useEffect(() => {
    if (publishingPost) {
      setPublishDate(publishingPost.publishDate || '')
    }
  }, [publishingPost])

  if (!show || !publishingPost) return null


  return createPortal(
    <div 
      className="modal-overlay modal-overlay--light"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-container" style={{ maxWidth: '98vw', width: '98vw', height: '95vh' }}>
        <div className="modal-header" style={{ paddingTop: '0', paddingBottom: '0' }}>
          <h2 className="modal-title">Valitse somekanavat julkaisua varten</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-content" style={{ display: 'flex', gap: '20px', padding: '0', height: 'calc(95vh - 120px)', overflow: 'hidden' }}>
          {/* Vasen puoli: Kuva + Kanavat */}
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Kuva */}
            <div>
              <div style={{ 
                width: '100%', 
                height: '600px', 
                backgroundColor: '#000', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                {(() => {
                  // Käytetään samaa logiikkaa kuin "Kesken" sarakkeessa
                  let mediaUrl = null
                  
                  if (publishingPost.type === 'Carousel' && publishingPost.segments && publishingPost.segments.length > 0) {
                    // Carousel: Käytä ensimmäistä segmenttiä
                    const firstSegment = publishingPost.segments.find(seg => seg.slide_no === 1) || publishingPost.segments[0]
                    mediaUrl = firstSegment.media_urls?.[0] || null
                  } else {
                    // Muille tyypeille käytetään content-taulun media_urls
                    mediaUrl = publishingPost.media_urls?.[0] || publishingPost.mediaUrls?.[0] || publishingPost.thumbnail || null
                  }
                  
                  
                  if (!mediaUrl) {
                    return <span>Ei kuvaa</span>
                  }
                  
                  // Käytetään samaa logiikkaa kuin KeskenModal:ssa
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
                        alt="Post thumbnail"
                        className="media-preview"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    </div>
                  )
                })()}
                <div style={{ 
                  display: 'none', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '100%', 
                  height: '100%',
                  backgroundColor: '#f5f5f5',
                  color: '#666'
                }}>
                  <span>Kuva ei latautunut</span>
                </div>
              </div>
            </div>

            {/* Kanavat */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ color: 'black', fontSize: '24px', margin: '0 0 16px 0', fontWeight: 'bold' }}>Kanavat</h3>
              <div style={{ flex: 1, overflowY: 'auto' }}>
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
                  socialAccounts.map((account) => (
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
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Oikea puoli: Postaus ja Julkaisupäivä */}
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            {/* Postaus -laatikko */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                color: '#374151', 
                fontSize: '18px', 
                margin: '0 0 16px 0', 
                fontWeight: '600' 
              }}>
                Postaus
              </h3>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ 
                  margin: '0', 
                  fontSize: '14px', 
                  lineHeight: '1.6', 
                  color: '#374151',
                  whiteSpace: 'pre-wrap'
                }}>
                  {publishingPost.caption}
                </p>
              </div>
            </div>

            {/* Julkaisupäivä -laatikko */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                color: '#374151', 
                fontSize: '18px', 
                margin: '0 0 16px 0', 
                fontWeight: '600' 
              }}>
                Julkaisupäivä
              </h3>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #d1d5db'
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
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
                <p style={{ 
                  margin: '8px 0 0 0', 
                  fontSize: '12px', 
                  color: '#6b7280' 
                }}>
                  Jätä tyhjäksi julkaistaksesi heti
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-actions" style={{ margin: '0', padding: '16px 0 0 0' }}>
          <div className="modal-actions-left">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Edellinen
            </Button>
          </div>
          <div className="modal-actions-right">
            <Button
              type="button"
              variant="primary"
              onClick={() => onConfirm(publishDate)}
              disabled={selectedAccounts.length === 0 || loadingAccounts}
            >
              Julkaise valituille kanaville
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PublishModal
