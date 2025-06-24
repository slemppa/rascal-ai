import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const placeholderImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80',
]

export default function LandingPage({ onLogin }) {
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const isAuthenticated = !!localStorage.getItem('token')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await axios.post('https://samikiias.app.n8n.cloud/webhook/06ae4c0b-1f13-4688-afad-9bf11d51fd0f', { email, password })
      // Oletetaan, että vastaus on taulukko, jossa on yksi objekti tai error-objekti
      if (res.data && res.data.error) {
        setError(res.data.error)
      } else {
        const data = Array.isArray(res.data) ? res.data[0] : res.data
        if (data && data.token && data.user) {
          setShowLogin(false)
          if (onLogin) onLogin(data.token, data.user)
        } else {
          setError('Kirjautuminen epäonnistui')
        }
      }
    } catch {
      setError('Virhe palvelinyhteydessä')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight: '100vh', minWidth: '100vw', background: 'var(--brand-dark)', display: 'flex', flexDirection: 'column'}}>
      {/* Ylänavigaatio */}
      <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 6vw 0 6vw'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          {/* Logo tai pelkkä nimi */}
          <img src="/favicon.png" alt="Rascal AI logo" style={{width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: 'var(--brand-green)'}} />
          <span style={{color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: 1}}>Rascal AI</span>
        </div>
        {!isAuthenticated && (
          <button onClick={() => setShowLogin(true)} style={{padding: '12px 32px', fontSize: 18, borderRadius: 8, background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Kirjaudu sisään</button>
        )}
      </div>
      {/* Hero-osio: vasemmalla tekstit ja laatikko allekkain, oikealla iso kuva */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '0 6vw', gap: 32, marginTop: 8}}>
        {/* Vasemmalla: tekstit ja laatikko allekkain */}
        <div style={{maxWidth: 520, color: '#fff', textAlign: 'left', flex: 1, display: 'flex', flexDirection: 'column', gap: 24}}>
          <h1 style={{fontSize: 36, fontWeight: 800, marginBottom: 0}}>Näe markkinointisi yhdellä silmäyksellä 🧠</h1>
          <p style={{fontSize: 20, fontWeight: 500, marginBottom: 0}}>
            Rascal AI Dashboard kokoaa kaiken olennaisen yhteen näkymään – julkaisut, uutiskirjeet, tilaajat ja seuraavan sisällön aikataulun. Reaaliaikaisesti ja ilman taulukkohelvettiä.
          </p>
          <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: '100%', minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Haluatko nähdä miten se toimii käytännössä?</div>
            <div style={{fontSize: 15, marginBottom: 12}}>
              👉 Pyydä demoa tai testaa itse.<br/>
              Dashboard voidaan räätälöidä juuri sinun yrityksesi tarpeisiin.
            </div>
            <div style={{display: 'flex', gap: 12, marginTop: 8}}>
              <button style={{padding: '10px 20px', fontSize: 16, borderRadius: 8, background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Ota yhteyttä</button>
              <button style={{padding: '10px 20px', fontSize: 16, borderRadius: 8, background: '#fff', color: 'var(--brand-dark)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Katso esittely</button>
            </div>
          </div>
        </div>
        {/* Oikealla: iso kuva */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 320, height: 400, borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 24px rgba(0,0,0,0.22)', background: '#222'}}>
            <img src={placeholderImages[0]} alt="placeholder" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        </div>
      </div>
      {/* Kaikki laatikot riviin, mukaan lukien laatikko 6 */}
      <div style={{display: 'flex', flexDirection: 'row', gap: 24, justifyContent: 'center', margin: '24px 0 0 0', flexWrap: 'wrap', paddingBottom: 64}}>
        {/* Laatikko 1 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Säästä aikaa. Pysy kartalla. Tee parempia päätöksiä.</div>
          <div style={{fontSize: 16, marginBottom: 12}}>Rascal AI Dashboard on sinulle, jos:</div>
          <ul style={{textAlign: 'left', fontSize: 15, margin: 0, lineHeight: 1.7}}>
            <li>✅ Olet kyllästynyt etsimään tietoja eri työkaluista</li>
            <li>✅ Haluat nähdä yhdellä silmäyksellä missä mennään</li>
            <li>✅ Tarvitset helpon tavan seurata markkinointisi tilaa ilman exceleitä</li>
            <li>✅ Arvostat selkeyttä ja visuaalisuutta</li>
          </ul>
        </div>
        {/* Laatikko 2 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Mitä näet dashboardilla?</div>
          <ul style={{textAlign: 'left', fontSize: 15, margin: 0, lineHeight: 1.7}}>
            <li>🔸 Tulevat julkaisut – Mikä on työn alla ja milloin se julkaistaan</li>
            <li>🔸 Uutiskirjeet & sähköpostit – Montako avasi? Kuka klikkasi?</li>
            <li>🔸 Tilaajien kasvu – Seuranta yhdellä silmäyksellä</li>
            <li>🔸 Sisällöntuotannon sykli – Milloin seuraava juttu tulee ulos?</li>
          </ul>
        </div>
        {/* Laatikko 3 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Kenelle tämä on tehty?</div>
          <div style={{fontSize: 15, marginBottom: 8}}>
            🎯 Yrittäjille, markkinoijille ja sisällöntuottajille, jotka haluavat nopeasti ymmärtää markkinointinsa tilan – ilman ylimääräistä säätöä.<br/>
            Ei koodia. Ei integraatiostressiä. Kaikki valmiina.
          </div>
        </div>
        {/* Laatikko 4 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Miltä se näyttää?</div>
          <div style={{fontSize: 15, marginBottom: 8}}>
            Moderni ja mobiiliystävällinen käyttöliittymä näyttää asiat selkeästi. Pystyt käyttämään sitä tietokoneella, tabletilla tai puhelimella. Ei kikkailua – vain faktat, visuaalisesti.
          </div>
        </div>
        {/* Laatikko 5 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Miksi valita Rascal AI Dashboard?</div>
          <ul style={{textAlign: 'left', fontSize: 15, margin: 0, lineHeight: 1.7}}>
            <li>💡 Yksi näkymä, kaikki tärkeä</li>
            <li>⏱️ Säästät tunteja viikossa</li>
            <li>🔄 Päivittyy automaattisesti – ei manuaalista päivittelyä</li>
            <li>📱 Toimii kaikkialla – myös puhelimella</li>
          </ul>
        </div>
      </div>
      {/* Kirjautumismodaali */}
      {showLogin && (
        <div onClick={() => setShowLogin(false)} style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div onClick={e => e.stopPropagation()} style={{background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', border: '1px solid #e1e8ed', padding: 48, maxWidth: 520, width: '95vw', position: 'relative', fontFamily: 'inherit'}}>
            <button onClick={() => setShowLogin(false)} style={{position: 'absolute', top: 20, right: 20, background: '#f7fafc', border: '1px solid #e1e8ed', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 16}}>Sulje</button>
            <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: 20}}>
              <h1 style={{marginBottom: 8, color: 'var(--brand-dark)', fontWeight: 800, fontSize: 28}}>Kirjaudu sisään</h1>
              <input type="email" placeholder="Sähköposti" value={email} onChange={e => setEmail(e.target.value)} required style={{width: '100%', marginBottom: 0, borderRadius: 12, border: '1px solid #e1e8ed', padding: '16px 18px', fontSize: 17, background: '#f7fafc', color: '#222', outline: 'none', fontFamily: 'inherit'}} />
              <input type="password" placeholder="Salasana" value={password} onChange={e => setPassword(e.target.value)} required style={{width: '100%', marginBottom: 0, borderRadius: 12, border: '1px solid #e1e8ed', padding: '16px 18px', fontSize: 17, background: '#f7fafc', color: '#222', outline: 'none', fontFamily: 'inherit'}} />
              <button type="submit" disabled={loading} style={{width: '100%', background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 700, fontSize: 19, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', marginTop: 8}}>
                {loading ? 'Kirjaudutaan...' : 'Kirjaudu'}
              </button>
              {error && <div style={{color: '#e53e3e', marginTop: 8, fontWeight: 600}}>{error}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 