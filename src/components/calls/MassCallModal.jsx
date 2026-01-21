import React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import Button from '../Button'

export default function MassCallModal({
  open,
  onClose,
  // Step state
  massCallStep,
  setMassCallStep,
  // Step 1 - Sheet validation
  massCallSheetUrl,
  setMassCallSheetUrl,
  massCallValidating,
  massCallValidationResult,
  massCallError,
  handleMassCallValidate,
  // Step 2 - Settings
  massCallCallType,
  setMassCallCallType,
  massCallSelectedVoice,
  setMassCallSelectedVoice,
  massCallSmsFirst,
  setMassCallSmsFirst,
  massCallSmsAfterCall,
  setMassCallSmsAfterCall,
  massCallSmsMissedCall,
  setMassCallSmsMissedCall,
  massCallCampaignId,
  setMassCallCampaignId,
  massCallCampaigns,
  callTypes,
  getVoiceOptions,
  // Step 3 - Schedule/Start
  massCallScheduledDate,
  setMassCallScheduledDate,
  massCallScheduledTime,
  setMassCallScheduledTime,
  massCallStarting,
  massCallScheduling,
  handleMassCallStart,
  handleMassCallSchedule
}) {
  const { t } = useTranslation('common')

  if (!open) return null

  return createPortal(
    <div
      onClick={onClose}
      className="modal-overlay modal-overlay--dark"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-container modal-container--create mass-call-modal"
      >
        <div className="modal-header">
          <h2 className="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <path d="M4.5 16.5c-1.5 1.5-1.5 4 0 5.5s4 1.5 5.5 0L12 20l2-2M20 6l-8.5 8.5a2.83 2.83 0 0 1-4 0 2.83 2.83 0 0 1 0-4L16 2"/>
            </svg>
            {t('calls.modals.mass.title')}
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            type="button"
            aria-label={t('calls.common.close')}
            title={t('calls.common.close')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {/* Step 1: Google Sheets validation */}
          {massCallStep === 1 && (
            <Step1SheetValidation
              t={t}
              massCallSheetUrl={massCallSheetUrl}
              setMassCallSheetUrl={setMassCallSheetUrl}
              massCallError={massCallError}
              massCallValidating={massCallValidating}
              handleMassCallValidate={handleMassCallValidate}
              onClose={onClose}
            />
          )}

          {/* Step 2: Call type and voice */}
          {massCallStep === 2 && (
            <Step2Settings
              t={t}
              massCallCampaignId={massCallCampaignId}
              setMassCallCampaignId={setMassCallCampaignId}
              massCallCampaigns={massCallCampaigns}
              massCallCallType={massCallCallType}
              setMassCallCallType={setMassCallCallType}
              callTypes={callTypes}
              massCallSelectedVoice={massCallSelectedVoice}
              setMassCallSelectedVoice={setMassCallSelectedVoice}
              getVoiceOptions={getVoiceOptions}
              massCallSmsFirst={massCallSmsFirst}
              setMassCallSmsFirst={setMassCallSmsFirst}
              massCallSmsAfterCall={massCallSmsAfterCall}
              setMassCallSmsAfterCall={setMassCallSmsAfterCall}
              massCallSmsMissedCall={massCallSmsMissedCall}
              setMassCallSmsMissedCall={setMassCallSmsMissedCall}
              massCallValidationResult={massCallValidationResult}
              setMassCallStep={setMassCallStep}
            />
          )}

          {/* Step 3: Schedule or start */}
          {massCallStep === 3 && (
            <Step3Schedule
              t={t}
              massCallStarting={massCallStarting}
              handleMassCallStart={handleMassCallStart}
              massCallScheduledDate={massCallScheduledDate}
              setMassCallScheduledDate={setMassCallScheduledDate}
              massCallScheduledTime={massCallScheduledTime}
              setMassCallScheduledTime={setMassCallScheduledTime}
              massCallScheduling={massCallScheduling}
              handleMassCallSchedule={handleMassCallSchedule}
              setMassCallStep={setMassCallStep}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function Step1SheetValidation({
  t,
  massCallSheetUrl,
  setMassCallSheetUrl,
  massCallError,
  massCallValidating,
  handleMassCallValidate,
  onClose
}) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937', backgroundColor: 'transparent' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
          {t('calls.modals.mass.step1.title')}
        </h3>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
          {t('calls.modals.mass.step1.desc')}
        </p>
      </div>

      <label className="label">{t('calls.modals.mass.step1.labelUrl')}</label>
      <input
        type="url"
        value={massCallSheetUrl}
        onChange={e => setMassCallSheetUrl(e.target.value)}
        placeholder={t('calls.modals.mass.step1.placeholderUrl')}
        className="input"
        style={{ width: '100%', marginBottom: 16 }}
      />

      {massCallError && (
        <div className="status-error" style={{ marginBottom: 16 }}>
          {massCallError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} variant="secondary">
          {t('calls.common.cancel')}
        </Button>
        <Button
          onClick={handleMassCallValidate}
          disabled={massCallValidating || !massCallSheetUrl}
          variant="primary"
        >
          {massCallValidating ? t('calls.modals.mass.step1.validating') : t('calls.modals.mass.step1.validate')}
        </Button>
      </div>
    </div>
  )
}

function Step2Settings({
  t,
  massCallCampaignId,
  setMassCallCampaignId,
  massCallCampaigns,
  massCallCallType,
  setMassCallCallType,
  callTypes,
  massCallSelectedVoice,
  setMassCallSelectedVoice,
  getVoiceOptions,
  massCallSmsFirst,
  setMassCallSmsFirst,
  massCallSmsAfterCall,
  setMassCallSmsAfterCall,
  massCallSmsMissedCall,
  setMassCallSmsMissedCall,
  massCallValidationResult,
  setMassCallStep
}) {
  const selectedCallType = callTypes.find(t => t.value === massCallCallType)

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937', backgroundColor: 'transparent' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          {t('calls.modals.mass.step2.title')}
        </h3>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
          {t('calls.modals.mass.step2.desc')}
        </p>

        <div style={{ display: 'grid', gap: 16, marginTop: 8 }}>
          {/* Campaign and Call type row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="label">{t('calls.modals.mass.step2.campaign.label')}</label>
              <select value={massCallCampaignId} onChange={e => setMassCallCampaignId(e.target.value)} className="select">
                <option value="">{t('calls.modals.mass.step2.campaign.select')}</option>
                {massCallCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('calls.modals.mass.step2.type.label')}</label>
              <select
                value={massCallCallType}
                onChange={e => setMassCallCallType(e.target.value)}
                className="select"
              >
                {callTypes.map(type => (
                  <option key={type.id} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Voice and SMS toggles row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="label">{t('calls.modals.mass.step2.voice.label')}</label>
              <select
                value={massCallSelectedVoice}
                onChange={e => setMassCallSelectedVoice(e.target.value)}
                className="select"
              >
                {getVoiceOptions().map(voice => (
                  <option key={voice.value} value={voice.value}>{voice.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{t('calls.modals.mass.step2.sms.title')}</label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontWeight: 500, fontSize: 13, minWidth: 120 }}>{t('calls.modals.mass.step2.sms.before')}</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={massCallSmsFirst}
                    onChange={e => setMassCallSmsFirst(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontWeight: 500, fontSize: 13, minWidth: 120 }}>{t('calls.modals.mass.step2.sms.after')}</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={massCallSmsAfterCall}
                    onChange={e => setMassCallSmsAfterCall(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontWeight: 500, fontSize: 13, minWidth: 120 }}>{t('calls.modals.mass.step2.sms.missed')}</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={massCallSmsMissedCall}
                    onChange={e => setMassCallSmsMissedCall(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          {/* SMS preview */}
          {(massCallSmsFirst || massCallSmsAfterCall || massCallSmsMissedCall) && selectedCallType && (
            <div className="sms-preview-container">
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{t('calls.modals.mass.step2.sms.preview')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {massCallSmsFirst && selectedCallType.first_sms && (
                  <div style={{ padding: 8, background: '#f3f4f6', borderRadius: 6, fontSize: 12 }}>
                    <strong>{t('calls.modals.mass.step2.sms.before')}:</strong> {selectedCallType.first_sms}
                  </div>
                )}
                {massCallSmsAfterCall && selectedCallType.after_call_sms && (
                  <div style={{ padding: 8, background: '#f3f4f6', borderRadius: 6, fontSize: 12 }}>
                    <strong>{t('calls.modals.mass.step2.sms.after')}:</strong> {selectedCallType.after_call_sms}
                  </div>
                )}
                {massCallSmsMissedCall && selectedCallType.missed_call_sms && (
                  <div style={{ padding: 8, background: '#f3f4f6', borderRadius: 6, fontSize: 12 }}>
                    <strong>{t('calls.modals.mass.step2.sms.missed')}:</strong> {selectedCallType.missed_call_sms}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {massCallValidationResult && (
          <div className="status-success" style={{ marginTop: 8, marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>{t('calls.modals.mass.step1.validationOk')}</div>
            <div><strong>{t('calls.modals.mass.step1.found.phones', { count: massCallValidationResult.phoneCount })}</strong></div>
            {massCallValidationResult.emailCount > 0 && (
              <div><strong>{t('calls.modals.mass.step1.found.emails', { count: massCallValidationResult.emailCount })}</strong></div>
            )}
            {massCallValidationResult.totalRows > 0 && (
              <div>{t('calls.modals.mass.step1.found.rows', { count: massCallValidationResult.totalRows })}</div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
        <Button onClick={() => setMassCallStep(1)} variant="secondary">
          {t('calls.modals.mass.step2.back')}
        </Button>
        <Button
          onClick={() => setMassCallStep(3)}
          disabled={!massCallCallType || !massCallSelectedVoice}
          variant="primary"
        >
          {t('calls.modals.mass.step2.next')}
        </Button>
      </div>
    </div>
  )
}

function Step3Schedule({
  t,
  massCallStarting,
  handleMassCallStart,
  massCallScheduledDate,
  setMassCallScheduledDate,
  massCallScheduledTime,
  setMassCallScheduledTime,
  massCallScheduling,
  handleMassCallSchedule,
  setMassCallStep
}) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937', backgroundColor: 'transparent' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          {t('calls.modals.mass.step3.title')}
        </h3>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
          {t('calls.modals.mass.step3.desc')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Button
          onClick={handleMassCallStart}
          disabled={massCallStarting}
          variant="primary"
          style={{ flex: 1, padding: '16px 24px', fontSize: 16, fontWeight: 600 }}
        >
          {massCallStarting ? t('calls.modals.mass.step3.startNow.starting') : t('calls.modals.mass.step3.startNow.label')}
        </Button>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, marginTop: 20 }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
          {t('calls.modals.mass.step3.orSchedule')}
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label className="label">{t('calls.modals.mass.step3.date')}</label>
            <input
              type="date"
              value={massCallScheduledDate}
              onChange={e => setMassCallScheduledDate(e.target.value)}
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="label">{t('calls.modals.mass.step3.time')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="select"
                value={(massCallScheduledTime || '').split(':')[0] || ''}
                onChange={e => {
                  const hour = String(e.target.value || '').padStart(2, '0')
                  const minute = (massCallScheduledTime || '').split(':')[1] || '00'
                  const mm = parseInt(minute, 10) >= 30 ? '30' : '00'
                  setMassCallScheduledTime(hour ? `${hour}:${mm}` : '')
                }}
                style={{ flex: 1 }}
              >
                <option value="">--</option>
                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(hh => (
                  <option key={hh} value={hh}>{hh}</option>
                ))}
              </select>
              <select
                className="select"
                value={(massCallScheduledTime || '').split(':')[1] || ''}
                onChange={e => {
                  const minute = e.target.value === '30' ? '30' : '00'
                  const hour = (massCallScheduledTime || '').split(':')[0] || ''
                  setMassCallScheduledTime(hour ? `${String(hour).padStart(2, '0')}:${minute}` : '')
                }}
                style={{ width: 100 }}
              >
                <option value="">--</option>
                <option value="00">00</option>
                <option value="30">30</option>
              </select>
            </div>
          </div>
        </div>

        <Button
          onClick={handleMassCallSchedule}
          disabled={massCallScheduling || !massCallScheduledDate || !massCallScheduledTime}
          variant="secondary"
          style={{ width: '100%', padding: '12px 24px' }}
        >
          {massCallScheduling ? t('calls.modals.mass.step3.schedule.scheduling') : t('calls.modals.mass.step3.schedule.label')}
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', marginTop: 20 }}>
        <Button onClick={() => setMassCallStep(2)} variant="secondary">
          {t('calls.modals.mass.step3.back')}
        </Button>
      </div>
    </div>
  )
}
