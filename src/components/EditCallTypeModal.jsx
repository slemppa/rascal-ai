import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import './ModalComponents.css'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

const EditCallTypeModal = ({ 
  showModal, 
  onClose, 
  onCancel,
  editingCallType, 
  setEditingCallType, 
  onSave,
  onAIEnhancementSent
}) => {
  const { t } = useTranslation('common')
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6

  // ESC-toiminnallisuus - pitää olla heti useState jälkeen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        const cancelHandler = onCancel || onClose
        cancelHandler()
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showModal, onClose, onCancel])

  if (!showModal || !editingCallType) return null

  const steps = [
    { id: 1, label: 'Perustiedot' },
    { id: 2, label: 'Kohderyhmä ja tavoite' },
    { id: 3, label: 'Puheluskripti' },
    { id: 4, label: 'Yhteenveto' },
    { id: 5, label: 'SMS-viestit' },
    { id: 6, label: t('calls.modals.editCallType.steps.aiEnhancement') }
  ]

  // Tyhjän tilan klikkaus
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      const cancelHandler = onCancel || onClose
      cancelHandler()
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

  const handleSubmit = async () => {
    if (onSave) {
      await onSave()
      // onSave sulkee modaalin CallPanel.jsx:ssä
      // Jos modaali ei sulkeudu, kutsu onClose() manuaalisesti
      setTimeout(() => {
        if (showModal && onClose) {
          onClose()
        }
      }, 100)
    } else if (onClose) {
      onClose()
    }
  }

  // Lähetä puhelun tyyppi AI-parannukseen
  const handleAIEnhancement = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/calls/type-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          call_type_id: editingCallType.id
        })
      })

      if (!response.ok) {
        // Tarkista onko vastaus JSON vai HTML
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Lähetys epäonnistui')
        } else {
          // Jos vastaus on HTML (404-sivu), endpoint ei löydy
          throw new Error(`API endpoint ei löydy (${response.status}). Tarkista että /api/calls/type-improvement on olemassa.`)
        }
      }

      const result = await response.json()
      alert('Puhelun tyyppi lähetetty AI-parannukseen! Saat parannetun version pian.')
      // Merkitse että AI-parannus on lähetetty ja sulje modaali
      if (onAIEnhancementSent) {
        onAIEnhancementSent()
      }
      onClose()
    } catch (error) {
      console.error('AI-parannuksen lähetys epäonnistui:', error)
      alert('AI-parannuksen lähetys epäonnistui: ' + (error.message || error))
    }
  }

  return createPortal(
    <div className="modal-overlay modal-overlay--light" onClick={handleOverlayClick}>
      <div className="modal-container edit-call-type-modal" style={{ maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {t('calls.modals.editCallType.title')}
          </h2>
          <button
            onClick={() => {
              const cancelHandler = onCancel || onClose
              cancelHandler()
            }}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>

        {/* Vaiheindikaattori */}
        <div className="steps-container">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="step-item" onClick={() => setCurrentStep(step.id)} style={{ cursor: 'pointer' }}>
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
        <div className="modal-content" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {currentStep === 1 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.name')}
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
                    {t('calls.modals.editCallType.fields.status')}
                  </label>
                  <select
                    value={editingCallType.status || 'Active'}
                    onChange={e => setEditingCallType({ ...editingCallType, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="Active">{t('calls.modals.editCallType.statusOptions.active')}</option>
                    <option value="Draft">{t('calls.modals.editCallType.statusOptions.draft')}</option>
                    <option value="Archived">{t('calls.modals.editCallType.statusOptions.archived')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.language')}
                  </label>
                  <select
                    value={editingCallType.language || 'fi'}
                    onChange={e => setEditingCallType({ ...editingCallType, language: e.target.value })}
                    className="form-select"
                  >
                    <option value="en-US">🇺🇸 English (US)</option>
                    <option value="bg">🇧🇬 Български</option>
                    <option value="cs">🇨🇿 Čeština</option>
                    <option value="de-DE">🇩🇪 Deutsch</option>
                    <option value="el">🇬🇷 Ελληνικά</option>
                    <option value="fi">🇫🇮 Suomi</option>
                    <option value="fr-FR">🇫🇷 Français</option>
                    <option value="es-ES">🇪🇸 Español</option>
                    <option value="hu">🇭🇺 Magyar</option>
                    <option value="it">🇮🇹 Italiano</option>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                    <option value="nl-NL">🇳🇱 Nederlands</option>
                    <option value="hi">🇮🇳 हिन्दी</option>
                    <option value="zh-CN">🇨🇳 中文</option>
                    <option value="no">🇳🇴 Norsk</option>
                    <option value="sv-SE">🇸🇪 Svenska</option>
                    <option value="da">🇩🇰 Dansk</option>
                    <option value="da-DK">🇩🇰 Dansk (Danmark)</option>
                    <option value="id">🇮🇩 Bahasa Indonesia</option>
                    <option value="ja">🇯🇵 日本語</option>
                    <option value="ko">🇰🇷 한국어</option>
                    <option value="ms">🇲🇾 Bahasa Melayu</option>
                    <option value="ro">🇷🇴 Română</option>
                    <option value="ru">🇷🇺 Русский</option>
                    <option value="sk">🇸🇰 Slovenčina</option>
                    <option value="tr">🇹🇷 Türkçe</option>
                    <option value="uk">🇺🇦 Українська</option>
                    <option value="vi">🇻🇳 Tiếng Việt</option>
                    <option value="th">🇹🇭 ไทย</option>
                    <option value="pl">🇵🇱 Polski</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.agentName')}
                  </label>
                  <input
                    type="text"
                    value={editingCallType.agent_name || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, agent_name: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, marginTop: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 16, marginTop: 0 }}>
                  {t('calls.modals.editCallType.fields.callSettings')}
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      {t('calls.modals.editCallType.fields.responseSpeed')}
                    </label>
                    <select
                      value={editingCallType.response_speed || '3'}
                      onChange={e => setEditingCallType({ ...editingCallType, response_speed: e.target.value })}
                      className="form-select"
                    >
                      <option value="1">1sec</option>
                      <option value="3">3sec</option>
                      <option value="5">5sec</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {t('calls.modals.editCallType.fields.initialPause')}
                    </label>
                    <select
                      value={editingCallType.initial_pause || '2'}
                      onChange={e => setEditingCallType({ ...editingCallType, initial_pause: e.target.value })}
                      className="form-select"
                    >
                      <option value="1">1sec</option>
                      <option value="2">2sec</option>
                      <option value="3">3sec</option>
                      <option value="5">5sec</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <label className="form-label">{t('calls.modals.editCallType.fields.targetAudience')}</label>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 0 }}>
                  Kenelle tämä puhelu on tarkoitettu? Esim. "yrityksen toimitusjohtajat", "kaupan eineshankinta", "Inbound-liidit".
                </p>
                <input
                  type="text"
                  value={editingCallType.target_audience || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, target_audience: e.target.value })}
                  placeholder="Yritysten talouspäättäjät, Kaupan vastaavat, LVI-yritysten yrittäjät"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('calls.modals.editCallType.fields.mainGoal')}</label>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 0 }}>
                  Mitä haluat saavuttaa puhelulla? Kirjoita 1–3 tavoitetta. Esim. "kiinnostuksen herättäminen", "ajan sopiminen", "kvalifiointi".
                </p>
                <textarea
                  value={editingCallType.goals || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, goals: e.target.value })}
                  placeholder="Kysy kiinnostusta, pyydä varmistus, kerro tapahtumasta ja varmista osallistuminen"
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('calls.modals.editCallType.fields.toneStyle')}</label>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 0 }}>
                  Millä sävyllä agentin tulisi puhua? Esim. "selkeä, ystävällinen, asiallinen, teitittelevä".
                </p>
                <textarea
                  value={editingCallType.style || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, style: e.target.value })}
                  placeholder="Ystävällinen, asiallinen ja rauhallinen. Ei smalltalkia."
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.editCallType.fields.firstSentence')}
                </label>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 0 }}>
                  Ensimmäinen lause sen jälkeen kun asiakas puhuu. Pidä lyhyenä. Esim. "Hei, olen [Agentti], saanko kysyä yhden asian?".
                </p>
                <input
                  type="text"
                  value={editingCallType.first_line || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, first_line: e.target.value })}
                  className="form-input"
                  placeholder="Moi! Olen [agent_name], [yrityksestä]."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.editCallType.fields.callStart')}
                </label>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 0 }}>
                  Miten esittelet asian lyhyesti? Kerro tarkoitus kahdella lauseella ja kysy lupa jatkaa.
                </p>
                <textarea
                  value={editingCallType.intro || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, intro: e.target.value })}
                  placeholder="Meillä on uusia tuotteita, haluaisin nopeasti kertoa niistä."
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.editCallType.fields.questions')}
                </label>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 0 }}>
                  Muotoile kysymykset lyhyiksi. Kysy vain yksi asia kerrallaan. Jokaisen jälkeen agentti odottaa vastausta automaattisesti.
                </p>
                <textarea
                  value={editingCallType.questions || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, questions: e.target.value })}
                  placeholder={`Kiinnostaisiko testata?
Haluaisitteko tilata nyt?
Olisiko oikea henkilö paikalla?`}
                  rows={8}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.editCallType.fields.callEnd')}
                </label>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 0 }}>
                  Lopeta kohteliaasti ja tarjoa seuraava askel (esim. ajan sopiminen tai lisätietojen lähettäminen).
                </p>
                <textarea
                  value={editingCallType.outro || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, outro: e.target.value })}
                  placeholder="Kiitos ajastanne! Palataan tarvittaessa asiaan."
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.editCallType.fields.successfulEnd')}
                </label>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 0 }}>
                  Milloin puhelu katsotaan onnistuneeksi? Esim. "kun asiakas ilmaisee kiinnostusta jatkaa keskustelua".
                </p>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 0 }}>
                  Valitse valmis Action-pohja (valinnainen):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {['Myyntipuhelu', 'Ajanvaraus', 'Tapahtumakutsu', 'Follow-up', 'Lead qualification', 'Universaali action'].map((preset) => {
                    const presetTexts = {
                      'Myyntipuhelu': 'Merkitse puhelu onnistuneeksi, kun asiakas ilmaisee kiinnostusta ostaa tuote tai palvelu. Varmista seuraavat askeleet: lähetä tarjous, varaa demo tai sovita seuraava puhelu.',
                      'Ajanvaraus': 'Merkitse puhelu onnistuneeksi, kun asiakas suostuu varaamaan ajan. Varmista seuraavat askeleet: vahvista päivämäärä ja kellonaika, lähetä kalenterilinkki tai vahvista muulla tavalla.',
                      'Tapahtumakutsu': 'Merkitse puhelu onnistuneeksi, kun asiakas suostuu osallistumaan tapahtumaan. Varmista seuraavat askeleet: lähetä tapahtuman tiedot, vahvista osallistuminen tai kerää lisätiedot.',
                      'Follow-up': 'Merkitse puhelu onnistuneeksi, kun asiakas on kiinnostunut jatkamaan keskustelua. Varmista seuraavat askeleet: sovita seuraava puhelu, lähetä lisämateriaaleja tai merkitse seurantaan.',
                      'Lead qualification': 'Merkitse puhelu onnistuneeksi, kun asiakas täyttää kvalifiointikriteerit. Varmista seuraavat askeleet: kerää tarvittavat tiedot, arvioi potentiaali ja siirrä myyntiprosessiin.',
                      'Universaali action': 'Merkitse puhelu onnistuneeksi, kun asiakas ilmaisee kiinnostusta jatkaa keskustelua tuotteesta tai palvelusta.'
                    }
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setEditingCallType({ 
                            ...editingCallType, 
                            action: presetTexts[preset] || '' // Tallennetaan preset-teksti action-kenttään Supabaseen
                          })
                        }}
                        style={{
                          padding: '8px 16px',
                          fontSize: 13,
                          fontWeight: 500,
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: '#374151',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#e5e7eb'
                          e.target.style.borderColor = '#9ca3af'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#f3f4f6'
                          e.target.style.borderColor = '#d1d5db'
                        }}
                      >
                        {preset}
                      </button>
                    )
                  })}
                </div>
                <textarea
                  value={editingCallType.action || ''}
                  readOnly
                  placeholder="Merkitse puhelu onnistuneeksi, kun asiakas ilmaisee kiinnostusta jatkaa keskustelua tuotteesta tai palvelusta."
                  rows={4}
                  className="form-textarea"
                  style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.summary')}
                  </label>
                  <textarea
                    value={editingCallType.summary || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, summary: e.target.value })}
                    placeholder="Kirjoita kaupan nimi mihin soitit ja tilaus mitä kauppa tilasi
