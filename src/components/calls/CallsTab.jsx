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
  handleSaveInboundSettings,
  openEditInboundModal,
  openCallsKnowledgeModal
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

      {/* Inbound-asetukset */}
      <div className="card">
        <h2 className="section-title">{t('calls.callsTab.inbound.header')}</h2>
        <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 15 }}>
          Määritä inbound-puheluille ääni, tervetuloviesti ja skripti
        </p>
        <Button
          onClick={() => openEditInboundModal({
            voice: inboundVoice,
            welcomeMessage: inboundWelcomeMessage,
            script: inboundScript
          })}
          variant="primary"
          style={{ width: '100%', padding: '16px 24px', fontSize: 16, fontWeight: 600 }}
        >
          Muokkaa inbound-asetuksia
        </Button>
      </div>

      {/* Tietokanta */}
      <div className="card">
        <h2 className="section-title">Tietokanta</h2>
        <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 15 }}>
          Hallitse tietokantaa (tiedostot ja sisältö), jota käytetään puheluissa.
        </p>
        <Button
          onClick={openCallsKnowledgeModal}
          variant="primary"
          style={{ width: '100%', padding: '16px 24px', fontSize: 16, fontWeight: 600 }}
        >
          Avaa tietokanta
        </Button>
      </div>
    </div>
  )
}


