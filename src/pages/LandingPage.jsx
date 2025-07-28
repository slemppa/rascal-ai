import { useNavigate } from 'react-router-dom'
import heroImg from '/public/hero.png' // Placeholder, vaihda oikeaan kuvaan
import { useState } from 'react'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import MagicLink from '../components/auth/MagicLink'
import PageMeta from '../components/PageMeta'
import './LandingPage.css'

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
  const [showMobileMenu, setShowMobileMenu] = useState(false)



  return (
    <>
      <PageMeta 
        title="Rascal AI - Älykäs puhelin- ja viestintäautomaatio"
        description="Automatisoi puhelut ja viestit älykkään AI-assistentin avulla. Rascal AI soittaa asiakkaillesi ja hoitaa viestinnän automaattisesti."
        image="/hero.png"
      />
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-logo">
          <img src="/favicon.png" alt="Rascal AI logo" />
          <span>Rascal AI</span>
        </div>
        <div className="header-right">
          <nav className="header-nav">
            <a href="/features">Ominaisuudet</a>
            <a href="/pricing">Hinnat</a>
            <a href="/contact">Yhteystiedot</a>
          </nav>
          <button
            className="mobile-menu-button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <button
            className="login-button"
            onClick={() => setShowSignInModal(true)}
          >
            Kirjaudu sisään
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <a href="/features">Ominaisuudet</a>
          <a href="/pricing">Hinnat</a>
          <a href="/contact">Yhteystiedot</a>
        </div>
      )}

      {/* SignIn Modal */}
      {showSignInModal && (
        <div 
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSignInModal(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowSignInModal(false);
            }
          }}
          tabIndex={0}
        >
          <div className="modal-container">
            <SignIn 
              onClose={() => setShowSignInModal(false)}
              onForgotClick={() => { setShowSignInModal(false); setShowForgotModal(true); }}
              onMagicLinkClick={() => { setShowSignInModal(false); setShowMagicModal(true); }}
            />
          </div>
        </div>
      )}
      {/* ForgotPassword Modal */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <ForgotPassword onClose={() => { setShowForgotModal(false); setShowSignInModal(true); }} />
          </div>
        </div>
      )}
      {/* MagicLink Modal */}
      {showMagicModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <MagicLink onClose={() => { setShowMagicModal(false); setShowSignInModal(true); }} />
          </div>
        </div>
      )}

      <div className="landing-content">
        {/* Hero */}
        <section className="hero-section">
          <div className="hero-content">
            <h1>
              Näe markkinointisi totuus yhdellä silmäyksellä <span role="img" aria-label="aivot">🧠</span>
            </h1>
            <p>
              Ei enää taulukkoh***ttiä. Rascal AI kokoaa kaiken olennaisen yhteen näkymään – julkaisut, uutiskirjeet, tilaajat ja AI-puhelut. Säästät tunteja viikossa ja näet vaikutukset reaaliajassa.
            </p>
            <div className="cta-box">
              <div className="cta-title">Kokeile ilmaiseksi</div>
              <div className="cta-description">Pyydä demo tai testaa itse. Räätälöidään juuri sinun tarpeisiin.</div>
              <div className="cta-buttons">
                <button className="cta-primary" onClick={() => navigate('/contact')}>Ota yhteyttä</button>
                <button className="cta-secondary" onClick={() => navigate('/pricing')}>Katso hinnat</button>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <img src={heroImg} alt="Rascal AI maskotti" />
          </div>
        </section>

        {/* Bentogrid */}
        <section className="features-grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-card">
              <div className="feature-title">{feature.title}</div>
              <ul>
                {feature.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/favicon.png" alt="Rascal AI logo" />
            <span>Rascal AI</span>
          </div>
          <div className="footer-links">
            <a href="/features">Ominaisuudet</a>
            <a href="/pricing">Hinnat</a>
            <a href="/contact">Yhteystiedot</a>
            <a href="/privacy">Tietosuojaseloste</a>
            <a href="/terms">Käyttöehdot</a>
          </div>
          <div className="footer-copyright">
            © 2025 Rascal AI. Kaikki oikeudet pidätetään.
          </div>
        </div>
      </footer>
    </div>
    </>
  )
} 