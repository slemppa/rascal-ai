import React from 'react'
import { useTranslation } from 'react-i18next'

export default function CampaignStatusBadge({ status }) {
  const { t } = useTranslation('common')
  const labelMap = {
    active: t('campaigns.status.active'),
    paused: t('campaigns.status.paused'),
    completed: t('campaigns.status.completed'),
    archived: t('campaigns.status.archived')
  }
  const config = {
    active: { label: labelMap.active, bg: '#EEF2FF', color: '#111827', border: '#E5E7EB' },
    paused: { label: labelMap.paused, bg: '#F3F4F6', color: '#111827', border: '#E5E7EB' },
    completed: { label: labelMap.completed, bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
    archived: { label: labelMap.archived, bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' }
  }[status || 'active']

  return (
    <span style={{
      display: 'inline-block',
      borderRadius: 999,
      padding: '4px 10px',
      fontSize: 12,
      border: `1px solid ${config.border}`,
      background: config.bg,
      color: config.color
    }}>{config.label}</span>
  )
}


