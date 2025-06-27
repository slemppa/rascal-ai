import React, { useState } from 'react'

const STATUS_COLORS = {
  odottaa: '#a0aec0', // harmaa
  soittaa: '#2563eb', // sininen
  valmis: '#22c55e', // vihreä
}

function StatusBadge({ tila }) {
  const color = STATUS_COLORS[tila] || '#a0aec0'
  return (
    <span style={{
      display: 'inline-block',
      minWidth: 12,
      height: 12,
      borderRadius: 8,
      background: color,
      marginRight: 8,
      verticalAlign: 'middle',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
    }} />
  )
}

function InfoIconWithTooltip() {
  const [show, setShow] = useState(false)
  return (
    <span style={{position: 'relative', display: 'inline-block', marginLeft: 6}}>
      <span
        style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#e1e8ed',
          color: '#2563eb',
          fontWeight: 700,
          fontSize: 13,
          textAlign: 'center',
          lineHeight: '16px',
          cursor: 'pointer',
          border: '1.5px solid #cfd8dc',
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >i</span>
      {show && (
        <span style={{
          position: 'absolute',
          left: '110%',
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#fff',
          color: '#222',
          border: '1.5px solid #e1e8ed',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 14,
          fontWeight: 400,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          zIndex: 10,
        }}>
          Todellinen laskutus tarkistetaan aina kauden lopussa
        </span>
      )}
    </span>
  )
}

function UsageBar({ used, total }) {
  const percent = Math.min(100, Math.round((used / total) * 100))
  const bars = Math.round((percent / 100) * 10)
  return (
    <span style={{marginLeft: 10, fontFamily: 'monospace', fontSize: 18, letterSpacing: 1}}>
      {'|'.repeat(bars)}<span style={{color: '#e1e8ed'}}>{'|'.repeat(10 - bars)}</span>
    </span>
  )
}

function StatCard({ children, style }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e1e8ed',
      borderRadius: 12,
      padding: '1.5rem',
      textAlign: 'center',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      minWidth: 0,
      ...style
    }}>
      {children}
    </div>
  )
}

export default function CallStats({ stats }) {
  if (!stats) return null
  const tila = stats.status || 'odottaa'
  const arvioituHinta = stats.estimatedPrice || '–'

  return (
    <div className="stats-row" style={{
      display: 'flex',
      flexDirection: 'row',
      gap: '1.5rem',
      margin: '32px 0 2rem 32px',
      width: 'auto',
      justifyContent: 'flex-start',
      alignItems: 'stretch'
    }}>
      <StatCard style={{flex: '0 0 180px', width: 180, height: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <div className="stat-number" style={{fontSize: '2rem', fontWeight: 700, color: '#667eea', marginBottom: '0.5rem'}}>{stats.totalCount}</div>
        <div className="stat-label" style={{fontSize: '0.9rem', color: '#718096', fontWeight: 500}}>Yhteensä</div>
      </StatCard>
      <StatCard style={{flex: '0 0 180px', width: 180, height: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <div className="stat-number" style={{fontSize: '2rem', fontWeight: 700, color: '#667eea', marginBottom: '0.5rem'}}>{stats.calledCount}</div>
        <div className="stat-label" style={{fontSize: '0.9rem', color: '#718096', fontWeight: 500}}>Soitettu</div>
      </StatCard>
      <StatCard style={{flex: '0 0 180px', width: 180, height: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <div className="stat-number" style={{fontSize: '2rem', fontWeight: 700, color: '#667eea', marginBottom: '0.5rem'}}>{stats.failedCount}</div>
        <div className="stat-label" style={{fontSize: '0.9rem', color: '#718096', fontWeight: 500}}>Epäonnistunut</div>
      </StatCard>
      <StatCard style={{flex: '0 0 180px', width: 180, height: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <StatusBadge tila={tila} />
        <div className="stat-label" style={{fontSize: 16, fontWeight: 600, marginTop: 8}}>🔄 Soittotila</div>
        <div style={{fontSize: 15, color: '#888', marginTop: 4}}>{tila.charAt(0).toUpperCase() + tila.slice(1)}</div>
      </StatCard>
      <StatCard style={{flex: '0 0 180px', width: 180, height: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <div className="stat-number" style={{fontSize: '2rem', fontWeight: 700, color: '#667eea', marginBottom: '0.5rem'}}>{arvioituHinta} €</div>
        <div className="stat-label" style={{fontSize: '0.9rem', color: '#718096', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Arvioitu hinta <InfoIconWithTooltip /></div>
      </StatCard>
    </div>
  )
} 