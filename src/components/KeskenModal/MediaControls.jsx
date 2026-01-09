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
  if (userAccountType === 'personal_brand') {
    return (
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
    )
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button
        type="button"
        variant={variant}
        size="small"
        onClick={onSelectKoneelta}
        disabled={imageLoading}
        style={variant === 'secondary' ? { marginRight: '8px' } : {}}
        title="Sallitut muodot: JPG, PNG, GIF, MP4, M4V"
      >
        {imageLoading ? t('media.buttons.loading') : 
         variant === 'primary' ? t('media.buttons.addMedia') : t('media.buttons.changeMedia')}
      </Button>
      {showDelete && mediaUrl && (
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

