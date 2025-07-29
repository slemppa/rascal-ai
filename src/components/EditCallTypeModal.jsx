import React, { useState, useEffect } from 'react'
import Button from './Button'
import './ModalComponents.css'

const EditCallTypeModal = ({ 
  showModal, 
  onClose, 
  editingCallType, 
  setEditingCallType, 
  onSave 
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  // ESC-toiminnallisuus - pitää olla heti useState jälkeen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showModal, onClose])

  if (!showModal || !editingCallType) return null

  const steps = [
    { id: 1, label: 'Perustiedot' },
    { id: 2, label: 'Sisältö' },
    { id: 3, label: 'Lisäasetukset' }
  ]

  // Tyhjän tilan klikkaus
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    onSave()
  }

  return (
    <div className="modal-overlay modal-overlay--light" onClick={handleOverlayClick}>
      <div className="modal-container edit-call-type-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            Muokkaa puhelun tyyppiä
          </h2>
          <Button
            onClick={onClose}
            variant="secondary"
            className="modal-close-btn"
          >
            ×
          </Button>
        </div>

        {/* Vaiheindikaattori */}
        <div className="steps-container">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="step-item">
                <div className={`step-number ${currentStep >= step.id ? 'active' : ''}`}>
                  {step.id}
                </div>
                <span className={`step-label ${currentStep >= step.id ? 'active' : ''}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`step-separator ${currentStep > step.id ? 'active' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Sisältö */}
        <div className="modal-content">
          {currentStep === 1 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Nimi
                </label>
                <input
                  type="text"
                  value={editingCallType.name || editingCallType.callType || editingCallType.label || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, name: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Tila
                </label>
                <select
                  value={editingCallType.status || 'Active'}
                  onChange={e => setEditingCallType({ ...editingCallType, status: e.target.value })}
                  className="form-select"
                >
                  <option value="Active">Aktiivinen</option>
                  <option value="Draft">Luonnos</option>
                  <option value="Archived">Arkistoitu</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Versio
                </label>
                <input
                  type="text"
                  value={editingCallType.version || 'v1.0'}
                  onChange={e => setEditingCallType({ ...editingCallType, version: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-column">
              <div className="form-group">
                <label className="form-label">
                  AI-rooli
                </label>
                <textarea
                  value={editingCallType.identity || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, identity: e.target.value })}
                  placeholder="Kuvaus AI-roolista ja tehtävästä..."
                  rows={4}
                  className="form-textarea"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Puhumistyylin kuvaus
                </label>
                <textarea
                  value={editingCallType.style || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, style: e.target.value })}
                  placeholder="Kuvaus puhumistyylistä, esim. inhimillinen, napakka, kiinnostusta herättävä..."
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Puhelun tavoitteet
                </label>
                <textarea
                  value={editingCallType.goals || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, goals: e.target.value })}
                  placeholder="Puhelun tavoitteet, esim. tunnistaa ideaaliasiakas, kartoittaa haasteet..."
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Keskusteluohjeet
                </label>
                <textarea
                  value={editingCallType.guidelines || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, guidelines: e.target.value })}
                  placeholder="Ohjeet keskustelulle, esim. yksi kysymys kerrallaan, anna tilaa vastaukselle..."
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-column">
              <div className="form-group">
                <label className="form-label">
                  Aloitusrepliikki
                </label>
                <textarea
                  value={editingCallType.intro || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, intro: e.target.value })}
                  placeholder="Aloitusrepliikki puhelulle..."
                  rows={4}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Kysymyslista
                </label>
                <textarea
                  value={editingCallType.questions || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, questions: e.target.value })}
                  placeholder="Kysymyslista tai ohjeet kysymyksille..."
                  rows={6}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Lopetusrepliikki
                </label>
                <textarea
                  value={editingCallType.outro || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, outro: e.target.value })}
                  placeholder="Lopetusrepliikki puhelulle..."
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Lisämuistiinpanot
                </label>
                <textarea
                  value={editingCallType.notes || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, notes: e.target.value })}
                  placeholder="Lisämuistiinpanot ja ohjeet..."
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <div className="modal-actions-left">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              Peruuta
            </Button>
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handlePrevious}
                variant="secondary"
              >
                Edellinen
              </Button>
            )}
          </div>
          
          <div className="modal-actions-right">
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
              >
                Seuraava
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
              >
                Tallenna muutokset
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditCallTypeModal 