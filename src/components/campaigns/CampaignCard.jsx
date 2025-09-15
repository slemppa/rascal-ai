import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CampaignDetailModal from './CampaignDetailModal'

export default function CampaignCard({ campaign }) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const totalCalls = campaign.total_calls || 0
  const answeredCalls = campaign.answered_calls || 0
  const successfulCalls = campaign.successful_calls || 0
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0
  

  const statusLabelMap = {
    active: t('campaigns.status.active'),
    paused: t('campaigns.status.paused'),
    completed: t('campaigns.status.completed'),
    archived: t('campaigns.status.archived')
  }

  const status = campaign.status || 'active'
  const statusLabel = statusLabelMap[status] || status

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 14 }}>
            <div>
              <div style={{ color: '#6b7280' }}>{t('campaigns.card.calls')}</div>
              <div style={{ fontWeight: 600 }}>{totalCalls}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280' }}>{t('campaigns.card.answerRateShort')}</div>
              <div style={{ fontWeight: 600 }}>{answerRate}%</div>
            </div>
            <div>
              <div style={{ color: '#6b7280' }}>{t('campaigns.card.successful')}</div>
              <div style={{ fontWeight: 600 }}>{successfulCalls}</div>
            </div>
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


