import React from 'react'

const CaptionEditor = ({
  caption,
  onChange,
  placeholder = "Kirjoita postauksen kuvaus...",
  maxLength = 2000,
  height = '500px',
  t
}) => {
  const isOverLimit = caption.length > maxLength

  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label className="form-label" style={{ marginBottom: 0 }}>{t('keskenModal.postLabel')}</label>
        <span style={{ 
          fontSize: '12px', 
          color: isOverLimit ? '#ef4444' : '#6b7280',
          fontWeight: isOverLimit ? '600' : '400'
        }}>
          {caption.length} / {maxLength}
        </span>
      </div>
      <div className="post-content-box" style={{ height }}>
        <textarea
          name="caption"
          value={caption}
          onChange={onChange}
          className="form-textarea"
          placeholder={placeholder}
          style={{ 
            border: isOverLimit ? '1px solid #ef4444' : '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '12px',
            resize: 'none',
            height: '100%',
            width: '100%'
          }}
        />
      </div>
      {isOverLimit && (
        <p style={{
          color: '#ef4444',
          fontSize: '12px',
          marginTop: '4px',
          fontWeight: '500'
        }}>
          {t('keskenModal.errors.captionTooLong')}
        </p>
      )}
    </div>
  )
}

export default CaptionEditor

