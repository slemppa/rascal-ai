import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import CampaignDetailModal from './CampaignDetailModal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function CampaignCard({ campaign }) {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [callLogStats, setCallLogStats] = useState({ totalCallLogs: 0, calledCalls: 0 })
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

  // Hae call_logs tilastot kampanjalle
  useEffect(() => {
    async function fetchCallLogStats() {
      if (!user?.id || !campaign.id) return

      try {
        // Hae käyttäjän users-taulun id
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (userError || !userProfile) return

        // Hae call_logs kampanjalle
        const { data: callLogs, error: logsError } = await supabase
          .from('call_logs')
          .select('call_status')
          .eq('user_id', userProfile.id)
          .eq('new_campaign_id', campaign.id)

        if (!logsError && callLogs) {
          const totalCallLogs = callLogs.length
          const calledCalls = callLogs.filter(log => 
            log.call_status !== 'pending' && log.call_status !== 'in progress'
          ).length

          setCallLogStats({ totalCallLogs, calledCalls })
        }
      } catch (error) {
        console.error('Error fetching call log stats for campaign:', error)
      }
    }

    fetchCallLogStats()
  }, [user?.id, campaign.id])

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
              <div style={{ fontWeight: 600 }}>{callLogStats.calledCalls}</div>
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
              <div style={{ fontWeight: 600 }}>{callLogStats.totalCallLogs}</div>
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


