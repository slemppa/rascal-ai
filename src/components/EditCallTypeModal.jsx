import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import './ModalComponents.css'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

const EditCallTypeModal = ({ 
  showModal, 
  onClose, 
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
    { id: 1, label: t('calls.modals.editCallType.steps.basics') },
    { id: 2, label: t('calls.modals.editCallType.steps.content') },
    { id: 3, label: t('calls.modals.editCallType.steps.advanced') },
    { id: 4, label: t('calls.modals.editCallType.steps.summary') },
    { id: 5, label: t('calls.modals.editCallType.steps.textMessages') },
    { id: 6, label: t('calls.modals.editCallType.steps.aiEnhancement') }
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

  // Lähetä puhelun tyyppi AI-parannukseen
  const handleAIEnhancement = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/call-type-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          call_type_id: editingCallType.id
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
      <div className="modal-container edit-call-type-modal" style={{ maxWidth: '1200px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {t('calls.modals.editCallType.title')}
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

        {/* Sisältö */}
        <div className="modal-content">
          {currentStep === 1 && (
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
                  Kieli
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
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.agentName')}
                  </label>
                  <input
                    type="text"
                    value={editingCallType.agent_name || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, agent_name: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.agentName')}
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
                    {t('calls.modals.editCallType.fields.targetAudience')}
                  </label>
                  <input
                    type="text"
                    value={editingCallType.target_audience || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, target_audience: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.targetAudience')}
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
                    {t('calls.modals.editCallType.fields.agentPersona')}
                  </label>
                  <textarea
                    value={editingCallType.identity || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, identity: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.agentPersona')}
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
                    {t('calls.modals.editCallType.fields.toneStyle')}
                  </label>
                  <textarea
                    value={editingCallType.style || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, style: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.toneStyle')}
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
                    {t('calls.modals.editCallType.fields.callGoals')}
                  </label>
                  <textarea
                    value={editingCallType.goals || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, goals: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.callGoals')}
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
                    {t('calls.modals.editCallType.fields.guidelines')}
                  </label>
                  <textarea
                    value={editingCallType.guidelines || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, guidelines: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.guidelines')}
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
                    {t('calls.modals.editCallType.fields.greeting')}
                  </label>
                  <input
                    type="text"
                    value={editingCallType.first_line || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, first_line: e.target.value })}
                    className="form-input"
                    placeholder={t('calls.modals.editCallType.placeholders.greeting')}
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 {t('calls.modals.editCallType.examples.users')}</div>
                  <div style={{ lineHeight: 1.6 }}>{t('calls.modals.editCallType.examples.greeting')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.purposeIntro')}
                  </label>
                  <textarea
                    value={editingCallType.intro || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, intro: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.purposeIntro')}
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 {t('calls.modals.editCallType.examples.users')}</div>
                  <div style={{ lineHeight: 1.6 }}>{t('calls.modals.editCallType.examples.purposeIntro')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.questions')}
                  </label>
                  <textarea
                    value={editingCallType.questions || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, questions: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.questions')}
                    rows={8}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 {t('calls.modals.editCallType.examples.users')}</div>
                  <div style={{ lineHeight: 1.6 }}>{t('calls.modals.editCallType.examples.questions')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.closing')}
                  </label>
                  <textarea
                    value={editingCallType.outro || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, outro: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.closing')}
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 {t('calls.modals.editCallType.examples.users')}</div>
                  <div style={{ lineHeight: 1.6 }}>{t('calls.modals.editCallType.examples.closing')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.agentNotes')}
                  </label>
                  <textarea
                    value={editingCallType.notes || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, notes: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.agentNotes')}
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 {t('calls.modals.editCallType.examples.users')}</div>
                  <div style={{ lineHeight: 1.6 }}>{t('calls.modals.editCallType.examples.agentNotes')}</div>
                </div>
              </div>

            </div>
          )}

          {currentStep === 4 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.summary')}
                  </label>
                  <textarea
                    value={editingCallType.summary || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, summary: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.summary')}
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>Yhteenveto: Ava kartoittaa tarpeen (budjetti, tavoite, aikataulu) ja varaa 15 min esittelyn, jos kriteerit täyttyvät. Tyyli: lämmin ja napakka, ei small talkia.</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.successAssessment')}
                  </label>
                  <textarea
                    value={editingCallType.success_assessment || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, success_assessment: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.successAssessment')}
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
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>Write a concise and warm message that introduces the call and sets expectations. This message is sent automatically before the call.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
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
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>Thank you for taking our call! This message is sent after the customer answers the phone and the call ends.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
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
                {t('calls.modals.editCallType.buttons.previous')}
              </Button>
            )}
          </div>
          
          <div className="modal-actions-right">
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
              >
                {t('calls.modals.editCallType.buttons.next')}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
              >
                {t('calls.modals.editCallType.buttons.saveChanges')}
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