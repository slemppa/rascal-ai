import React from 'react'
import Button from '../Button'
import MediaSourceMenu from './MediaSourceMenu'

const MediaControls = ({
  userAccountType,
  imageLoading,
  showMediaSourceMenu,
  onToggleMediaSourceMenu,
  onSelectKuvapankki,
  onSelectKoneelta,
  onDeleteImage,
  mediaUrl,
  variant = 'primary', // 'primary' tai 'secondary'
  showDelete = false,
  t
}) => {
  // Poisto-nappi näkyy aina kun mediaUrl on olemassa ja onDeleteImage on määritelty
  // Tarkistetaan että mediaUrl on truthy-arvo (ei undefined, null tai tyhjä string)
  const hasMediaUrl = !!(mediaUrl && String(mediaUrl).trim().length > 0)
  const canDelete = hasMediaUrl && !!onDeleteImage && typeof onDeleteImage === 'function'

  if (userAccountType === 'personal_brand') {
    return (
      <div className="media-controls">
        <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Button
              type="button"
              variant={variant}
              size="small"
              onClick={onToggleMediaSourceMenu}
              disabled={imageLoading}
              title="Sallitut muodot: JPG, PNG, GIF, MP4, M4V"
            >
              {imageLoading ? t('media.buttons.loading') : 
               variant === 'primary' ? t('media.buttons.addMedia') : t('media.buttons.changeMedia')}
            </Button>
            <MediaSourceMenu
              show={showMediaSourceMenu}
              onSelectKuvapankki={onSelectKuvapankki}
              onSelectKoneelta={onSelectKoneelta}
            />
          </div>
          {canDelete && (
            <Button
              type="button"
              variant="danger"
              size="small"
              onClick={() => onDeleteImage(mediaUrl)}
              disabled={imageLoading}
              style={{ flexShrink: 0 }}
            >
              Poista kuva
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="media-controls">
      <Button
        type="button"
        variant={variant}
        size="small"
        onClick={onSelectKoneelta}
        disabled={imageLoading}
        title="Sallitut muodot: JPG, PNG, GIF, MP4, M4V"
      >
        {imageLoading ? t('media.buttons.loading') : 
         variant === 'primary' ? t('media.buttons.addMedia') : t('media.buttons.changeMedia')}
      </Button>
      {canDelete && (
        <Button
          type="button"
          variant="danger"
          size="small"
          onClick={() => onDeleteImage(mediaUrl)}
          disabled={imageLoading}
        >
          Poista kuva
        </Button>
      )}
    </div>
  )
}

export default MediaControls