pyysikö kauppa olemaan vielä yhteydessä"
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini-esimerkki</div>
                  <div>Tiivistä 2-3 lauseessa: osallistuiko [tapahtumaan], keskeiset kiinnostukset/haasteet, sovitut seuraavat askeleet (aika/tapa).</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.successAssessment')}
                  </label>
                  <textarea
                    value={editingCallType.success_assessment || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, success_assessment: e.target.value })}
                    placeholder={`• Arvioi 2-3 lauseessa, täyttyivätkö Tavoitteet-osion tavoitteet.
• Kuvaa miksi se onnistui/ei onnistunut ja mainitse puuttuvat kohdat.`}
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini-esimerkki</div>
                  <div>Arvioi, saavutettiinko: 1) tiedonkeruu, 2) kiinnostukset/haasteet, 3) seuranta, 4) yhteystapa/aika. Perustele lyhyesti.</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.firstSms')}
                  </label>
                  <textarea
                    value={editingCallType.first_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setEditingCallType({ ...editingCallType, first_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.editCallType.placeholders.firstSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea"
                    style={{ resize: 'none', overflowY: 'auto', maxHeight: '120px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 12 }}>
                    <span style={{ color: '#6b7280' }}>
                      {editingCallType.first_sms ? `${editingCallType.first_sms.length}/160 characters` : '0/160 characters'}
                    </span>
                    {editingCallType.first_sms && editingCallType.first_sms.length > 140 && (
                      <span style={{ color: '#f59e0b' }}>
                        ⚠️ Long message ({editingCallType.first_sms.length > 150 ? '2 messages' : '1 message'})
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini-esimerkki</div>
                  <div>Kirjoita ytimekäs ja lämmin viesti, joka esittelee puhelun ja asettaa odotukset. Tämä viesti lähetetään automaattisesti ennen puhelua.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.afterCallSms')}
                  </label>
                  <textarea
                    value={editingCallType.after_call_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setEditingCallType({ ...editingCallType, after_call_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.editCallType.placeholders.afterCallSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea"
                    style={{ resize: 'none', overflowY: 'auto', maxHeight: '120px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 12 }}>
                    <span style={{ color: '#6b7280' }}>
                      {editingCallType.after_call_sms ? `${editingCallType.after_call_sms.length}/160 characters` : '0/160 characters'}
                    </span>
                    {editingCallType.after_call_sms && editingCallType.after_call_sms.length > 140 && (
                      <span style={{ color: '#f59e0b' }}>
                        ⚠️ Long message ({editingCallType.after_call_sms.length > 150 ? '2 messages' : '1 message'})
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>Thank you for taking our call! This message is sent after the customer answers the phone and the call ends.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.missedCallSms')}
                  </label>
                  <textarea
                    value={editingCallType.missed_call_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setEditingCallType({ ...editingCallType, missed_call_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.editCallType.placeholders.missedCallSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea"
                    style={{ resize: 'none', overflowY: 'auto', maxHeight: '120px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 12 }}>
                    <span style={{ color: '#6b7280' }}>
                      {editingCallType.missed_call_sms ? `${editingCallType.missed_call_sms.length}/160 characters` : '0/160 characters'}
                    </span>
                    {editingCallType.missed_call_sms && editingCallType.missed_call_sms.length > 140 && (
                      <span style={{ color: '#f59e0b' }}>
                        ⚠️ Long message ({editingCallType.missed_call_sms.length > 150 ? '2 messages' : '1 message'})
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>We tried to reach you but couldn't connect. This message is sent when the customer doesn't answer the phone.</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', margin: '0 0 8px 0' }}>
                  {t('calls.modals.editCallType.aiEnhancement.title')}
                </h3>
                <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                  {t('calls.modals.editCallType.aiEnhancement.description')}
                </p>
              </div>
              
              <div style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: 8, 
                padding: 16
              }}>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: 500 }}>
                  {t('calls.modals.editCallType.aiEnhancement.benefits.title')}
                </div>
                <ul style={{ fontSize: 12, color: '#6b7280', margin: 0, paddingLeft: 16, lineHeight: 1.4 }}>
                  <li>{t('calls.modals.editCallType.aiEnhancement.benefits.optimize')}</li>
                  <li>{t('calls.modals.editCallType.aiEnhancement.benefits.improve')}</li>
                  <li>{t('calls.modals.editCallType.aiEnhancement.benefits.suggest')}</li>
                </ul>
              </div>
              
              <Button
                onClick={handleAIEnhancement}
                style={{
                  background: '#f97316',
                  color: '#fff',
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  width: 'auto',
                  alignSelf: 'center'
                }}
              >
                {t('calls.modals.editCallType.aiEnhancement.cta')}
              </Button>
            </div>
          )}

        </div>
        
        <div className="modal-actions">
          <div className="modal-actions-left">
            <Button
              type="button"
              onClick={() => {
                const cancelHandler = onCancel || onClose
                cancelHandler()
              }}
              variant="secondary"
            >
              {t('common.cancel')}
            </Button>
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handlePrevious}
                variant="secondary"
              >
                {t('calls.modals.editCallType.buttons.previous')}
              </Button>
            )}
          </div>
          
          <div className="modal-actions-right">
            <Button
              type="button"
              onClick={handleSubmit}
            >
              {t('common.save')}
            </Button>
            {currentStep < totalSteps && (
              <Button
                type="button"
                onClick={handleNext}
                variant="secondary"
              >
                {t('calls.modals.editCallType.buttons.next')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default EditCallTypeModal 