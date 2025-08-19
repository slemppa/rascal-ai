import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import MagicLink from '../components/auth/MagicLink'
import PageMeta from '../components/PageMeta'
import './LandingPage.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [showMagicModal, setShowMagicModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (location.state?.showLogoutMessage) {
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, navigate, location.pathname])

  return (
    <>
      <PageMeta title="RascalAI.fi – Myyjän paras työpari" description="Rascal AI vapauttaa myyjien ajan rutiineista ja valmistelusta, jotta voit keskittyä voittaviin asiakaskohtaamisiin." image="/hero-v3.jpg" />

      <div className="landing-page">
        <div className="layout-container">
          {/* Header */}
          <header className="header">
            <div className="logo-section">
              <div className="logo-icon">
                <img src="/favicon.png" alt="Rascal AI Logo" />
              </div>
              <h2 className="logo-text">Rascal AI</h2>
            </div>
            <div className="header-right">
              <div className="nav-links desktop-nav">
                <a className="nav-link" href="#solutions">Kyvykkyydet</a>
                <a className="nav-link" href="#industries">Toimialat</a>
                <a className="nav-link" href="#cta">Demo</a>
                <a className="nav-link" href="#contact">Yhteys</a>
              </div>
              <div className="header-buttons desktop-buttons">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowSignInModal(true)}
                >
                  Varaa demo
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowSignInModal(true)}
                >
                  Kirjaudu
                </button>
              </div>
              
              {/* Mobile Menu Button */}
              <button 
                className="mobile-menu-button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
            
            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="mobile-menu">
                <div className="mobile-nav-links">
                  <a className="mobile-nav-link" href="#solutions" onClick={() => setIsMobileMenuOpen(false)}>Kyvykkyydet</a>
                  <a className="mobile-nav-link" href="#industries" onClick={() => setIsMobileMenuOpen(false)}>Toimialat</a>
                  <a className="mobile-nav-link" href="#cta" onClick={() => setIsMobileMenuOpen(false)}>Demo</a>
                  <a className="mobile-nav-link" href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Yhteys</a>
                </div>
                <div className="mobile-buttons">
                  <button
                    className="btn btn-primary mobile-btn"
                    onClick={() => {
                      setShowSignInModal(true)
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    Varaa demo
                  </button>
                  <button
                    className="btn btn-secondary mobile-btn"
                    onClick={() => {
                      setShowSignInModal(true)
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    Kirjaudu
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* Main Content */}
                <div className="landing-main-content">
        <div className="content-container">
              {/* Hero Section */}
              <div className="hero-section">
                <div
                  className="hero-background"
                  style={{backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("/hero-v3.jpg")'}}
                >
                  <div className="hero-content">
                    <h1 className="hero-title">
                      Jos myyjäsi tekevät vielä kaiken itse, teet ison virheen.
                    </h1>
                    <h2 className="hero-subtitle">
                      Me elämme aikaa, jossa kilpailu asiakkaiden ajasta on brutaalia. Ja silti – suurin osa myyjistä hukkaa tuntikausia valmisteluun, sisällön tuottamiseen ja hallinnollisiin rutiineihin.
                    </h2>
                    <button
                      className="btn btn-primary hero-cta"
                      onClick={() => setShowSignInModal(true)}
                    >
                      Varaa demo
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Solutions Section */}
              <div className="section" id="solutions">
                <div className="section-header">
                  <h1 className="section-title">
                    Mitä Rascal AI tekee?
                  </h1>
                  <p className="section-description">
                    Se tekee sen, mitä ihmisen ei kannata – ja vielä enemmän. Vapauta myyjäsi rutiineista ja anna heidän keskittyä voittaviin asiakaskohtaamisiin.
                  </p>
                </div>
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M48,64a8,8,0,0,1,8-8H72V40a8,8,0,0,1,16,0V56h16a8,8,0,0,1,0,16H88V88a8,8,0,0,1-16,0V72H56A8,8,0,0,1,48,64ZM184,192h-8v-8a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0v-8h8a8,8,0,0,0,0-16Zm56-48H224V128a8,8,0,0,0-16,0v16H192a8,8,0,0,0,0,16h16v16a8,8,0,0,0,16,0V160h16a8,8,0,0,0,0-16ZM219.31,80,80,219.31a16,16,0,0,1-22.62,0L36.68,198.63a16,16,0,0,1,0-22.63L176,36.69a16,16,0,0,1,22.63,0l20.68,20.68A16,16,0,0,1,219.31,80Zm-54.63,32L144,91.31l-96,96L68.68,208ZM208,68.69,187.31,48l-32,32L176,100.69Z"></path>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h2 className="feature-title">Sisältöstrategia</h2>
                      <p className="feature-description">
                        Rakentaa sisältöstrategian ihanneasiakasprofiilin mukaisesti ja laatii kuukausittaiset markkinointisisältöehdotukset.
                      </p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16Zm-52-56H92a28,28,0,0,0,0,56h72a28,28,0,0,0,0-56Zm-28,16v24H120V152ZM80,164a12,12,0,0,1,12-12h12v24H92A12,12,0,0,1,80,164Zm84,12H152V152h12a12,12,0,0,1,0,24ZM72,108a12,12,0,1,1,12,12A12,12,0,0,1,72,108Zm88,0a12,12,0,1,1,12,12A12,12,0,0,1,160,108Z"></path>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h2 className="feature-title">Älykkäät soitot</h2>
                      <p className="feature-description">
                        Tekee outbound- ja inbound-soitot sovitun soittoskriptin mukaisesti, ohjaten keskustelua asiakkaan vastaukset huomioiden.
                      </p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M216,40H136V24a8,8,0,0,0-16,0V40H40A16,16,0,0,0,24,56V176a16,16,0,0,0,16,16H79.36L57.75,219a8,8,0,0,0,12.5,10l29.59-37h56.32l29.59,37a8,8,0,1,0,12.5-10l-21.61-27H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,136H40V56H216V176ZM104,120v24a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Zm32-16v40a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm32-16v56a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Z"></path>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h2 className="feature-title">Automaattinen raportointi</h2>
                      <p className="feature-description">
                        Raportoi automaattisesti kaikki puhelut, keskustelut ja sovitut jatkotoimenpiteet läpinäkyvästi.
                      </p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V2.5C4 1.11929 5.11929 0 6.5 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h2 className="feature-title">Sisällöntuotanto</h2>
                      <p className="feature-description">
                        Luo sisältöaihiot moneen eri kanavaan. Perustuu yrityksesi oikeaan tietoon.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Industries Section */}
              <div className="section" id="industries">
                <div className="section-header">
                  <h1 className="section-title">
                    Miksi Rascal AI?
                  </h1>
                  <p className="section-description">
                    Poista rutiinit, vapauta myyjät kohtaamisiin ja nosta tulokset uudelle tasolle. Rascal Company syntyi yhdestä kysymyksestä: Mitä tapahtuisi, jos myyjäsi käyttäisivät 30–50 % enemmän ajasta asiakkaiden kanssa – jo ensi kuussa?
                  </p>
                </div>
                <div className="industries-grid">
                  <div className="industry-card">
                    <div className="industry-image" style={{backgroundImage: 'url("/image-1.jpg")'}}></div>
                    <div className="industry-content">
                      <p className="industry-title">Myynti ja markkinointi</p>
                      <p className="industry-description">
                        Vapauta myyjäsi rutiineista ja anna heidän keskittyä asiakaskohtaamisiin, joissa syntyy liikevaihto.
                      </p>
                    </div>
                  </div>
                  <div className="industry-card">
                    <div className="industry-image" style={{backgroundImage: 'url("/image-2.jpg")'}}></div>
                    <div className="industry-content">
                      <p className="industry-title">Sisällön tuotanto</p>
                      <p className="industry-description">
                        AI laatii markkinointisisältöä eri kanaviin, uutiskirjeisiin, blogeihin ja sähköpostisuoriin.
                      </p>
                    </div>
                  </div>
                  <div className="industry-card">
                    <div className="industry-image" style={{backgroundImage: 'url("/image-3.jpg")'}}></div>
                    <div className="industry-content">
                      <p className="industry-title">Prosessien optimointi</p>
                      <p className="industry-description">
                        Oppii jatkuvasti julkaistuista sisällöistä ja toteutetuista toimenpiteistä, parantaen suoritusta.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="section cta-section" id="cta">
                <div className="cta-content">
                  <h1 className="cta-title">
                    Varaa 30 minuuttia
                  </h1>
                  <p className="cta-description">
                    Näytämme, miten Rascal AI vapauttaa myyjäsi parhaaseen työhönsä ja nostaa tulokset uudelle tasolle.
                  </p>
                  <button
                    className="btn btn-primary cta-button"
                    onClick={() => setShowSignInModal(true)}
                  >
                    Varaa 30 min demo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="footer">
            <div className="footer-content">
              <div className="footer-links">
                <a className="footer-link" href="#solutions">Kyvykkyydet</a>
                <a className="footer-link" href="#industries">Toimialat</a>
                <a className="footer-link" href="#cta">Demo</a>
                <a className="footer-link" href="#contact">Yhteys</a>
                <a className="footer-link" href="mailto:info@rascalai.fi">Ota yhteyttä</a>
              </div>
              <div className="footer-social">
                <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                  <div className="social-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24Zm0,192H40V40H216V216ZM96,112v64a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm88,28v36a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140ZM100,84A12,12,0,1,1,88,72,12,12,0,0,1,100,84Z"></path>
                    </svg>
                  </div>
                </a>
                <a href="https://www.instagram.com/rascalhelsinki" target="_blank" rel="noopener noreferrer">
                  <div className="social-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                </a>
              </div>
              <p className="footer-copyright">© 2025 Rascal AI · Rascal Company - More than meets the eye</p>
            </div>
          </footer>
        </div>
      </div>

      {/* Modals */}
      {showSignInModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) setShowSignInModal(false) }}>
          <div className="modal-container">
            <SignIn onClose={() => setShowSignInModal(false)} onForgotClick={()=>{ setShowSignInModal(false); setShowForgotModal(true) }} onMagicLinkClick={()=>{ setShowSignInModal(false); setShowMagicModal(true) }} />
          </div>
        </div>
      )}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <ForgotPassword onClose={() => { setShowForgotModal(false); setShowSignInModal(true) }} />
          </div>
        </div>
      )}
      {showMagicModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <MagicLink onClose={() => { setShowMagicModal(false); setShowSignInModal(true) }} />
          </div>
        </div>
      )}
    </>
  )
} 