import React from 'react'

export default function StatsCard({ title, value, icon, description }) {
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 16,
      background: '#fff',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#6b7280' }}>{title}</div>
        <div style={{ fontSize: 20 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      {description && (
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{description}</div>
      )}
    </div>
  )
}


