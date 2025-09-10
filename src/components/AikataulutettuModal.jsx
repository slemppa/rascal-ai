import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

const AikataulutettuModal = ({ 
  show, 
  editingPost, 
  onClose, 
  onEdit,
  t 
}) => {
  if (!show || !editingPost) return null

  return createPortal(
    <div 
      className="modal-overlay modal-overlay--light"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-container" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Aikataulutettu postaus</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label className="form-label">Otsikko</label>
            <p className="form-text">{editingPost.title || 'Ei otsikkoa'}</p>
          </div>

          <div className="form-group">
            <label className="form-label">Kuvaus</label>
            <p className="form-text">{editingPost.caption || 'Ei kuvausta'}</p>
          </div>

          <div className="form-group">
            <label className="form-label">Julkaisupäivä</label>
            <p className="form-text">{editingPost.scheduledDate || editingPost.publishDate || 'Ei asetettu'}</p>
          </div>

          <div className="form-group">
            <label className="form-label">Lähde</label>
            <p className="form-text">{editingPost.source || 'Supabase'}</p>
          </div>

          <div className="modal-actions">
            <div className="modal-actions-left">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Sulje
              </Button>
            </div>
            <div className="modal-actions-right">
              <Button
                type="button"
                variant="primary"
                onClick={onEdit}
              >
                Muokkaa
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AikataulutettuModal
