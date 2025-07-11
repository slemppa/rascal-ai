import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './LandingPage.css'

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
  const [showPassword, setShowPassword] = useState(false)
  const [showCookieBanner, setShowCookieBanner] = useState(false)

  useEffect(() => {
    // Tarkista onko evästeiden suostumus jo annettu
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowCookieBanner(true)
    }
  }, [])

  const handleCookieAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShowCookieBanner(false)
  }

  const handleCookieDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShowCookieBanner(false)
  }

  const handleCookieSettings = () => {
    navigate('/privacy')
    setShowCookieBanner(false)
  }

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
          <span style={{color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: 1}}>Rascal AI</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          {!isAuthenticated && (
            <button onClick={() => setShowLogin(true)} style={{padding: '12px 32px', fontSize: 18, borderRadius: 8, background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Kirjaudu sisään</button>
          )}
        </div>
      </div>
      {/* Hero-osio: vasemmalla tekstit ja laatikko allekkain, oikealla kuva */}
      <div className="landing-hero" style={{
        width: '100%',
        maxWidth: '1050px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        padding: '48px 6vw 32px 6vw',
        minHeight: '60vh',
      }}>
        {/* Vasemmalla: tekstit ja laatikko allekkain */}
        <div style={{
          flex: '0 1 55%',
          maxWidth: '55%',
          color: '#fff',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}>
          <h1 style={{fontSize: 36, fontWeight: 800, marginBottom: 0}}>Näe markkinointisi totuus yhdellä silmäyksellä 🧠</h1>
          <p style={{fontSize: 20, fontWeight: 500, marginBottom: 0}}>
            Ei enää taulukkohelvettiä. Rascal AI kokoaa kaiken olennaisen yhteen näkymään – julkaisut, uutiskirjeet, tilaajat ja AI-puhelut. Säästät tunteja viikossa ja näet vaikutuksen reaaliajassa.
          </p>
          <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: '100%', minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Kokeile ilmaiseksi</div>
            <div style={{fontSize: 15, marginBottom: 12}}>
              Pyydä demo tai testaa itse. Räätälöidään juuri sinun tarpeisiin.
            </div>
            <div style={{display: 'flex', gap: 12}}>
              <button style={{padding: '12px 24px', fontSize: 16, borderRadius: 8, background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Ota yhteyttä</button>
              <button onClick={() => navigate('/dashboard')} style={{padding: '12px 24px', fontSize: 16, borderRadius: 8, background: '#fff', color: 'var(--brand-dark)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Katso esittely</button>
            </div>
          </div>
        </div>
        {/* Oikealla: kuva - pienempi koko ja pyöreät kulmat */}
        <div style={{
          flex: '0 1 45%',
          maxWidth: '45%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <img 
            src="/hero.png" 
            alt="Dashboard preview" 
            style={{
              maxWidth: '340px',
              width: '100%',
              height: 'auto',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              objectFit: 'cover',
              display: 'block',
            }} 
          />
        </div>
      </div>
      {/* Bentogrid Feature-osio */}
      <div className="landing-bentogrid" style={{marginTop: '24px', paddingBottom: '64px'}}>
        {/* Kortti 1: Ajan säästö */}
        <div className="landing-card">
          <div className="landing-card-title">Säästä 5-10 tuntia viikossa</div>
          <ul className="landing-card-content">
            <li>Ei enää etsiä tietoja 7 eri työkalusta</li>
            <li>Näet kaiken yhdellä silmäyksellä</li>
            <li>Automaattinen sisällön hallinta</li>
            <li>Toimii mobiililla ja tietokoneella</li>
          </ul>
        </div>

        {/* Kortti 2: Dashboard-näkymä */}
        <div className="landing-card">
          <div className="landing-card-title">Dashboard-näkymä</div>
          <ul className="landing-card-content">
            <li>Julkaisut, uutiskirjeet ja tilaajat samassa näkymässä</li>
            <li>Reaaliaikainen tilannekuva markkinointistasi</li>
            <li>Selkeät graafit ja numerot yhdellä silmäyksellä</li>
            <li>Kaikki tärkeä samassa paikassa</li>
          </ul>
        </div>

        {/* Kortti 3: AI-avustaja */}
        <div className="landing-card">
          <div className="landing-card-title">AI-avustaja</div>
          <ul className="landing-card-content">
            <li>Vastaa kysymyksiin heti ja tarkasti</li>
            <li>Auttaa sisällön suunnittelussa</li>
            <li>Analysoi markkinointituloksia</li>
            <li>Oppii sinun tyylistäsi</li>
          </ul>
        </div>

        {/* Kortti 4: Sisältöstrategiat */}
        <div className="landing-card">
          <div className="landing-card-title">Sisältöstrategiat</div>
          <ul className="landing-card-content">
            <li>Suunnittele sisältöä kuukausiksi eteenpäin</li>
            <li>Näet mitä julkaistaan milloin</li>
            <li>Automaattinen aikataulutus</li>
            <li>Sisältökalenteri selkeästi</li>
          </ul>
        </div>

        {/* Kortti 5: Mobiili käyttö */}
        <div className="landing-card">
          <div className="landing-card-title">Mobiili käyttö</div>
          <ul className="landing-card-content">
            <li>Toimii kaikilla laitteilla yhtä hyvin</li>
            <li>Näytä tuloksia asiakkaillesi puhelimella</li>
            <li>Työskentele missä tahansa</li>
            <li>Ei asennusta tai säätöä</li>
          </ul>
        </div>

        {/* Kortti 6: Kenelle sopii */}
        <div className="landing-card">
          <div className="landing-card-title">Kenelle sopii?</div>
          <ul className="landing-card-content">
            <li>Yrittäjät, jotka haluavat selkeyttä markkinointiin</li>
            <li>Markkinoijat, jotka työskentelevät mobiililla</li>
            <li>Sisällöntuottajat, jotka tarvitsevat aikataulun</li>
            <li>Pienet tiimit, jotka haluavat automatisoida</li>
          </ul>
        </div>

        {/* Kortti 7: Helppokäyttöisyys */}
        <div className="landing-card">
          <div className="landing-card-title">Helppokäyttöisyys</div>
          <ul className="landing-card-content">
            <li>Ei koodia tai säätöä – toimii heti</li>
            <li>Päivittyy automaattisesti reaaliajassa</li>
            <li>Näet vaikutuksen heti, ei kuukausien päästä</li>
            <li>Kaikki yhdellä klikkauksella</li>
          </ul>
        </div>

        {/* Kortti 8: Tulevat ominaisuudet */}
        <div className="landing-card">
          <div className="landing-card-title">Tulevat ominaisuudet</div>
          <ul className="landing-card-content">
            <li>AI-puhelinmarkkinointi neljällä äänellä</li>
            <li>Edistyneet analytiikkatyökalut</li>
            <li>Integraatiot muihin palveluihin</li>
            <li>Automaattinen raportointi</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: '#1a1d23', 
        padding: '32px 6vw', 
        marginTop: 'auto',
        borderTop: '1px solid #333'
      }}>
        <div style={{
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <img src="/favicon.png" alt="Rascal AI logo" style={{width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: 'var(--brand-green)'}} />
            <span style={{color: '#fff', fontWeight: 700, fontSize: 20, letterSpacing: 1}}>Rascal AI</span>
          </div>
          
          <div style={{display: 'flex', gap: 32, flexWrap: 'wrap'}}>
            <button 
              onClick={() => navigate('/privacy')} 
              style={{
                background: 'none', 
                border: 'none', 
                color: '#ccc', 
                fontSize: 14, 
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Tietosuojaseloste
            </button>
            <button 
              onClick={() => navigate('/terms')} 
              style={{
                background: 'none', 
                border: 'none', 
                color: '#ccc', 
                fontSize: 14, 
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Käyttöehdot
            </button>
          </div>
          
          <div style={{color: '#999', fontSize: 14}}>
            © {new Date().getFullYear()} Rascal AI. Kaikki oikeudet pidätetään.
          </div>
        </div>
      </div>

      {/* Kirjautumismodaali */}
      {showLogin && (
        <div onClick={() => setShowLogin(false)} style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'}}>
          <div onClick={e => e.stopPropagation()} style={{background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', border: '1px solid #e1e8ed', padding: '32px 24px', maxWidth: 520, width: '100%', position: 'relative', fontFamily: 'inherit'}}>
            <button onClick={() => setShowLogin(false)} style={{position: 'absolute', top: 16, right: 16, background: '#f7fafc', border: '1px solid #e1e8ed', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14}}>Sulje</button>
            <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: 20}}>
              <h1 style={{marginBottom: 8, color: 'var(--brand-dark)', fontWeight: 800, fontSize: 24}}>Kirjaudu sisään</h1>
              <input type="email" placeholder="Sähköposti" value={email} onChange={e => setEmail(e.target.value)} required style={{width: '100%', marginBottom: 0, borderRadius: 12, border: '1px solid #e1e8ed', padding: '16px 18px', fontSize: 16, background: '#f7fafc', color: '#222', outline: 'none', fontFamily: 'inherit'}} />
              <div style={{position: 'relative'}}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Salasana" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  style={{width: '100%', marginBottom: 0, borderRadius: 12, border: '1px solid #e1e8ed', padding: '16px 18px', fontSize: 16, background: '#f7fafc', color: '#222', outline: 'none', fontFamily: 'inherit', paddingRight: '50px'}} 
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
                    fontSize: 16, 
                    color: '#666'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <button type="submit" disabled={loading} style={{width: '100%', background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', marginTop: 8}}>
                {loading ? 'Kirjaudutaan...' : 'Kirjaudu'}
              </button>
              {error && <div style={{color: '#e53e3e', marginTop: 8, fontWeight: 600}}>{error}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Evästeiden suostumusbanneri */}
      {showCookieBanner && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          color: '#fff',
          padding: '20px 6vw',
          zIndex: 9999,
          borderTop: '1px solid #333'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap'
          }}>
            <div style={{flex: 1, minWidth: '250px'}}>
              <h3 style={{margin: '0 0 8px 0', fontSize: 18, fontWeight: 700}}>🍪 Evästeet ja tietosuoja</h3>
              <p style={{margin: 0, fontSize: 14, lineHeight: 1.5, color: '#ccc'}}>
                Käytämme evästeitä parantaaksemme sivuston toimintaa ja käyttökokemusta. 
                Jatkamalla sivuston käyttöä hyväksyt evästeiden käytön. 
                <button 
                  onClick={handleCookieSettings}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4ade80',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    marginLeft: 8,
                    fontSize: 14
                  }}
                >
                  Lue lisää
                </button>
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <button
                onClick={handleCookieDecline}
                style={{
                  background: 'none',
                  border: '1px solid #666',
                  color: '#ccc',
                  padding: '10px 20px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Hylkää
              </button>
              <button
                onClick={handleCookieAccept}
                style={{
                  background: 'var(--brand-green)',
                  border: 'none',
                  color: 'var(--brand-black)',
                  padding: '10px 20px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700
                }}
              >
                Hyväksy kaikki
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 