import React from 'react'
import MediaControls from './MediaControls'

const MediaPreview = ({
  editingPost,
  userAccountType,
  imageLoading,
  showMediaSourceMenu,
  onToggleMediaSourceMenu,
  onSelectKuvapankki,
  onSelectKoneelta,
  onDeleteImage,
  fileInputRef,
  formData,
  t
}) => {
  const isCarousel = editingPost.type === 'Carousel'
  const isPhotoType = editingPost.type === 'Photo' || editingPost.type === 'LinkedIn'
  const mediaUrl = editingPost.thumbnail || (editingPost.media_urls && editingPost.media_urls[0])

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

  // Ei mediaa - näytetään placeholder
  if (!mediaUrl) {
    return (
      <div className="media-placeholder">
        <img src="/placeholder.png" alt="Ei mediaa" />
        <MediaControls
          userAccountType={userAccountType}
          imageLoading={imageLoading}
          showMediaSourceMenu={showMediaSourceMenu}
          onToggleMediaSourceMenu={onToggleMediaSourceMenu}
          onSelectKuvapankki={onSelectKuvapankki}
          onSelectKoneelta={() => fileInputRef.current?.click()}
          variant="primary"
          t={t}
        />
      </div>
    )
  }

  // Video
  if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
    return (
      <div className="media-wrapper">
        {imageLoading && (
          <div className="image-loading-overlay">
            <div className="loading-spinner"></div>
            <p>{t('media.buttons.loading')}</p>
          </div>
        )}
        <video 
          src={mediaUrl} 
          className="media-preview"
          controls
        />
        {/* Videon hallintanapit */}
        <MediaControls
          userAccountType={userAccountType}
          imageLoading={imageLoading}
          showMediaSourceMenu={showMediaSourceMenu}
          onToggleMediaSourceMenu={onToggleMediaSourceMenu}
          onSelectKuvapankki={onSelectKuvapankki}
          onSelectKoneelta={() => fileInputRef.current?.click()}
          onDeleteImage={onDeleteImage}
          mediaUrl={mediaUrl}
          variant="secondary"
          showDelete={true}
          t={t}
        />
      </div>
    )
  }

  // Kuva (Photo/LinkedIn)
  return (
    <div className="media-wrapper">
      {imageLoading && (
        <div className="image-loading-overlay">
          <div className="loading-spinner"></div>
          <p>{t('media.buttons.loading')}</p>
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
      {/* Fallback placeholder - näkyy vain jos kuva ei lataa */}
      <div className="media-placeholder" style={{ display: 'none' }}>
        <img src="/placeholder.png" alt="Ei mediaa" />
      </div>
      {/* Kuvan hallintanapit */}
      <MediaControls
        userAccountType={userAccountType}
        imageLoading={imageLoading}
        showMediaSourceMenu={showMediaSourceMenu}
        onToggleMediaSourceMenu={onToggleMediaSourceMenu}
        onSelectKuvapankki={onSelectKuvapankki}
        onSelectKoneelta={() => fileInputRef.current?.click()}
        onDeleteImage={onDeleteImage}
        mediaUrl={mediaUrl}
        variant="secondary"
        showDelete={true}
        t={t}
      />
    </div>
  )
}

export default MediaPreview

