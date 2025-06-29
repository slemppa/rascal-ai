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

export default function CallStats({ status, stats, calls }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 600 }}>
        Soittojen tila
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
            {stats.totalCount}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Yhteensä</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
            {stats.calledCount}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Soitettu</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
            {stats.failedCount}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Epäonnistui</div>
    </div>
        
        <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>
            {stats.totalCount - stats.calledCount - stats.failedCount}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Jäljellä</div>
        </div>
      </div>
      
      {calls && calls.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
            Yksityiskohtaiset tiedot
          </h3>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {calls.map((call, index) => (
              <div key={index} style={{
      display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <StatusBadge tila={call.status} />
                  <span style={{ fontSize: 14 }}>{call.name || call.phone}</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {call.duration ? `${call.duration}s` : '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: 16, padding: '12px', background: '#f0f9ff', borderRadius: 8, fontSize: 14, color: '#0369a1' }}>
        <strong>Huomio:</strong> Soittojen laskutus perustuu onnistuneisiin puheluihin.
        <InfoIconWithTooltip />
      </div>
    </div>
  )
} 