import React, { useState } from 'react'
import Button from './Button'

const AddCallTypeModal = ({ 
  showModal, 
  onClose, 
  newCallType, 
  setNewCallType, 
  onAdd, 
  loading, 
  error, 
  success 
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  if (!showModal) return null

  const steps = [
    { id: 1, label: 'Perustiedot' },
    { id: 2, label: 'Sisältö' },
    { id: 3, label: 'Lisäasetukset' }
  ]

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
    onAdd()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        maxWidth: 900,
        width: '95%',
        maxHeight: '95vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
            Lisää uusi puhelun tyyppi
          </h2>
          <Button
            onClick={onClose}
            variant="secondary"
            style={{ fontSize: 24, color: '#6b7280', background: 'none', border: 'none' }}
          >
            ×
          </Button>
        </div>

        {/* Vaiheindikaattori */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: currentStep >= step.id ? '#3b82f6' : '#e5e7eb',
                  color: currentStep >= step.id ? '#fff' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 14
                }}>
                  {step.id}
                </div>
                <span style={{
                  marginLeft: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: currentStep >= step.id ? '#3b82f6' : '#6b7280'
                }}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div style={{
                  width: 40,
                  height: 2,
                  background: currentStep > step.id ? '#3b82f6' : '#e5e7eb',
                  margin: '0 16px'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Sisältö */}
        <div style={{ flex: 1, overflow: 'auto', paddingRight: 8 }}>
          {currentStep === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Nimi *
                </label>
                <input
                  type="text"
                  value={newCallType.callType}
                  onChange={e => setNewCallType({ ...newCallType, callType: e.target.value })}
                  placeholder="esim. myynti, asiakaspalvelu"
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Tila
                </label>
                <select
                  value={newCallType.status || 'Active'}
                  onChange={e => setNewCallType({ ...newCallType, status: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                >
                  <option value="Active">Aktiivinen</option>
                  <option value="Draft">Luonnos</option>
                  <option value="Archived">Arkistoitu</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Versio
                </label>
                <input
                  type="text"
                  value={newCallType.version || 'v1.0'}
                  onChange={e => setNewCallType({ ...newCallType, version: e.target.value })}
                  placeholder="v1.0"
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  AI-rooli
                </label>
                <textarea
                  value={newCallType.identity || ''}
                  onChange={e => setNewCallType({ ...newCallType, identity: e.target.value })}
                  placeholder="Kuvaus AI-roolista ja tehtävästä..."
                  rows={4}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Puhumistyylin kuvaus
                </label>
                <textarea
                  value={newCallType.style || ''}
                  onChange={e => setNewCallType({ ...newCallType, style: e.target.value })}
                  placeholder="Kuvaus puhumistyylistä, esim. inhimillinen, napakka, kiinnostusta herättävä..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Puhelun tavoitteet
                </label>
                <textarea
                  value={newCallType.goals || ''}
                  onChange={e => setNewCallType({ ...newCallType, goals: e.target.value })}
                  placeholder="Puhelun tavoitteet, esim. tunnistaa ideaaliasiakas, kartoittaa haasteet..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Keskusteluohjeet
                </label>
                <textarea
                  value={newCallType.guidelines || ''}
                  onChange={e => setNewCallType({ ...newCallType, guidelines: e.target.value })}
                  placeholder="Ohjeet keskustelulle, esim. yksi kysymys kerrallaan, anna tilaa vastaukselle..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Aloitusrepliikki
                </label>
                <textarea
                  value={newCallType.intro || ''}
                  onChange={e => setNewCallType({ ...newCallType, intro: e.target.value })}
                  placeholder="Aloitusrepliikki puhelulle..."
                  rows={4}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Kysymyslista
                </label>
                <textarea
                  value={newCallType.questions || ''}
                  onChange={e => setNewCallType({ ...newCallType, questions: e.target.value })}
                  placeholder="Kysymyslista tai ohjeet kysymyksille..."
                  rows={6}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Lopetusrepliikki
                </label>
                <textarea
                  value={newCallType.outro || ''}
                  onChange={e => setNewCallType({ ...newCallType, outro: e.target.value })}
                  placeholder="Lopetusrepliikki puhelulle..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                  Lisämuistiinpanot
                </label>
                <textarea
                  value={newCallType.notes || ''}
                  onChange={e => setNewCallType({ ...newCallType, notes: e.target.value })}
                  placeholder="Lisämuistiinpanot ja ohjeet..."
                  rows={3}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              style={{ fontSize: 14 }}
            >
              Peruuta
            </Button>
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handlePrevious}
                variant="secondary"
                style={{ fontSize: 14 }}
              >
                Edellinen
              </Button>
            )}
          </div>
          
          <div>
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!newCallType.callType}
                style={{ fontSize: 14 }}
              >
                Seuraava
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !newCallType.callType}
                style={{ fontSize: 14 }}
              >
                {loading ? 'Lisätään...' : 'Lisää puhelutyyppi'}
              </Button>
            )}
          </div>
        </div>
        
        {error && <div style={{ color: '#dc2626', marginTop: 12 }}>{error}</div>}
        {success && <div style={{ color: '#16a34a', marginTop: 12 }}>{success}</div>}
      </div>
    </div>
  )
}

export default AddCallTypeModal 