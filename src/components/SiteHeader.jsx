import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function SiteHeader({ onOpenSignIn }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="header">
      <div className="logo-section">
        <Link to="/" className="logo-link" aria-label="Siirry etusivulle">
          <div className="logo-icon">
            <img src="/favicon.png" alt="Rascal AI Logo" />
          </div>
          <h2 className="logo-text">Rascal AI</h2>
        </Link>
      </div>
      <div className="header-right">
        <div className="nav-links desktop-nav">
          <a className="nav-link" href="/#solutions">Kyvykkyydet</a>
          <a className="nav-link" href="/#industries">Toimialat</a>
          <a className="nav-link" href="/blog">Artikkelit</a>
          <a className="nav-link" href="/#cta">Demo</a>
          <a className="nav-link" href="/#contact">Yhteys</a>
        </div>
        <div className="header-buttons desktop-buttons">
          <button className="btn btn-primary" onClick={onOpenSignIn}>Varaa demo</button>
          <button className="btn btn-secondary" onClick={onOpenSignIn}>Kirjaudu</button>
        </div>
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

      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-nav-links">
            <a className="mobile-nav-link" href="/#solutions" onClick={() => setIsMobileMenuOpen(false)}>Kyvykkyydet</a>
            <a className="mobile-nav-link" href="/#industries" onClick={() => setIsMobileMenuOpen(false)}>Toimialat</a>
            <a className="mobile-nav-link" href="/blog" onClick={() => setIsMobileMenuOpen(false)}>Artikkelit</a>
            <a className="mobile-nav-link" href="/#cta" onClick={() => setIsMobileMenuOpen(false)}>Demo</a>
            <a className="mobile-nav-link" href="/#contact" onClick={() => setIsMobileMenuOpen(false)}>Yhteys</a>
          </div>
          <div className="mobile-buttons">
            <button className="btn btn-primary mobile-btn" onClick={() => { onOpenSignIn?.(); setIsMobileMenuOpen(false) }}>Varaa demo</button>
            <button className="btn btn-secondary mobile-btn" onClick={() => { onOpenSignIn?.(); setIsMobileMenuOpen(false) }}>Kirjaudu</button>
          </div>
        </div>
      )}
    </header>
  )
}


