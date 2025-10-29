import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import './ModalComponents.css'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

const AddCallTypeModal = ({ 
  showModal, 
  onClose, 
  newCallType, 
  setNewCallType, 
  onAdd, 
  loading, 
  error, 
  success,
  onAIEnhancementSent
}) => {
  const { t } = useTranslation('common')
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6

  // Auto-resize viite Yhteenveto-kentälle
  const summaryRef = useRef(null)

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

  // Säädä Yhteenveto-tekstialueen korkeus sisällön mukaan
  useEffect(() => {
    const el = summaryRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [newCallType.summary, currentStep, showModal])

  if (!showModal) return null

  const steps = [
    { id: 1, label: t('calls.modals.addCallType.steps.basics') },
    { id: 2, label: t('calls.modals.addCallType.steps.content') },
    { id: 3, label: t('calls.modals.addCallType.steps.advanced') },
    { id: 4, label: t('calls.modals.addCallType.steps.summary') },
    { id: 5, label: t('calls.modals.addCallType.steps.textMessages') },
    { id: 6, label: t('calls.modals.addCallType.steps.aiEnhancement') }
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
    onAdd()
  }

  // Lähetä puhelun tyyppi AI-parannukseen
  const handleAIEnhancement = async () => {
    // Tarkista että call type on tallennettu tietokantaan
    if (!newCallType.id) {
      alert('Tallenna ensin puhelun tyyppi ennen AI-parannusta!')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/call-type-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          call_type_id: newCallType.id
        })
      })

      if (response.ok) {
        alert('Puhelun tyyppi lähetetty AI-parannukseen! Saat parannetun version pian.')
        // Merkitse että AI-parannus on lähetetty ja sulje modaali
        if (onAIEnhancementSent) {
          onAIEnhancementSent()
        }
        onClose()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Lähetys epäonnistui')
      }
    } catch (error) {
      console.error('AI-parannuksen lähetys epäonnistui:', error)
      alert('AI-parannuksen lähetys epäonnistui: ' + (error.message || error))
    }
  }

  return createPortal(
    <div className="modal-overlay modal-overlay--light" onClick={handleOverlayClick}>
      <div className="modal-container" style={{ maxWidth: '1200px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {t('calls.modals.addCallType.title')}
          </h2>
          <button
            onClick={onClose}
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

        {/* Content */}
        <div className="modal-content">
          {currentStep === 1 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.addCallType.fields.name')} *
                </label>
                <input
                  type="text"
                  value={newCallType.callType}
                  onChange={e => setNewCallType({ ...newCallType, callType: e.target.value })}
                  placeholder={t('calls.modals.addCallType.placeholders.name')}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.addCallType.fields.status')}
                </label>
                <select
                  value={newCallType.status || 'Active'}
                  onChange={e => setNewCallType({ ...newCallType, status: e.target.value })}
                  className="form-select"
                >
                  <option value="Active">{t('calls.modals.addCallType.statusOptions.active')}</option>
                  <option value="Draft">{t('calls.modals.addCallType.statusOptions.draft')}</option>
                  <option value="Archived">{t('calls.modals.addCallType.statusOptions.archived')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Kieli
                </label>
                <select
                  value={newCallType.language || 'fi'}
                  onChange={e => setNewCallType({ ...newCallType, language: e.target.value })}
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
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.agentName')}
                  </label>
                  <input
                    type="text"
                    value={newCallType.agent_name || ''}
                    onChange={e => setNewCallType({ ...newCallType, agent_name: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.agentName')}
                    className="form-input"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Esimerkki: Agentin nimi</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
Nimi: Ava
Rooli: Ajanvarausagentti (Rascal Company)
Tavoite: Sovi 15 min esittelypuhelu pätevien liidien kanssa.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.targetAudience')}
                  </label>
                  <input
                    type="text"
                    value={newCallType.target_audience || ''}
                    onChange={e => setNewCallType({ ...newCallType, target_audience: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.targetAudience')}
                    className="form-input"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Esimerkki: Kohdeyleisö</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
Kohdeyleisö: Toimitusjohtajat ja päättäjät B2B‑yrityksissä (10–200 hlö).
Tarve: Kasvu ja laadukkaat inbound‑liidit.
Arvolupaus: Rascal AI tuottaa jatkuvaa liidivirtaa ja säästää myynnin aikaa.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.agentPersona')}
                  </label>
                  <textarea
                    value={newCallType.identity || ''}
                    onChange={e => setNewCallType({ ...newCallType, identity: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.agentPersona')}
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Esimerkki: Agentin persoona</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
Persoona: Lämmin ja selkeä. Ei small talkia.
Säännöt: Ei spekulointia. Tiivistä asiakkaan vastaus ennen seuraavaa kysymystä.
Tunnetilanteet: Tunnista ja sanoita lyhyesti ("Ymmärrän, kuulostaa kiireiseltä").
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.toneStyle')}
                  </label>
                  <textarea
                    value={newCallType.style || ''}
                    onChange={e => setNewCallType({ ...newCallType, style: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.toneStyle')}
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Esimerkki: Sävystä</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
Tyyli: Lyhyet lauseet. Yksi kysymys kerrallaan.
Malli: "Kiitos vastauksesta. Ymmärsinkö oikein, että…?" → seuraava kysymys.
Brändiääni: selkeä, lämmin, ratkaisukeskeinen.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.callGoals')}
                  </label>
                  <textarea
                    value={newCallType.goals || ''}
                    onChange={e => setNewCallType({ ...newCallType, goals: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.callGoals')}
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Esimerkki: Tavoitteet</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
Päätavoite: Varaa 15 min esittelypuhelu pätevän liidin kanssa.
IF: budjetti ja tarve ovat olemassa → THEN: tarjoa aikaa.
IF: ei sopiva hetki → THEN: ystävällinen lopetus + lupa palata myöhemmin.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.guidelines')}
                  </label>
                  <textarea
                    value={newCallType.guidelines || ''}
                    onChange={e => setNewCallType({ ...newCallType, guidelines: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.guidelines')}
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Esimerkki: Vastaväitteet & poikkeukset</div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
"Liian kallis" → "Ymmärrän. Asiakkaamme säästävät keskimäärin 6–10 h/kk myynnin aikaa. Sopiiko, että näytän 15 min esittelyssä, miten?"
"Vain katselen" → "Nopea 15 min demo auttaa näkemään, onko tästä hyötyä juuri teille. Sopiiko aika ensi viikolle?"
"En tiedä" → "Sanon rehellisesti, jos en tiedä ja ohjaan kollegalle."
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.greeting')}
                  </label>
                  <input
                    type="text"
                    value={newCallType.first_line || ''}
                    onChange={e => setNewCallType({ ...newCallType, first_line: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.greeting')}
                    className="form-input"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 {t('calls.modals.addCallType.examples.users')}</div>
                  <div style={{ lineHeight: 1.6 }}>{t('calls.modals.addCallType.examples.greeting')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.purposeIntro')}
                  </label>
                  <textarea
                    value={newCallType.intro || ''}
                    onChange={e => setNewCallType({ ...newCallType, intro: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.purposeIntro')}
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 {t('calls.modals.addCallType.examples.users')}</div>
                  <div style={{ lineHeight: 1.6 }}>{t('calls.modals.addCallType.examples.purposeIntro')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.questions')}
                  </label>
                  <textarea
                    value={newCallType.questions || ''}
                    onChange={e => setNewCallType({ ...newCallType, questions: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.questions')}
                    rows={8}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 {t('calls.modals.addCallType.examples.users')}</div>
                  <div style={{ lineHeight: 1.6 }}>{t('calls.modals.addCallType.examples.questions')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.closing')}
                  </label>
                  <textarea
                    value={newCallType.outro || ''}
                    onChange={e => setNewCallType({ ...newCallType, outro: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.closing')}
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 {t('calls.modals.addCallType.examples.users')}</div>
                  <div style={{ lineHeight: 1.6 }}>{t('calls.modals.addCallType.examples.closing')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.agentNotes')}
                  </label>
                  <textarea
                    value={newCallType.notes || ''}
                    onChange={e => setNewCallType({ ...newCallType, notes: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.agentNotes')}
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 {t('calls.modals.addCallType.examples.users')}</div>
                  <div style={{ lineHeight: 1.6 }}>{t('calls.modals.addCallType.examples.agentNotes')}</div>
                </div>
              </div>


            </div>
          )}

          {currentStep === 4 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.summary')}
                  </label>
                  <textarea
                    ref={summaryRef}
                    value={newCallType.summary || ''}
                    onChange={e => setNewCallType({ ...newCallType, summary: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.summary')}
                    rows={1}
                    className="form-textarea"
                    style={{ resize: 'none', overflow: 'hidden' }}
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>Yhteenveto: Agentti kartoittaa tarpeen (budjetti, tavoite, aikataulu) ja varaa 15 min esittelyn, jos kriteerit täyttyvät. Tyyli: lämmin ja napakka, ei small talkia.</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.successAssessment')}
                  </label>
                  <textarea
                    value={newCallType.success_assessment || ''}
                    onChange={e => setNewCallType({ ...newCallType, success_assessment: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.successAssessment')}
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>Onnistumiskriteerit: Varattu aika tai kelpuutettu liidi. Vastaukset lyhyitä ja johdonmukaisia. Noudattaa sääntöjä (ei small talkia, ei spekulointia).</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.firstSms')}
                  </label>
                  <textarea
                    value={newCallType.first_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setNewCallType({ ...newCallType, first_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.addCallType.placeholders.firstSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea"
                    style={{ resize: 'none', overflowY: 'auto', maxHeight: '120px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 12 }}>
                    <span style={{ color: '#6b7280' }}>
                      {newCallType.first_sms ? `${newCallType.first_sms.length}/160 characters` : '0/160 characters'}
                    </span>
                    {newCallType.first_sms && newCallType.first_sms.length > 140 && (
                      <span style={{ color: '#f59e0b' }}>
                        ⚠️ Long message ({newCallType.first_sms.length > 150 ? '2 messages' : '1 message'})
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>Write a concise and warm message that introduces the call and sets expectations. This message is sent automatically before the call.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.afterCallSms')}
                  </label>
                  <textarea
                    value={newCallType.after_call_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setNewCallType({ ...newCallType, after_call_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.addCallType.placeholders.afterCallSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea"
                    style={{ resize: 'none', overflowY: 'auto', maxHeight: '120px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 12 }}>
                    <span style={{ color: '#6b7280' }}>
                      {newCallType.after_call_sms ? `${newCallType.after_call_sms.length}/160 characters` : '0/160 characters'}
                    </span>
                    {newCallType.after_call_sms && newCallType.after_call_sms.length > 140 && (
                      <span style={{ color: '#f59e0b' }}>
                        ⚠️ Long message ({newCallType.after_call_sms.length > 150 ? '2 messages' : '1 message'})
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>Thank you for taking our call! This message is sent after the customer answers the phone and the call ends.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.missedCallSms')}
                  </label>
                  <textarea
                    value={newCallType.missed_call_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setNewCallType({ ...newCallType, missed_call_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.addCallType.placeholders.missedCallSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea"
                    style={{ resize: 'none', overflowY: 'auto', maxHeight: '120px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: 12 }}>
                    <span style={{ color: '#6b7280' }}>
                      {newCallType.missed_call_sms ? `${newCallType.missed_call_sms.length}/160 characters` : '0/160 characters'}
                    </span>
                    {newCallType.missed_call_sms && newCallType.missed_call_sms.length > 140 && (
                      <span style={{ color: '#f59e0b' }}>
                        ⚠️ Long message ({newCallType.missed_call_sms.length > 150 ? '2 messages' : '1 message'})
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>We tried to reach you but couldn't connect. This message is sent when the customer doesn't answer the phone.</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', margin: '0 0 8px 0' }}>
                  {t('calls.modals.addCallType.aiEnhancement.title')}
                </h3>
                <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                  {t('calls.modals.addCallType.aiEnhancement.description')}
                </p>
              </div>
              
              <div style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: 8, 
                padding: 16
              }}>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: 500 }}>
                  {t('calls.modals.addCallType.aiEnhancement.benefits.title')}
                </div>
                <ul style={{ fontSize: 12, color: '#6b7280', margin: 0, paddingLeft: 16, lineHeight: 1.4 }}>
                  <li>{t('calls.modals.addCallType.aiEnhancement.benefits.optimize')}</li>
                  <li>{t('calls.modals.addCallType.aiEnhancement.benefits.improve')}</li>
                  <li>{t('calls.modals.addCallType.aiEnhancement.benefits.suggest')}</li>
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
                {t('calls.modals.addCallType.aiEnhancement.cta')}
              </Button>
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
              {t('common.cancel')}
            </Button>
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handlePrevious}
                variant="secondary"
              >
                {t('calls.modals.addCallType.buttons.previous')}
              </Button>
            )}
          </div>
          
          <div className="modal-actions-right">
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!newCallType.callType}
              >
                {t('calls.modals.addCallType.buttons.next')}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !newCallType.callType}
              >
                {loading ? 'Adding…' : t('calls.modals.addCallType.buttons.addCallType')}
              </Button>
            )}
          </div>
        </div>
        
        {error && <div className="modal-error">{error}</div>}
        {success && <div className="modal-success">{success}</div>}
      </div>
    </div>,
    document.body
  )
}

export default AddCallTypeModal 