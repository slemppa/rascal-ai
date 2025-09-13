import React from 'react'
import { useTranslation } from 'react-i18next'

const MonthlyLimitWarning = ({ limitData, onClose, onCreateAnyway }) => {
  const { t } = useTranslation()

  if (!limitData || limitData.canCreate) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">⚠️ Kuukausiraja täynnä</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          <div className="warning-content">
            <div className="warning-icon">
              🚫
            </div>
            <h3>Kuukausiraja ylitetty</h3>
            <p>
              Olet luonut {limitData.currentCount} sisältöä tässä kuussa. 
              Kuukausiraja on {limitData.monthlyLimit} sisältöä.
            </p>
            <p>
              <strong>Voit luoda uutta sisältöä vasta ensi kuussa.</strong>
            </p>
            
            <div className="limit-info">
              <div className="limit-stat">
                <span className="limit-label">Tämän kuun sisältöä:</span>
                <span className="limit-value used">{limitData.currentCount}</span>
              </div>
              <div className="limit-stat">
                <span className="limit-label">Kuukausiraja:</span>
                <span className="limit-value limit">{limitData.monthlyLimit}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Sulje
          </button>
          <button
            onClick={onCreateAnyway}
            className="btn btn-primary"
            disabled
            title="Kuukausiraja ylitetty"
          >
            Luo silti (ei käytettävissä)
          </button>
        </div>
      </div>
    </div>
  )
}

export default MonthlyLimitWarning

