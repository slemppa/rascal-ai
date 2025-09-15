import React, { useState, useEffect } from 'react'
import Button from './Button'
import './ModalComponents.css'
import { useTranslation } from 'react-i18next'

const EditCallTypeModal = ({ 
  showModal, 
  onClose, 
  editingCallType, 
  setEditingCallType, 
  onSave 
}) => {
  const { t } = useTranslation('common')
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

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
    { id: 5, label: t('calls.modals.editCallType.steps.aiEnhancement') }
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
      const response = await fetch('/api/call-type-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_type_id: editingCallType.id
        })
      })

      if (response.ok) {
        alert('Puhelun tyyppi lähetetty AI-parannukseen! Saat parannetun version pian.')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Lähetys epäonnistui')
      }
    } catch (error) {
      console.error('AI-parannuksen lähetys epäonnistui:', error)
      alert('AI-parannuksen lähetys epäonnistui: ' + (error.message || error))
    }
  }

  return (
    <div className="modal-overlay modal-overlay--light" onClick={handleOverlayClick}>
      <div className="modal-container edit-call-type-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            Edit call type
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
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  {t('calls.modals.editCallType.fields.version')}
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
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">AI role</label>
                  <textarea
                    value={editingCallType.identity || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, identity: e.target.value })}
                    placeholder={
`• Who is the assistant (name + role)?\n• Under which brand does it operate?\n• What problem/situation does it help solve?\n• What high-level goal does it serve?`
                    }
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>You are [Name], [Company]'s AI assistant. You help [target audience] with [topic] and hand over to a human expert when needed.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Speaking style</label>
                  <textarea
                    value={editingCallType.style || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, style: e.target.value })}
                    placeholder={
`• Language and mode of address.\n• Tone: friendly/concise/professional.\n• Avoid: jargon, long sentences.\n• Rhythm: short sentences, natural pauses (… or –).`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>Speak clearly and warmly; keep it concise. Avoid jargon. Use short sentences and natural pauses (… or –).</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Call goals</label>
                  <textarea
                    value={editingCallType.goals || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, goals: e.target.value })}
                    placeholder={
`• List 3–5 concrete goals for this call type.\n• What information must be collected?\n• What is the outcome/next step?`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>1) Find out [X]. 2) Map [interests/challenges]. 3) Offer a helpful option. 4) Ask for follow-up. 5) Collect best time and contact method.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Conversation guidelines</label>
                  <textarea
                    value={editingCallType.guidelines || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, guidelines: e.target.value })}
                    placeholder={
`• How to pace the conversation.\n• One question at a time, wait for answer.\n• Clarify if the answer is unclear.\n• If customer asks → answer briefly then return to script.\n• Show empathy and do not interrupt.`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>Ask one question at a time and wait. If unclear, ask for an example. Answer briefly and continue the script.</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Opening line</label>
                  <input
                    type="text"
                    value={editingCallType.first_line || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, first_line: e.target.value })}
                    className="form-input"
                    placeholder="What the assistant says first when the call starts"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>This is what the assistant says first when the call starts.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Intro</label>
                  <textarea
                    value={editingCallType.intro || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, intro: e.target.value })}
                    placeholder={
                    `• Greeting + introduction + reason for contact.\n• Set expectations (I'll ask a few questions).\n• Invite to continue.`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>Hello! This is [Name], [Company]'s AI assistant. I'm calling/answering because [reason]. If it's okay, I'll ask a couple of concise questions — shall we begin?</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Question list</label>
                  <textarea
                    value={editingCallType.questions || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, questions: e.target.value })}
                    placeholder={
`• Number 4–7 core questions.\n• Write each on its own line.\n• Add branches: If no/yes → do X.\n• Add: wait for answer between questions.`
                    }
                    rows={8}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>{`1) Did you attend [event]?\nwait for answer\nIf no → ask if they'd like a link or recording.\nwait for answer\n2) What got you interested in [topic]?\nwait for answer\n3) Where do you see the biggest challenge: [options]?\nwait for answer\n4) Would you like a specialist to contact you?\nwait for answer\nIf yes → ask for the best time and method (call/email).`}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Closing line</label>
                  <textarea
                    value={editingCallType.outro || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, outro: e.target.value })}
                    placeholder={
`• Thank them and ask if there's anything else.\n• Offer to send a summary/links by email.\n• Confirm the next steps.\n• End politely.`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>{`Thanks for the chat! Shall I send a short summary and links by email?\nwait for answer\nLet's agree on this: [next step]. Have a great day – goodbye!`}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Additional notes</label>
                  <textarea
                    value={editingCallType.notes || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, notes: e.target.value })}
                    placeholder={
`• What metadata should be recorded (time, method, consent, email, preferences).\n• Special flags/labels (urgent, feedback, escalation).`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>Record: preferred contact time, method, email, request for webinar link/recording, short summary of challenges/goals.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">First text message (SMS)</label>
                  <textarea
                    value={editingCallType.first_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      // Rajoita 160 merkkiin
                      if (value.length <= 160) {
                        setEditingCallType({ ...editingCallType, first_sms: value })
                      }
                    }}
                    placeholder="SMS message sent to the customer before the call... (max 160 characters)"
                    rows={4}
                    maxLength={160}
                    className="form-textarea"
                    style={{ 
                      resize: 'none',
                      overflowY: 'auto',
                      maxHeight: '120px'
                    }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginTop: 4,
                    fontSize: 12 
                  }}>
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


            </div>
          )}

          {currentStep === 4 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Summary (analytics)</label>
                  <textarea
                    value={editingCallType.summary || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, summary: e.target.value })}
                    placeholder={
`• 2–3 sentence summary in Finnish.\n• Describe what was learned + agreed next steps.`
                    }
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>Summarize in 2–3 sentences: did [event] participate, key interests/challenges, agreed next steps (call time/method).</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Success assessment (analytics)</label>
                  <textarea
                    value={editingCallType.success_assessment || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, success_assessment: e.target.value })}
                    placeholder={
`• Assess in 2–3 sentences, did the goals of the Goals section meet.\n• Describe why it succeeded/did not succeed and mention missing points.`
                    }
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini example</div>
                  <div>Assess, did it achieve: 1) information intake, 2) interests/challenges, 3) follow-up, 4) contact method/time. Briefly justify.</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                Previous
              </Button>
            )}
          </div>
          
          <div className="modal-actions-right">
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
              >
                {t('common.next')}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
              >
                Save changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditCallTypeModal 