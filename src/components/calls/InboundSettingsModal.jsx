import React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import Button from '../Button'

export default function InboundSettingsModal({
  open,
  onClose,
  inboundVoice,
  setInboundVoice,
  inboundWelcomeMessage,
  setInboundWelcomeMessage,
  inboundScript,
  setInboundScript,
  handleSaveInboundSettings,
  getVoiceOptions,
  playVoiceSample
}) {
  const { t } = useTranslation('common')

  if (!open) return null

  const handleBackdropClick = async (e) => {
    if (e.target === e.currentTarget) {
      await handleSaveInboundSettings()
      onClose()
    }
  }

  const handleSave = async () => {
    await handleSaveInboundSettings()
    onClose()
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 800,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
            {t('calls.modals.inbound.title')}
          </h2>
          <Button
            variant="secondary"
            onClick={onClose}
            style={{ width: 'auto', padding: '8px 16px' }}
          >
            {t('calls.modals.inbound.close')}
          </Button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="label">{t('calls.modals.inbound.voiceLabel')}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <select
              value={inboundVoice}
              onChange={e => setInboundVoice(e.target.value)}
              className="select"
              style={{ flex: 1 }}
            >
              {getVoiceOptions().map(voice => (
                <option key={voice.value} value={voice.value}>{voice.label}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() => playVoiceSample(inboundVoice)}
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              {t('calls.modals.inbound.testVoice')}
            </Button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="label">{t('calls.modals.inbound.welcomeMessageLabel')}</label>
          <textarea
            value={inboundWelcomeMessage}
            onChange={e => setInboundWelcomeMessage(e.target.value)}
            placeholder={t('calls.modals.inbound.welcomeMessagePlaceholder')}
            rows={5}
            className="textarea"
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: 14,
              lineHeight: 1.5
            }}
          />
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            {t('calls.modals.inbound.welcomeMessageHint')}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="label">{t('calls.modals.inbound.scriptLabel')}</label>
          <textarea
            value={inboundScript}
            onChange={e => setInboundScript(e.target.value)}
            placeholder={t('calls.modals.inbound.scriptPlaceholder')}
            rows={15}
            className="textarea"
            style={{
              width: '100%',
              minHeight: 300,
              fontFamily: 'monospace',
              fontSize: 14,
              lineHeight: 1.5
            }}
          />
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            {t('calls.modals.inbound.scriptHint')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
          >
            {t('calls.modals.inbound.save')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
