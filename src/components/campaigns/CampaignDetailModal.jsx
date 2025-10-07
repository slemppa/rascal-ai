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
        if (mounted) setError(err.message || 'Virhe haussa')
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
                      setPauseError(e.message || 'Keskeytys epäonnistui')
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
                  {pausing ? 'Keskeytetään…' : campaign.status === 'paused' ? 'Keskeytetty' : 'Keskeytä kampanja'}
                </button>
                {pauseError && <div style={{ color: '#dc2626', alignSelf: 'center' }}>{pauseError}</div>}
              </div>
              <CampaignStats campaignId={campaign.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


