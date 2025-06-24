import React from 'react'
import { useNavigate } from 'react-router-dom'

const placeholderImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80',
]

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <div style={{minHeight: '100vh', minWidth: '100vw', background: 'var(--brand-dark)', display: 'flex', flexDirection: 'column'}}>
      {/* Ylänavigaatio */}
      <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 6vw 0 6vw'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          {/* Logo tai pelkkä nimi */}
          <div style={{width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, color: 'var(--brand-black)'}}>R</div>
          <span style={{color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: 1}}>Rascal AI</span>
        </div>
        <button onClick={() => navigate('/login')} style={{padding: '12px 32px', fontSize: 18, borderRadius: 8, background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Kirjaudu sisään</button>
      </div>
      {/* Placeholder-kuvagalleria */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 6vw'}}>
        <div style={{display: 'flex', gap: 24, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap'}}>
          {placeholderImages.map((img, i) => (
            <div key={i} style={{width: 180, height: 240, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.18)', background: '#222'}}>
              <img src={img} alt="placeholder" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 