import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CampaignDetailModal from './CampaignDetailModal'
// Ei tehdä suoria Supabase-hakuja tässä – käytetään backendin rikastamia arvoja
import { pauseCampaign, fetchCampaignById, deleteCampaign } from '../../services/campaignsApi'

export default function CampaignCard({ campaign, onStatusChange, onDelete }) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [pauseError, setPauseError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const totalCalls = campaign.total_calls || 0
  const answeredCalls = campaign.answered_calls || 0
  const successfulCalls = campaign.successful_calls || 0
  const calledCalls = campaign.called_calls || 0
  const attemptCount = campaign.attempt_count || 0 // Soittoyritykset
  // Vastausprosentti = vastatut / soittoyritykset (sama logiikka kuin Puhelulokit-sivulla)
  const answerRate = attemptCount > 0 ? Math.round((answeredCalls / attemptCount) * 100) : 0
  // Jäljellä = vain aktiiviset (pending + in progress), ei paused
  const remainingCalls = (campaign.pending_calls || 0) + (campaign.in_progress_calls || 0)
  
  // Debug: tarkista mitä kortti näyttää
  if (campaign.id === '88f7e74a-2f4d-429f-984a-e7b447a7277b') {
    console.log('=== CAMPAIGN CARD DEBUG ===', {
      campaignId: campaign.id,
      campaignName: campaign.name,
      attempt_count: campaign.attempt_count,
      called_calls: campaign.called_calls,
      successful_calls: campaign.successful_calls,
      fullCampaign: campaign
    })
  }
  

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, fontSize: 14 }}>
            <div>
              <div style={{ color: '#6b7280' }}>{t('campaigns.card.callAttempts')}</div>
              <div style={{ fontWeight: 600 }}>{attemptCount}</div>
            </div>
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
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
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
                  setPauseError(e.message || t('campaigns.card.pauseError'))
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
              {pausing ? t('campaigns.card.pausing') : status === 'paused' ? t('campaigns.card.pausedButton') : t('campaigns.card.pauseButton')}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                fontWeight: 700,
                cursor: deleting ? 'not-allowed' : 'pointer'
              }}
            >
              {deleting ? t('campaigns.card.deleting') : t('campaigns.card.deleteButton')}
            </button>
            {pauseError && <div style={{ color: '#dc2626', alignSelf: 'center' }}>{pauseError}</div>}
            {deleteError && <div style={{ color: '#dc2626', alignSelf: 'center' }}>{deleteError}</div>}
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: 14 }}>{t('campaigns.card.remaining')}</div>
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
      {showDeleteConfirm && (
        <div className="modal-overlay modal-overlay--light" role="dialog" aria-modal="true" onClick={(e) => {
          if (e.target === e.currentTarget) setShowDeleteConfirm(false)
        }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('campaigns.card.deleteConfirmTitle')}</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteConfirm(false)} type="button">×</button>
            </div>
            <div className="modal-content">
              <p style={{ marginBottom: 16 }}>{t('campaigns.card.deleteConfirmMessage', { name: campaign.name })}</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  style={{
                    background: '#e5e7eb',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: deleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {t('campaigns.card.cancelButton')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setDeleting(true)
                      setDeleteError('')
                      await deleteCampaign(campaign.id)
                      setShowDeleteConfirm(false)
                      onDelete && onDelete(campaign.id)
                    } catch (e) {
                      setDeleteError(e.message || t('campaigns.card.deleteError'))
                    } finally {
                      setDeleting(false)
                    }
                  }}
                  disabled={deleting}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: deleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {deleting ? t('campaigns.card.deleting') : t('campaigns.card.deleteButton')}
                </button>
              </div>
              {deleteError && (
                <div style={{ marginTop: 12, padding: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: 8 }}>
                  {deleteError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}


