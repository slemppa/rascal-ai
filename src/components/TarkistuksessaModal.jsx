import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

const TarkistuksessaModal = ({ 
  show, 
  editingPost, 
  onClose, 
  onPublish,
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
          <h2 className="modal-title">Tarkista postaus</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          {/* Luontipäivämäärä */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Luotu</label>
            <p className="form-text" style={{ 
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {editingPost.created_at ? new Date(editingPost.created_at).toLocaleString('fi-FI', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Ei tiedossa'}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Otsikko</label>
            <p className="form-text">{editingPost.title || 'Ei otsikkoa'}</p>
          </div>

          <div className="form-group">
            <label className="form-label">Kuvaus</label>
            <p className="form-text">{editingPost.caption || 'Ei kuvausta'}</p>
          </div>

          <div className="form-group">
            <label className="form-label">Tyyppi</label>
            <p className="form-text">{editingPost.type || 'Photo'}</p>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <p className="form-text">{editingPost.status}</p>
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
                onClick={onPublish}
                style={{ backgroundColor: '#22c55e' }}
              >
                Julkaise
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default TarkistuksessaModal
