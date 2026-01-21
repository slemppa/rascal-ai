import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchCampaignById } from '../../services/campaignsApi'
import { pauseCampaign } from '../../services/campaignsApi'
import CampaignStats from './CampaignStats'
import CampaignStatusBadge from './CampaignStatusBadge'
import '../ModalComponents.css'

export default function CampaignDetailModal({ campaignId, onClose }) {
  const { t } = useTranslation('common')
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pausing, setPausing] = useState(false)
  const [pauseError, setPauseError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await fetchCampaignById(campaignId)
        if (mounted) setCampaign(data)
      } catch (err) {
        if (mounted) setError(err.message || t('campaigns.details.fetchError'))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (campaignId) load()
    return () => { mounted = false }
  }, [campaignId])

  return (
    <div className="modal-overlay modal-overlay--light" role="dialog" aria-modal="true">
      <div className="modal-container" style={{ maxWidth: 900 }}>
        <div className="modal-header">
          <h2 className="modal-title">{t('campaigns.details.title')}</h2>
          <button className="modal-close-btn" onClick={onClose} type="button">×</button>
        </div>
        <div className="modal-content">
          {loading && <div>{t('campaigns.details.loading')}</div>}
          {error && <div style={{ color: '#dc2626' }}>{t('campaigns.details.error')}</div>}
          {!loading && !error && campaign && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{campaign.name}</h3>
                  {campaign.description && (
                    <p style={{ color: '#6b7280', marginTop: 6 }}>{campaign.description}</p>
                  )}
                </div>
                <CampaignStatusBadge status={campaign.status} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setPausing(true)
                      setPauseError('')
                      await pauseCampaign(campaign.id)
                      // Päivitä näkymä tuoreella datalla
                      const fresh = await fetchCampaignById(campaign.id)
                      setCampaign(fresh)
                    } catch (e) {
                      setPauseError(e.message || t('campaigns.details.pauseError'))
                    } finally {
                      setPausing(false)
                    }
                  }}
                  disabled={pausing || campaign.status === 'paused'}
                  style={{
                    background: campaign.status === 'paused' ? '#e5e7eb' : '#f59e0b',
                    color: campaign.status === 'paused' ? '#6b7280' : '#111827',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontWeight: 700,
                    cursor: pausing || campaign.status === 'paused' ? 'not-allowed' : 'pointer'
                  }}
                >
                  {pausing ? t('campaigns.details.pausing') : campaign.status === 'paused' ? t('campaigns.details.pausedButton') : t('campaigns.details.pauseButton')}
                </button>
                {pauseError && <div style={{ color: '#dc2626', alignSelf: 'center' }}>{pauseError}</div>}
              </div>
              
              {/* Tilastot - samalla tavalla kuin Puhelulokit-sivulla */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 24, 
                marginBottom: 16 
              }}>
                {/* Soittoyritykset - ensimmäinen kortti */}
                <div style={{ 
                  background: '#f8fafc', 
                  padding: 24, 
                  borderRadius: 12, 
                  border: '1px solid #e2e8f0' 
                }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#6366f1', marginBottom: 8 }}>
                    {campaign.attempt_count || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>{t('campaigns.details.stats.callAttempts')}</div>
                </div>
                
                <div style={{ 
                  background: '#f8fafc', 
                  padding: 24, 
                  borderRadius: 12, 
                  border: '1px solid #e2e8f0' 
                }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>
                    {campaign.answered_calls || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>{t('campaigns.details.stats.answeredCalls')}</div>
                </div>
                
                <div style={{ 
                  background: '#f8fafc', 
                  padding: 24, 
                  borderRadius: 12, 
                  border: '1px solid #e2e8f0' 
                }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
                    {campaign.successful_calls || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>{t('campaigns.details.stats.successfulCalls')}</div>
                </div>
                
                <div style={{ 
                  background: '#f8fafc', 
                  padding: 24, 
                  borderRadius: 12, 
                  border: '1px solid #e2e8f0' 
                }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
                    {campaign.failed_calls || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>{t('campaigns.details.stats.failedCalls')}</div>
                </div>
                
                <div style={{ 
                  background: '#f8fafc', 
                  padding: 24, 
                  borderRadius: 12, 
                  border: '1px solid #e2e8f0' 
                }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
                    {campaign.pending_calls || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>{t('campaigns.details.stats.scheduledCalls')}</div>
                </div>

                <div style={{ 
                  background: '#f8fafc', 
                  padding: 24, 
                  borderRadius: 12, 
                  border: '1px solid #e2e8f0' 
                }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6', marginBottom: 8 }}>
                    {campaign.in_progress_calls || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>{t('campaigns.details.stats.queuedCalls')}</div>
                </div>
                  
                <div style={{ 
                  background: '#f8fafc', 
                  padding: 24, 
                  borderRadius: 12, 
                  border: '1px solid #e2e8f0' 
                }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#6366f1', marginBottom: 8 }}>
                    {campaign.total_calls || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>{t('campaigns.details.stats.totalCalls')}</div>
                </div>
                
                <div style={{ 
                  background: '#f8fafc', 
                  padding: 24, 
                  borderRadius: 12, 
                  border: '1px solid #e2e8f0' 
                }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>
                    {campaign.called_calls || 0}
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>{t('campaigns.details.stats.calledCalls')}</div>
                </div>
              </div>
              
              <CampaignStats campaignId={campaign.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


