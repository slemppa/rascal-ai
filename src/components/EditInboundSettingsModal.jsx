import React, { useState, useEffect } from 'react'
import Button from './Button'
import './ModalComponents.css'

const EditInboundSettingsModal = ({ 
  showModal, 
  onClose, 
  editingInboundSettings, 
  setEditingInboundSettings, 
  onSave,
  getVoiceOptions,
  playVoiceSample
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

  if (!showModal || !editingInboundSettings) return null

  const steps = [
    { id: 1, label: 'Ääni' },
    { id: 2, label: 'Viestit' },
    { id: 3, label: 'Yhteenveto' }
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
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">
            Muokkaa Inbound-asetuksia
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
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Ääni
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={editingInboundSettings.voice || 'rascal-nainen-1'}
                    onChange={e => setEditingInboundSettings({ ...editingInboundSettings, voice: e.target.value })}
                    className="form-select"
                    style={{ flex: 1 }}
                  >
                    {getVoiceOptions().map(voice => (
                      <option key={voice.value} value={voice.value}>{voice.label}</option>
                    ))}
                  </select>
                  <Button 
                    variant="secondary"
                    onClick={() => playVoiceSample(editingInboundSettings.voice || 'rascal-nainen-1')}
                    style={{ width: 'auto', padding: '8px 16px' }}
                  >
                    Testaa ääntä
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Tervetuloviesti</label>
                  <textarea
                    value={editingInboundSettings.welcomeMessage || ''}
                    onChange={e => setEditingInboundSettings({ ...editingInboundSettings, welcomeMessage: e.target.value })}
                    className="form-textarea"
                    rows={4}
                    placeholder={
`• Ystävällinen tervehdys ja esittäytyminen
• Selkeä selitys siitä, miten voin auttaa
• Kysymys, joka aloittaa keskustelun
• Lyhyt ja ammattimainen`
                    }
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>"Hei! Olen [Nimi], [Yritys] AI-assistentti. Kiitos soitostasi! Miten voin auttaa sinua tänään?"</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Puhelun skripti</label>
                  <textarea
                    value={editingInboundSettings.script || ''}
                    onChange={e => setEditingInboundSettings({ ...editingInboundSettings, script: e.target.value })}
                    className="form-textarea"
                    rows={6}
                    placeholder={
`• Keskustelun tavoitteet ja rakenne
• Avainkysymykset (4-7 kappaletta)
• Vastaukset yleisiin kysymyksiin
• Ohjeet eri tilanteisiin
• Vastalauseiden käsittely`
                    }
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>{`1. Tervetuloviesti ja esittäytyminen
2. Kysy: "Mikä on suurin haaste myynnissäsi?"
3. Kuuntele vastaus
4. Kysy: "Oletko harkinnut AI:n käyttöä?"
5. Jos kyllä → sovi tapaaminen
Jos ei → kiitä ja tarjoa lisätietoja`}</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
                  Yhteenveto
                </h3>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Ääni:</strong> {getVoiceOptions().find(v => v.value === editingInboundSettings.voice)?.label || 'Ei valittu'}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <strong>Tervetuloviesti:</strong>
                    <div style={{ marginTop: 4, padding: 8, background: '#fff', borderRadius: 4, fontSize: 14, color: '#374151' }}>
                      {editingInboundSettings.welcomeMessage || 'Ei asetettu'}
                    </div>
                  </div>
                  <div>
                    <strong>Skripti:</strong>
                    <div style={{ marginTop: 4, padding: 8, background: '#fff', borderRadius: 4, fontSize: 14, color: '#374151', maxHeight: 100, overflowY: 'auto' }}>
                      {editingInboundSettings.script || 'Ei asetettu'}
                    </div>
                  </div>
                </div>
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
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
                Tallenna asetukset
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditInboundSettingsModal
