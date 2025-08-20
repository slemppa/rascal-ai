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
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.7 8l-5.1 5.1-2.8-2.7L7 14.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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