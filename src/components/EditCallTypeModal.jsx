import React, { useState, useEffect } from 'react'
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
                  <label className="form-label">Agent Name</label>
                  <input
                    type="text"
                    value={editingCallType.agent_name || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, agent_name: e.target.value })}
                    placeholder="Sarah from Sales"
                    className="form-input"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Example</div>
                  <div style={{ lineHeight: 1.6 }}>"Emma from Customer Success" or "Alex - Technical Support"</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <input
                    type="text"
                    value={editingCallType.target_audience || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, target_audience: e.target.value })}
                    placeholder="B2B decision makers, CFOs at mid-size companies"
                    className="form-input"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Example</div>
                  <div style={{ lineHeight: 1.6 }}>Be specific: "HR managers at 50-500 employee companies" instead of just "HR managers"</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Agent Persona / Role</label>
                  <textarea
                    value={editingCallType.identity || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, identity: e.target.value })}
                    placeholder="You are Sarah, a friendly sales consultant at TechCorp. You help business owners streamline their operations with our software solutions."
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Example</div>
                  <div style={{ lineHeight: 1.6 }}>"You are Emma, a customer success specialist at CloudCo. You help clients maximize their ROI by identifying optimization opportunities and providing actionable recommendations."</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Tone & Speaking Style</label>
                  <textarea
                    value={editingCallType.style || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, style: e.target.value })}
                    placeholder="Professional yet warm. Use clear, jargon-free language. Keep sentences short and pause naturally for responses."
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Example</div>
                  <div style={{ lineHeight: 1.6 }}>"Conversational and consultative. Mirror the prospect's energy level. Use 'we' language to build partnership. Avoid technical terms unless the prospect uses them first."</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Call Objective / Goals</label>
                  <textarea
                    value={editingCallType.goals || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, goals: e.target.value })}
                    placeholder="1. Qualify budget and timeline&#10;2. Identify key pain points&#10;3. Determine decision-making process&#10;4. Book demo with qualified leads"
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Example</div>
                  <div style={{ lineHeight: 1.6 }}>"1. Confirm current solution & satisfaction level<br/>2. Identify 2-3 specific challenges<br/>3. Gauge interest in ROI calculator<br/>4. Schedule next touchpoint"</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Guidelines & Rules</label>
                  <textarea
                    value={editingCallType.guidelines || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, guidelines: e.target.value })}
                    placeholder="Always confirm understanding before moving on. If prospect asks off-topic questions, acknowledge briefly and redirect. Never interrupt; let them finish speaking completely."
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Example</div>
                  <div style={{ lineHeight: 1.6 }}>"Ask permission before diving into questions. If they're busy, offer to reschedule immediately. Surface objections gently with 'It sounds like...' framing. Always end with a clear next step."</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Greeting</label>
                  <input
                    type="text"
                    value={editingCallType.first_line || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, first_line: e.target.value })}
                    className="form-input"
                    placeholder="Hi, this is Sarah from TechCorp!"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Example</div>
                  <div style={{ lineHeight: 1.6 }}>"Good morning! This is Alex calling from CloudCo." - Keep it natural and friendly.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Purpose Introduction / Reason for Call</label>
                  <textarea
                    value={editingCallType.intro || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, intro: e.target.value })}
                    placeholder="I'm reaching out because you recently downloaded our pricing guide. I wanted to see if you had any questions and share how we've helped similar companies reduce costs by 30%."
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Example</div>
                  <div style={{ lineHeight: 1.6 }}>"I noticed you attended our webinar last week. I'm following up to see what resonated with you and answer any questions. Is now a good time for a quick chat, maybe 5-7 minutes?"</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Product/Service Questions List</label>
                  <textarea
                    value={editingCallType.questions || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, questions: e.target.value })}
                    placeholder="1. What's your current process for [specific task]?&#10;   [wait for answer]&#10;2. What challenges are you facing with that approach?&#10;   [wait for answer]&#10;3. If you could wave a magic wand, what would the ideal solution look like?&#10;   [wait for answer]"
                    rows={8}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Example</div>
                  <div style={{ lineHeight: 1.6 }}>{`1. How are you currently handling customer onboarding?\n   [wait for answer]\n   → If manual: How much time does that take per week?\n2. What's the biggest bottleneck in that process?\n   [wait for answer]\n3. Have you explored automation tools before?\n   [wait for answer]\n   → If yes: What didn't work about them?`}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Call Closing / Goodbye</label>
                  <textarea
                    value={editingCallType.outro || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, outro: e.target.value })}
                    placeholder="This has been really helpful! Based on what you shared, I think a personalized demo would be valuable. I'll send you a calendar link - does Tuesday or Thursday work better for you?"
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Example</div>
                  <div style={{ lineHeight: 1.6 }}>"Thanks for your time! I'll email you those resources we discussed plus our ROI calculator. Any final questions before I let you go? Perfect - talk soon!"</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Agent Notes / Special Instructions</label>
                  <textarea
                    value={editingCallType.notes || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, notes: e.target.value })}
                    placeholder="Record: Preferred contact time, current solution name, budget range mentioned, decision timeline, competitor mentions, specific pain points, and any follow-up commitments made."
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>💡 Example</div>
                  <div style={{ lineHeight: 1.6 }}>"Flag as 'Hot Lead' if budget confirmed + decision timeline under 60 days. Tag with primary use case. Note any technical requirements or integration needs mentioned."</div>
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