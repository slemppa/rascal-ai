import React from 'react'
import Button from '../Button'
import { useTranslation } from 'react-i18next'

export default function CallsTab({
  openMassCallModal,
  openSingleCallModal,
  setActiveTab,
  callType,
  setCallType,
  loadingCallTypes,
  callTypes,
  updateScriptFromCallType,
  selectedVoice,
  setSelectedVoice,
  isPlaying,
  playVoiceSample,
  getVoiceOptions,
  script,
  setShowInboundModal,
  inboundVoice,
  setInboundVoice,
  inboundWelcomeMessage,
  setInboundWelcomeMessage,
  inboundScript,
  setInboundScript,
  handleSaveInboundSettings
}) {
  const { t } = useTranslation('common')

  return (
    <div className="callpanel-grid" style={{ width: '100%', maxWidth: 'none' }}>
      {/* Massapuhelut */}
      <div className="card">
        <h2 className="section-title">{t('calls.callsTab.mass.header')}</h2>
        <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 15 }}>
          {t('calls.callsTab.mass.description')}
        </p>
        <Button
          onClick={openMassCallModal}
          variant="primary"
          style={{ width: '100%', padding: '16px 24px', fontSize: 16, fontWeight: 600 }}
        >
          {t('calls.callsTab.mass.startButton')}
        </Button>
      </div>

      {/* Yksittäinen puhelu */}
      <div className="card">
        <h2 className="section-title">{t('calls.callsTab.single.header')}</h2>
        <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 15 }}>
          {t('calls.callsTab.single.description')}
        </p>
        <Button
          onClick={openSingleCallModal}
          variant="primary"
          style={{ width: '100%', padding: '16px 24px', fontSize: 16, fontWeight: 600 }}
        >
          {t('calls.callsTab.single.startButton')}
        </Button>
      </div>

      {/* Asetukset */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>{t('calls.callsTab.settings.header')}</h2>
          {callType && script && script.trim() && selectedVoice ? (
            <div style={{ background: '#e6fbe8', color: '#1a7f37', padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
              {t('calls.callsTab.settings.ready')}
            </div>
          ) : null}
        </div>
        <label className="label">{t('calls.callsTab.settings.type.label')}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <select value={callType} onChange={e => { setCallType(e.target.value); updateScriptFromCallType(e.target.value) }} disabled={loadingCallTypes} className="select">
            {loadingCallTypes ? (
              <option>{t('calls.callsTab.settings.type.loading')}</option>
            ) : callTypes.length === 0 ? (
              <option>{t('calls.callsTab.settings.type.empty')}</option>
            ) : (
              callTypes.map((type, idx) => (
                <option key={type.value || type.id || idx} value={type.value}>{type.label}</option>
              ))
            )}
          </select>
          <Button
            variant="secondary"
            onClick={() => setActiveTab('manage')}
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
          >
            {t('calls.callsTab.settings.type.addNew')}
          </Button>
        </div>
        <label className="label">{t('calls.callsTab.settings.voice.label')}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="select">
            {getVoiceOptions().map(voice => <option key={voice.value} value={voice.value}>{voice.label}</option>)}
          </select>
          <Button 
            variant="secondary"
            onClick={() => playVoiceSample(selectedVoice)}
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
          >
            {isPlaying ? t('calls.callsTab.settings.voice.stop') : t('calls.callsTab.settings.voice.test')}
          </Button>
        </div>
        <label className="label">{t('calls.callsTab.settings.script.label')}</label>
        <div className="textarea" style={{ minHeight: 90, background: '#f9fafb', color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: 200 }}>
          {script ? script : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{t('calls.callsTab.settings.script.placeholder')}</span>}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{t('calls.callsTab.settings.script.autoupdateHint')}</div>
      </div>

      {/* Inbound-asetukset */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title">{t('calls.callsTab.inbound.header')}</h2>
          <Button
            variant="secondary"
            onClick={() => setShowInboundModal(true)}
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
          >
            {t('calls.callsTab.inbound.editLarge')}
          </Button>
        </div>
        <label className="label">{t('calls.callsTab.inbound.voice.label')}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <select value={inboundVoice} onChange={e => setInboundVoice(e.target.value)} className="select">
            {getVoiceOptions().map(voice => <option key={voice.value} value={voice.value}>{voice.label}</option>)}
          </select>
          <Button 
            variant="secondary"
            onClick={() => playVoiceSample(inboundVoice)}
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
          >
            {t('calls.callsTab.inbound.voice.test')}
          </Button>
        </div>
        <label className="label">{t('calls.callsTab.inbound.welcome.label')}</label>
        <textarea value={inboundWelcomeMessage} onChange={e => setInboundWelcomeMessage(e.target.value)} placeholder={t('calls.callsTab.inbound.welcome.placeholder')} rows={3} className="textarea" />
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{t('calls.callsTab.inbound.welcome.hint')}</div>

        <label className="label">{t('calls.callsTab.inbound.script.label')}</label>
        <textarea value={inboundScript} onChange={e => setInboundScript(e.target.value)} placeholder={t('calls.callsTab.inbound.script.placeholder')} rows={5} className="textarea" />
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{t('calls.callsTab.inbound.script.hint')}</div>
        <Button onClick={handleSaveInboundSettings} variant="primary">
          {t('calls.callsTab.inbound.save')}
        </Button>
      </div>
    </div>
  )
}


