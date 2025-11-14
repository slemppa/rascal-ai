import React from 'react'
import { createPortal } from 'react-dom'
import '../ModalComponents.css'

export default function CompanyTab({
  company,
  editingCard,
  editValues,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onEditValueChange
}) {
  const getCardTitle = (field) => {
    switch(field) {
      case 'company_summary':
        return 'Yritysyhteenveto'
      case 'icp_summary':
        return 'ICP (Ideal Customer Profile)'
      case 'kpi':
        return 'KPI'
      case 'tov':
        return 'ToV (Tone of Voice)'
      default:
        return 'Muokkaa'
    }
  }

  return (
    <>
      <div className="company-cards-grid">
        {/* Yritysyhteenveto kortti */}
        <div className={`company-card ${editingCard === 'company_summary' ? 'editing' : ''}`}>
          <div className="company-card-header">
            <h3>Yritysyhteenveto</h3>
          </div>
          <div className="company-card-content">
            {company.company_summary ? (
              <p>{company.company_summary.length > 150 
                ? company.company_summary.substring(0, 150) + '...'
                : company.company_summary}</p>
            ) : (
              <p className="empty-text">Ei yhteenvetoa</p>
            )}
            <button 
              className="edit-btn-bottom"
              onClick={(e) => {
                e.stopPropagation()
                onEdit('company_summary')
              }}
            >
              Muokkaa
            </button>
          </div>
        </div>

        {/* ICP kortti */}
        <div className={`company-card ${editingCard === 'icp_summary' ? 'editing' : ''}`}>
          <div className="company-card-header">
            <h3>ICP (Ideal Customer Profile)</h3>
          </div>
          <div className="company-card-content">
            {company.icp_summary ? (
              <p>{company.icp_summary.length > 150 
                ? company.icp_summary.substring(0, 150) + '...'
                : company.icp_summary}</p>
            ) : (
              <p className="empty-text">Ei ICP-kuvausta</p>
            )}
            <button 
              className="edit-btn-bottom"
              onClick={(e) => {
                e.stopPropagation()
                onEdit('icp_summary')
              }}
            >
              Muokkaa
            </button>
          </div>
        </div>

        {/* KPI kortti */}
        <div className={`company-card ${editingCard === 'kpi' ? 'editing' : ''}`}>
          <div className="company-card-header">
            <h3>KPI</h3>
          </div>
          <div className="company-card-content">
            {company.kpi ? (
              <p>{company.kpi.length > 150 
                ? company.kpi.substring(0, 150) + '...'
                : company.kpi}</p>
            ) : (
              <p className="empty-text">Ei KPI-tietoja</p>
            )}
            <button 
              className="edit-btn-bottom"
              onClick={(e) => {
                e.stopPropagation()
                onEdit('kpi')
              }}
            >
              Muokkaa
            </button>
          </div>
        </div>

        {/* ToV kortti */}
        <div className={`company-card ${editingCard === 'tov' ? 'editing' : ''}`}>
          <div className="company-card-header">
            <h3>ToV (Tone of Voice)</h3>
          </div>
          <div className="company-card-content">
            {company.tov ? (
              <p>{company.tov.length > 150 
                ? company.tov.substring(0, 150) + '...'
                : company.tov}</p>
            ) : (
              <p className="empty-text">Ei ToV-kuvausta</p>
            )}
            <button 
              className="edit-btn-bottom"
              onClick={(e) => {
                e.stopPropagation()
                onEdit('tov')
              }}
            >
              Muokkaa
            </button>
          </div>
        </div>
      </div>

      {editingCard && createPortal(
        <div 
          className="edit-card-modal-overlay modal-overlay modal-overlay--light"
          onClick={onCancel}
        >
          <div 
            className="edit-card-modal modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-card-modal-header">
              <h2>{getCardTitle(editingCard)}</h2>
              <button 
                className="edit-card-close-btn"
                onClick={onCancel}
                disabled={isSaving}
              >
                ×
              </button>
            </div>
            <div className="edit-card-modal-body">
              <textarea
                value={editValues[editingCard] || ''}
                onChange={(e) => onEditValueChange(editingCard, e.target.value)}
                className="edit-card-textarea"
                rows="12"
                placeholder={editingCard === 'company_summary' ? 'Yrityksen yhteenveto...' :
                            editingCard === 'icp_summary' ? 'Ideal Customer Profile...' :
                            editingCard === 'kpi' ? 'Key Performance Indicators...' :
                            'Tone of Voice...'}
              />
            </div>
            <div className="edit-card-modal-footer">
              <button 
                className="cancel-card-btn"
                onClick={onCancel}
                disabled={isSaving}
              >
                Peruuta
              </button>
              <button 
                className="save-card-btn"
                onClick={() => onSave(editingCard)}
                disabled={isSaving}
              >
                {isSaving ? 'Tallennetaan...' : 'Tallenna'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

