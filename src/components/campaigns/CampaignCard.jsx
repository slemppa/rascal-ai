import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CampaignDetailModal from './CampaignDetailModal'
// Ei tehdä suoria Supabase-hakuja tässä – käytetään backendin rikastamia arvoja
import { pauseCampaign, fetchCampaignById } from '../../services/campaignsApi'

export default function CampaignCard({ campaign, onStatusChange }) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [pauseError, setPauseError] = useState('')
  const totalCalls = campaign.total_calls || 0
  const answeredCalls = campaign.answered_calls || 0
  const successfulCalls = campaign.successful_calls || 0
  const calledCalls = campaign.called_calls || 0
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0
  // Jäljellä = vain aktiiviset (pending + in progress), ei paused
  const remainingCalls = (campaign.pending_calls || 0) + (campaign.in_progress_calls || 0)
  

  const statusLabelMap = {
    active: t('campaigns.status.active'),
    paused: t('campaigns.status.paused'),
    completed: t('campaigns.status.completed'),
    archived: t('campaigns.status.archived')
  }

  const status = campaign.status || 'active'
  const statusLabel = statusLabelMap[status] || status

  // Kortti näyttää arvot suoraan backendin rikastamasta kampanjaobjektista

  return (
    <>
      <div onClick={() => setOpen(true)} style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s ease',
        cursor: 'pointer'
      }}>
        <div style={{ padding: 16, paddingBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{campaign.name}</div>
            <span style={{
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 12,
              border: '1px solid #e5e7eb',
              background: status === 'active' ? '#EEF2FF' : '#F3F4F6',
              color: '#374151'
            }}>{statusLabel}</span>
          </div>
          {campaign.description && (
            <div style={{ marginTop: 6, color: '#6b7280', fontSize: 14 }}>{campaign.description}</div>
          )}
        </div>
        <div style={{ padding: 16, borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, fontSize: 14 }}>
            <div>
              <div style={{ color: '#6b7280' }}>{t('campaigns.stats.calledCalls')}</div>
              <div style={{ fontWeight: 600 }}>{calledCalls}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280' }}>{t('campaigns.card.successful')}</div>
              <div style={{ fontWeight: 600 }}>{successfulCalls}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280' }}>{t('campaigns.card.answerRateShort')}</div>
              <div style={{ fontWeight: 600 }}>{answerRate}%</div>
            </div>
            <div>
              <div style={{ color: '#6b7280' }}>{t('campaigns.stats.totalCallLogs')}</div>
              <div style={{ fontWeight: 600 }}>{totalCalls}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={async () => {
                try {
                  setPausing(true)
                  setPauseError('')
                  await pauseCampaign(campaign.id)
                  // Päivitä status paikallisesti ja ilmoita vanhemmalle
                  const fresh = await fetchCampaignById(campaign.id)
                  onStatusChange && onStatusChange(fresh)
                } catch (e) {
                  setPauseError(e.message || 'Keskeytys epäonnistui')
                } finally {
                  setPausing(false)
                }
              }}
              disabled={pausing || status === 'paused'}
              style={{
                background: status === 'paused' ? '#e5e7eb' : '#f59e0b',
                color: status === 'paused' ? '#6b7280' : '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '8px 12px',
                fontWeight: 700,
                cursor: pausing || status === 'paused' ? 'not-allowed' : 'pointer'
              }}
            >
              {pausing ? 'Keskeytetään…' : status === 'paused' ? 'Keskeytetty' : 'Keskeytä kampanja'}
            </button>
            {pauseError && <div style={{ color: '#dc2626', alignSelf: 'center' }}>{pauseError}</div>}
          </div>
          {/* Jäljellä */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: 14 }}>Jäljellä</div>
            <div style={{ fontWeight: 700 }}>{remainingCalls} / {totalCalls}</div>
          </div>
          {campaign.call_types?.name && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{t('campaigns.card.script')}: {campaign.call_types.name}</div>
            </div>
          )}
        </div>
      </div>
      {open && (
        <CampaignDetailModal
          campaignId={campaign.id}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}


