import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import './BlogPage.css'
import './LandingPage.css'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import MagicLink from '../components/auth/MagicLink'

export default function BlogPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [showMagicModal, setShowMagicModal] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      setError(null) // Tyhjennetään mahdollinen aiempi virhe
      const response = await fetch('/api/get-articles')
      if (!response.ok) {
        throw new Error('Artikkeleita ei voitu ladata')
      }
      const data = await response.json()
      setArticles(data || []) // Varmistetaan että data on array
    } catch (err) {
      console.error('Error fetching articles:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }



  return (
    <>
      <PageMeta 
        title="Artikkelit - RascalAI.fi" 
        description="Lue ajankohtaisia artikkeleita myynnistä, markkinoinnista ja tekoälyn mahdollisuuksista" 
        image="/hero-v3.jpg" 
      />
      
            <div className="blog-page">
        {/* Landing Page Style Header */}
        <header className="header">
          <div className="logo-section">
            <div className="logo-icon">
              <img src="/favicon.png" alt="Rascal AI Logo" />
            </div>
            <h2 className="logo-text">Rascal AI</h2>
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
                <a className="mobile-nav-link" href="/#solutions" onClick={() => setIsMobileMenuOpen(false)}>Kyvykkyydet</a>
                <a className="mobile-nav-link" href="/#industries" onClick={() => setIsMobileMenuOpen(false)}>Toimialat</a>
                <a className="mobile-nav-link" href="/blog" onClick={() => setIsMobileMenuOpen(false)}>Artikkelit</a>
                <a className="mobile-nav-link" href="/#cta" onClick={() => setIsMobileMenuOpen(false)}>Demo</a>
                <a className="mobile-nav-link" href="/#contact" onClick={() => setIsMobileMenuOpen(false)}>Yhteys</a>
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

        <div className="layout-container">
          {/* Page Title Section */}
          <section className="blog-title-section">
            <div className="blog-title-content">
              <h1 className="blog-title">Artikkelit</h1>
              <p className="blog-description">
                Ajankohtaisia näkemyksiä myynnistä, markkinoinnista ja tekoälyn mahdollisuuksista
              </p>
            </div>
          </section>

          {/* Articles Grid */}
          <main className="blog-main">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Ladataan artikkeleita...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <h2>Virhe</h2>
                <p>{error}</p>
                <button onClick={fetchArticles} className="btn btn-primary">
                  Yritä uudelleen
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div className="no-articles">
                <h3>Ei artikkeleita vielä</h3>
                <p>Artikkeleita lisätään pian!</p>
              </div>
            ) : (
              <div className="articles-grid">
                {articles.map((article) => (
                  <article key={article.id} className="article-card">
                    <div className="article-image">
                      {(article.image_url || article.media_url) ? (
                        <img 
                          src={article.image_url || article.media_url} 
                          alt={article.title || 'Artikkeli'}
                          loading="lazy"
                        />
                      ) : (
                        <div className="article-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.5 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V9.5L14.5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2V9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="article-content">
                      <div className="article-meta">
                        <span className="article-date">
                          {article.published_at ? new Date(article.published_at).toLocaleDateString('fi-FI') : 'Ei päivää'}
                        </span>
                        {article.category && (
                          <span className="article-category">{article.category}</span>
                        )}
                      </div>
                      <h2 className="article-title">
                        <Link to={`/blog/${article.slug || 'ei-slugia'}`}>
                          {article.title || 'Ei otsikkoa'}
                        </Link>
                      </h2>
                      <p className="article-excerpt">
                        {article.excerpt || (article.content ? article.content.substring(0, 150) + '...' : 'Ei kuvausta saatavilla')}
                      </p>
                      <div className="article-footer">
                        <Link to={`/blog/${article.slug || 'ei-slugia'}`} className="read-more">
                          Lue lisää →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {showSignInModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) setShowSignInModal(false) }}>
          <div className="modal-container">
            <SignIn 
              onClose={() => setShowSignInModal(false)}
              onForgotClick={() => { setShowSignInModal(false); setShowForgotModal(true) }}
              onMagicLinkClick={() => { setShowSignInModal(false); setShowMagicModal(true) }}
            />
          </div>
        </div>
      )}

      {showForgotModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) { setShowForgotModal(false); setShowSignInModal(true) } }}>
          <div className="modal-container">
            <ForgotPassword onClose={() => { setShowForgotModal(false); setShowSignInModal(true) }} />
          </div>
        </div>
      )}

      {showMagicModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) { setShowMagicModal(false); setShowSignInModal(true) } }}>
          <div className="modal-container">
            <MagicLink onClose={() => { setShowMagicModal(false); setShowSignInModal(true) }} />
          </div>
        </div>
      )}
    </>
  )
}
