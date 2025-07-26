import { useNavigate } from 'react-router-dom'
import heroImg from '/public/hero.png' // Placeholder, vaihda oikeaan kuvaan
import { useState } from 'react'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import MagicLink from '../components/auth/MagicLink'
import PageMeta from '../components/PageMeta'

const features = [
  {
    title: 'Säästä 5-10 tuntia viikossa',
    items: [
      'Ei enää etsiä tietoja 7 eri työkalusta',
      'Näet kaiken yhdellä silmäyksellä',
      'Automaattinen sisällön hallinta',
      'Toimii mobiililla ja tietokoneella',
    ],
  },
  {
    title: 'Dashboard-näkymä',
    items: [
      'Julkaisut, uutiskirjeet ja tilaajat samassa näkymässä',
      'Reaaliaikainen tilannekuva markkinoinnistasi',
      'Selkeät graafit ja numerot yhdellä silmäyksellä',
      'Kaikki tärkeä samassa paikassa',
    ],
  },
  {
    title: 'AI-avustaja',
    items: [
      'Vastaa kysymyksiin heti ja tarkasti',
      'Auttaa sisällön suunnittelussa',
      'Analysoi markkinointituloksia',
      'Oppii sinun tyylistäsi',
    ],
  },
  {
    title: 'Sisältöstrategiat',
    items: [
      'Suunnittele sisältöä kuukausiksi eteenpäin',
      'Näet mitä julkaistaan milloin',
      'Automaattinen aikataulutus',
      'Sisältökalenteri selkeästi',
    ],
  },
  {
    title: 'Mobiili käyttö',
    items: [
      'Toimii kaikilla laitteilla yhtä hyvin',
      'Näytä tuloksia asiakkaille puhelimella',
      'Työskentele missä tahansa',
      'Ei asennusta tai säätöä',
    ],
  },
  {
    title: 'Kenelle sopii?',
    items: [
      'Yrittäjät, jotka haluavat selkeyttä markkinointiin',
      'Markkinoijat, jotka työskentelevät mobiililla',
      'Sisällöntuottajat, jotka tarvitsevat aikataulun',
      'Pienet tiimit, jotka haluavat automatisoida',
    ],
  },
  {
    title: 'Helppokäyttöisyys',
    items: [
      'Ei koodia tai säätöä – toimii heti',
      'Päivittyy automaattisesti reaaliajassa',
      'Näet vaikutuksen heti, ei kuukausien päästä',
      'Kaikki yhdellä klikkauksella',
    ],
  },
  {
    title: 'Tulevat ominaisuudet',
    items: [
      'AI-puhelinmarkkinointi neljällä äänellä',
      'Edistyneet analytiikkatyökalut',
      'Integraatiot muihin palveluihin',
      'Automaattinen raportointi',
    ],
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [showMagicModal, setShowMagicModal] = useState(false)

  const handleSignInSuccess = () => {
    setShowSignInModal(false)
    navigate('/dashboard')
  }

  return (
    <>
      <PageMeta 
        title="Rascal AI - Älykäs puhelin- ja viestintäautomaatio"
        description="Automatisoi puhelut ja viestit älykkään AI-assistentin avulla. Rascal AI soittaa asiakkaillesi ja hoitaa viestinnän automaattisesti."
        image="/hero.png"
      />
      <div style={{ background: '#181B20', minHeight: '100vh', width: '100vw', overflowX: 'hidden', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 48px 0 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/favicon.png" alt="Rascal AI logo" style={{ width: 40, height: 40 }} />
          <span style={{ fontWeight: 700, fontSize: 28, letterSpacing: -1 }}>Rascal AI</span>
        </div>
        <button
          style={{ background: '#4ADE80', color: '#181B20', fontWeight: 700, fontSize: 18, border: 'none', borderRadius: 8, padding: '12px 32px', cursor: 'pointer' }}
          onClick={() => setShowSignInModal(true)}
        >
          Kirjaudu sisään
        </button>
      </header>

      {/* SignIn Modal */}
      {showSignInModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(24,27,32,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: '#23262B',
            borderRadius: 16,
            padding: 0,
            maxWidth: 400,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
          }}>
            <SignIn 
              onSuccess={handleSignInSuccess} 
              onClose={() => setShowSignInModal(false)}
              onForgotClick={() => { setShowSignInModal(false); setShowForgotModal(true); }}
              onMagicLinkClick={() => { setShowSignInModal(false); setShowMagicModal(true); }}
            />
          </div>
        </div>
      )}
      {/* ForgotPassword Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(24,27,32,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: '#23262B',
            borderRadius: 16,
            padding: 0,
            maxWidth: 400,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
          }}>
            <ForgotPassword onClose={() => { setShowForgotModal(false); setShowSignInModal(true); }} />
          </div>
        </div>
      )}
      {/* MagicLink Modal */}
      {showMagicModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(24,27,32,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: '#23262B',
            borderRadius: 16,
            padding: 0,
            maxWidth: 400,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
          }}>
            <MagicLink onClose={() => { setShowMagicModal(false); setShowSignInModal(true); }} />
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Hero */}
        <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 64, padding: '64px 32px 32px 32px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ flex: 1, minWidth: 320, maxWidth: 500 }}>
            <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 24, lineHeight: 1.1 }}>
              Näe markkinointisi totuus yhdellä silmäyksellä <span role="img" aria-label="aivot">🧠</span>
            </h1>
            <p style={{ fontSize: 20, marginBottom: 32, color: '#cbd5e1' }}>
              Ei enää taulukkoh***ttiä. Rascal AI kokoaa kaiken olennaisen yhteen näkymään – julkaisut, uutiskirjeet, tilaajat ja AI-puhelut. Säästät tunteja viikossa ja näet vaikutukset reaaliajassa.
            </p>
            <div style={{ background: '#23262B', borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Kokeile ilmaiseksi</div>
              <div style={{ color: '#cbd5e1', marginBottom: 16 }}>Pyydä demo tai testaa itse. Räätälöidään juuri sinun tarpeisiin.</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <button style={{ background: '#4ADE80', color: '#181B20', fontWeight: 700, fontSize: 16, border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer' }}>Ota yhteyttä</button>
                <button style={{ background: '#fff', color: '#181B20', fontWeight: 700, fontSize: 16, border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer' }}>Katso esittely</button>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 320, maxWidth: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={heroImg} alt="Rascal AI maskotti" style={{ width: '100%', maxWidth: 320 }} />
          </div>
        </section>

        {/* Bentogrid */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 32,
          maxWidth: 1200,
          margin: '48px auto 0 auto',
          padding: '0 32px',
        }}>
          {features.map((feature, i) => (
            <div key={i} style={{ background: '#23262B', borderRadius: 16, padding: 28, minHeight: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{feature.title}</div>
              <ul style={{ color: '#cbd5e1', fontSize: 16, margin: 0, paddingLeft: 20 }}>
                {feature.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 64, padding: '32px 0 16px 0', background: 'transparent', borderTop: '1px solid #23262B' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/favicon.png" alt="Rascal AI logo" style={{ width: 32, height: 32 }} />
            <span style={{ fontWeight: 700, fontSize: 20 }}>Rascal AI</span>
          </div>
          <div style={{ display: 'flex', gap: 32, marginBottom: 8 }}>
            <a href="/privacy" style={{ color: '#cbd5e1', textDecoration: 'underline', fontSize: 16 }}>Tietosuojaseloste</a>
            <a href="/terms" style={{ color: '#cbd5e1', textDecoration: 'underline', fontSize: 16 }}>Käyttöehdot</a>
          </div>
          <div style={{ color: '#6b7280', fontSize: 14 }}>
            © 2025 Rascal AI. Kaikki oikeudet pidätetään.
          </div>
        </div>
      </footer>
    </div>
    </>
  )
} 