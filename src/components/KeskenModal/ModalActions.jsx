import React from 'react'
import Button from '../Button'

const ModalActions = ({ 
  onClose, 
  loading, 
  disabled,
  fileInputRef,
  t 
}) => {
  const handleClose = () => {
    // Tyhjennä file input kun modaali suljetaan
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  return (
    <div className="modal-actions">
      <div className="modal-actions-left">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
        >
          {t('common.cancel')}
        </Button>
      </div>
      <div className="modal-actions-right">
        <Button
          type="submit"
          variant="primary"
          disabled={loading || disabled}
        >
          {loading ? t('ui.buttons.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  )
}

export default ModalActions

