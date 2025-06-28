import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

const placeholderImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80',
]

export default function LandingPage({ onLogin }) {
  const navigate = useNavigate()
  const { i18n } = useLingui()
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const isAuthenticated = !!localStorage.getItem('token')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await axios.post('/api/login', { email, password })
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
          <span style={{color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: 1}}><Trans>Rascal AI</Trans></span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <span style={{color: '#fff', fontWeight: 600, fontSize: 18, cursor: 'pointer'}}>
            <span onClick={() => i18n.activate('fi')} style={{textDecoration: i18n.locale === 'fi' ? 'underline' : 'none', marginRight: 6}}>Fi</span>
            |
            <span onClick={() => i18n.activate('en')} style={{textDecoration: i18n.locale === 'en' ? 'underline' : 'none', marginLeft: 6}}>En</span>
          </span>
          {!isAuthenticated && (
            <button onClick={() => setShowLogin(true)} style={{padding: '12px 32px', fontSize: 18, borderRadius: 8, background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}><Trans>Kirjaudu sisään</Trans></button>
          )}
        </div>
      </div>
      {/* Hero-osio: vasemmalla tekstit ja laatikko allekkain, oikealla iso kuva */}
      <div className="landing-hero" style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6vw', gap: 32, marginTop: 8}}>
        {/* Vasemmalla: tekstit ja laatikko allekkain */}
        <div style={{maxWidth: 520, color: '#fff', textAlign: 'left', flex: 1, display: 'flex', flexDirection: 'column', gap: 24}}>
          <h1 style={{fontSize: 36, fontWeight: 800, marginBottom: 0}}><Trans>Näe markkinointisi yhdellä silmäyksellä 🧠</Trans></h1>
          <p style={{fontSize: 20, fontWeight: 500, marginBottom: 0}}>
            <Trans>Rascal AI Dashboard kokoaa kaiken olennaisen yhteen näkymään – julkaisut, uutiskirjeet, tilaajat ja seuraavan sisällön aikataulun. Reaaliaikaisesti ja ilman taulukkohelvettiä.</Trans>
          </p>
          <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: '100%', minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}><Trans>Haluatko nähdä miten se toimii käytännössä?</Trans></div>
            <div style={{fontSize: 15, marginBottom: 12}}>
              <Trans>👉 Pyydä demoa tai testaa itse.<br/>Dashboard voidaan räätälöidä juuri sinun yrityksesi tarpeisiin.</Trans>
            </div>
            <div style={{display: 'flex', gap: 12, marginTop: 8}}>
              <button style={{padding: '10px 20px', fontSize: 16, borderRadius: 8, background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}><Trans>Ota yhteyttä</Trans></button>
              <button style={{padding: '10px 20px', fontSize: 16, borderRadius: 8, background: '#fff', color: 'var(--brand-dark)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}><Trans>Katso esittely</Trans></button>
            </div>
          </div>
        </div>
        {/* Oikealla: iso kuva */}
        <div className="hero-image" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 320, height: 400, borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 24px rgba(0,0,0,0.22)', background: '#222'}}>
            <img src={placeholderImages[0]} alt="placeholder" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        </div>
      </div>
      {/* Kaikki laatikot riviin, mukaan lukien laatikko 6 */}
      <div className="landing-feature-row" style={{display: 'flex', gap: 24, justifyContent: 'center', margin: '24px 0 0 0', flexWrap: 'wrap', paddingBottom: 64}}>
        {/* Laatikko 1 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}><Trans>Säästä aikaa. Pysy kartalla. Tee parempia päätöksiä.</Trans></div>
          <div style={{fontSize: 16, marginBottom: 12}}><Trans>Rascal AI Dashboard on sinulle, jos:</Trans></div>
          <ul style={{textAlign: 'left', fontSize: 15, margin: 0, lineHeight: 1.7}}>
            <li><Trans>✅ Olet kyllästynyt etsimään tietoja eri työkaluista</Trans></li>
            <li><Trans>✅ Haluat nähdä yhdellä silmäyksellä missä mennään</Trans></li>
            <li><Trans>✅ Tarvitset helpon tavan seurata markkinointisi tilaa ilman exceleitä</Trans></li>
            <li><Trans>✅ Arvostat selkeyttä ja visuaalisuutta</Trans></li>
          </ul>
        </div>
        {/* Laatikko 2 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}><Trans>Mitä näet dashboardilla?</Trans></div>
          <ul style={{textAlign: 'left', fontSize: 15, margin: 0, lineHeight: 1.7}}>
            <li><Trans>🔸 Tulevat julkaisut – Mikä on työn alla ja milloin se julkaistaan</Trans></li>
            <li><Trans>🔸 Uutiskirjeet & sähköpostit – Montako avasi? Kuka klikkasi?</Trans></li>
            <li><Trans>🔸 Tilaajien kasvu – Seuranta yhdellä silmäyksellä</Trans></li>
            <li><Trans>🔸 Sisällöntuotannon sykli – Milloin seuraava juttu tulee ulos?</Trans></li>
          </ul>
        </div>
        {/* Laatikko 3 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}><Trans>Kenelle tämä on tehty?</Trans></div>
          <div style={{fontSize: 15, marginBottom: 8}}>
            <Trans>🎯 Yrittäjille, markkinoijille ja sisällöntuottajille, jotka haluavat nopeasti ymmärtää markkinointinsa tilan – ilman ylimääräistä säätöä.<br/>Ei koodia. Ei integraatiostressiä. Kaikki valmiina.</Trans>
          </div>
        </div>
        {/* Laatikko 4 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}><Trans>Miltä se näyttää?</Trans></div>
          <div style={{fontSize: 15, marginBottom: 8}}>
            <Trans>Moderni ja mobiiliystävällinen käyttöliittymä näyttää asiat selkeästi. Pystyt käyttämään sitä tietokoneella, tabletilla tai puhelimella. Ei kikkailua – vain faktat, visuaalisesti.</Trans>
          </div>
        </div>
        {/* Laatikko 5 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}><Trans>Miksi valita Rascal AI Dashboard?</Trans></div>
          <ul style={{textAlign: 'left', fontSize: 15, margin: 0, lineHeight: 1.7}}>
            <li><Trans>💡 Yksi näkymä, kaikki tärkeä</Trans></li>
            <li><Trans>⏱️ Säästät tunteja viikossa</Trans></li>
            <li><Trans>🔄 Päivittyy automaattisesti – ei manuaalista päivittelyä</Trans></li>
            <li><Trans>📱 Toimii kaikkialla – myös puhelimella</Trans></li>
          </ul>
        </div>
      </div>
      {/* Kirjautumismodaali */}
      {showLogin && (
        <div onClick={() => setShowLogin(false)} style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div onClick={e => e.stopPropagation()} style={{background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', border: '1px solid #e1e8ed', padding: 48, maxWidth: 520, width: '95vw', position: 'relative', fontFamily: 'inherit'}}>
            <button onClick={() => setShowLogin(false)} style={{position: 'absolute', top: 20, right: 20, background: '#f7fafc', border: '1px solid #e1e8ed', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 16}}><Trans>Sulje</Trans></button>
            <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: 20}}>
              <h1 style={{marginBottom: 8, color: 'var(--brand-dark)', fontWeight: 800, fontSize: 28}}><Trans>Kirjaudu sisään</Trans></h1>
              <input type="email" placeholder={t`Sähköposti`} value={email} onChange={e => setEmail(e.target.value)} required style={{width: '100%', marginBottom: 0, borderRadius: 12, border: '1px solid #e1e8ed', padding: '16px 18px', fontSize: 17, background: '#f7fafc', color: '#222', outline: 'none', fontFamily: 'inherit'}} />
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t`Salasana`}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{width: '100%', marginBottom: 0, borderRadius: 12, border: '1px solid #e1e8ed', padding: showPassword ? '16px 48px 16px 18px' : '16px 18px', fontSize: 17, background: '#f7fafc', color: '#222', outline: 'none', fontFamily: 'inherit'}}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Piilota salasana' : 'Näytä salasana'}
                >
                  {showPassword ? (
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="2"/></svg>
                  ) : (
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="2"/><line x1="4" y1="20" x2="20" y2="4" stroke="#2563eb" strokeWidth="2"/></svg>
                  )}
                </button>
              </div>
              <button type="submit" disabled={loading} style={{width: '100%', background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 700, fontSize: 19, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', marginTop: 8}}>
                {loading ? <Trans>Kirjaudutaan...</Trans> : <Trans>Kirjaudu</Trans>}
              </button>
              {error && <div style={{color: '#e53e3e', marginTop: 8, fontWeight: 600}}>{error}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 