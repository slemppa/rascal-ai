import React from 'react'

export default function CampaignStatusBadge({ status }) {
  const config = {
    active: { label: 'Aktiivinen', bg: '#EEF2FF', color: '#111827', border: '#E5E7EB' },
    paused: { label: 'Keskeytetty', bg: '#F3F4F6', color: '#111827', border: '#E5E7EB' },
    completed: { label: 'Valmis', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
    archived: { label: 'Arkistoitu', bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' }
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


