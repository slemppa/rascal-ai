import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import MagicLink from '../components/auth/MagicLink'
import PageMeta from '../components/PageMeta'
import { supabase } from '../lib/supabase'
import './LandingPage.css'
import '../styles/article-cards.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [showMagicModal, setShowMagicModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [articles, setArticles] = useState([])
  const [articlesLoading, setArticlesLoading] = useState(true)

  useEffect(() => {
    if (location.state?.showLogoutMessage) {
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, navigate, location.pathname])

  // Hae uusimmat artikkelit
  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, slug, category, image_url, published_at')
          .eq('published', true)
          .order('published_at', { ascending: false })
          .limit(6)

        if (error) {
          console.error('Error fetching articles:', error)
        } else {
          console.log('Fetched articles:', data)
          
          // Jos artikkeleita ei ole, näytä testidataa
          if (!data || data.length === 0) {
            console.log('No articles found, showing test data')
            const testArticles = [
              {
                id: 1,
                title: 'Kun myynti nostetaan tekoälyn avulla',
                slug: 'myynti-tekoalyn-avulla',
                category: ['MYYNTI', 'AI'],
                image_url: '/hero-v3.jpg',
                published_at: '2025-08-21'
              },
              {
                id: 2,
                title: 'Automaattinen asiakaspalvelu AI:n avulla',
                slug: 'automaattinen-asiakaspalvelu',
                category: ['PALVELU', 'AUTOMAATIO'],
                image_url: '/hero-v3.jpg',
                published_at: '2025-08-20'
              },
              {
                id: 3,
                title: 'Markkinointiautomaatio joka tuottaa tuloksia',
                slug: 'markkinointiautomaatio',
                category: ['MARKKINAT', 'AUTOMAATIO', 'TULOKSET'],
                image_url: '/hero-v3.jpg',
                published_at: '2025-08-19'
              },
              {
                id: 4,
                title: 'Tekoälyn rooli nykypäivän myynnissä',
                slug: 'tekoalyn-rooli-myyndissa',
                category: 'MYYNTI',
                image_url: '/hero-v3.jpg',
                published_at: '2025-08-18'
              },
              {
                id: 5,
                title: 'Asiakaskokemus automaation avulla',
                slug: 'asiakaskokemus-automaatio',
                category: ['KOKEMUS', 'AUTOMAATIO'],
                image_url: '/hero-v3.jpg',
                published_at: '2025-08-17'
              },
              {
                id: 6,
                title: 'Tulokset AI-pohjaisella strategialla',
                slug: 'tulokset-ai-strategialla',
                category: ['STRATEGIA', 'AI', 'TULOKSET'],
                image_url: '/hero-v3.jpg',
                published_at: '2025-08-16'
              }
            ]
            setArticles(testArticles)
          } else {
            setArticles(data)
          }
        }
      } catch (err) {
        console.error('Error fetching articles:', err)
      } finally {
        setArticlesLoading(false)
      }
    }

    fetchLatestArticles()
  }, [])

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
                <a className="nav-link" href="/blog">Artikkelit</a>
                <a className="nav-link" href="#cta">Demo</a>
                <a className="nav-link" href="/asiakkaat">Asiakkaat</a>
                <a className="nav-link" href="#team">Tiimi</a>
                <a className="nav-link" href="#contact">Ota yhteyttä</a>
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
                  <a className="mobile-nav-link" href="/blog" onClick={() => setIsMobileMenuOpen(false)}>Artikkelit</a>
                  <a className="mobile-nav-link" href="#cta" onClick={() => setIsMobileMenuOpen(false)}>Demo</a>
                  <a className="mobile-nav-link" href="/asiakkaat" onClick={() => setIsMobileMenuOpen(false)}>Asiakkaat</a>
                  <a className="mobile-nav-link" href="#team" onClick={() => setIsMobileMenuOpen(false)}>Tiimi</a>
                  <a className="mobile-nav-link" href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Ota yhteyttä</a>
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
                      Myynnin, markkinoinnin ja johdon assistentti
                    </h1>
                    <h2 className="hero-subtitle">
                      Olen siis uusi työkaverisi
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

              {/* Uusimmat artikkelit */}
              <div className="section" id="latest-articles">
                <div className="section-header">
                  <h2 className="section-title">Uusimmat artikkelit</h2>
                  <p className="section-description">
                    Pysy ajan tasalla tekoälyn ja automaation trendeistä
                  </p>
                </div>
                
                {articlesLoading ? (
                  <div className="articles-loading">
                    <div className="loading-spinner"></div>
                    <p>Ladataan artikkeleita...</p>
                  </div>
                ) : articles.length > 0 ? (
                  <>
                    <div className="articles-grid">
                      {articles.map((article) => (
                        <article key={article.id} className="article-card">
                          <div className="article-image">
                            <img 
                              src={article.image_url || '/placeholder-blog.jpg'} 
                              alt={article.title}
                              onError={(e) => {
                                e.target.src = '/placeholder-blog.jpg'
                                e.target.onerror = null // Estetään ikuinen silmukka
                              }}
                              loading="lazy"
                            />
                            <div className="article-category">
                              {Array.isArray(article.category) 
                                ? (article.category.length > 2 
                                    ? article.category.slice(0, 2).join(' • ') + ' +' + (article.category.length - 2)
                                    : article.category.join(' • '))
                                : article.category || 'Yleinen'}
                            </div>
                          </div>
                          <div className="article-content">
                            <h3 className="article-title" style={{
                              fontSize: article.title && article.title.length > 20 
                                ? `${Math.max(1.2, 1.9 - (article.title.length * 0.015))}rem`
                                : '1.8rem'
                            }}>
                              <a href={`/blog/${article.slug}`} className="article-link">
                                {article.title}
                              </a>
                            </h3>
                            <div className="article-meta">
                              <span className="article-date">
                                {article.published_at 
                                  ? new Date(article.published_at).toLocaleDateString('fi-FI', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    })
                                  : 'Ei päivää'}
                              </span>
                              <a href={`/blog/${article.slug}`} className="read-more-link">
                                Lue lisää →
                              </a>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="no-articles">
                    <p>Ei artikkeleita vielä saatavilla.</p>
                  </div>
                )}
              </div>

              {/* AI Solutions Section */}
              <div className="section" id="solutions">
                <div className="section-header">
                  <h1 className="section-title">
                    Mitä Rascal AI tekee?
                  </h1>
                  <div className="section-description">
                    <p>Rascal AI hahmottaa myynnin ja markkinoinnin kokonaisuuden</p>
                    <p>Se rakentaa sisältösuunnitelmen, tuottaa ja julkaisee somepostaukset, blogit ja uutiskirjeet.</p>
                    <p>Rascal AI soittaa, kartoittaa, buukkaa tapaamisia ja vastaanottaa puheluita.</p>
                    <p>Kaikki tämä - automaattisesti ja omalla tyylilläsi.</p>
                  </div>
                </div>
                <div className="features-grid-full-width">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 11V7a5 5 0 0110 0v4M5 9h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h2 className="feature-title">SOME</h2>
                      <p className="feature-description">
                        <em>Rakenna luottamusta, brändiä ja myyntiä – automaattisesti.</em><br />
                        Rascal AI luo kohderyhmääsi puhuttelevaa sisältöä Facebookiin, Instagramiin ja LinkedIniin. Se oppii tyylisi, äänesi ja tavoitteesi – ja tuottaa sisällöt puolestasi.
                      </p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h2 className="feature-title">AVATAR-TEKNOLOGIA</h2>
                      <p className="feature-description">
                        <em>Sinun näköisesi – tekoälyn voimalla.</em><br />
                        Avatar-teknologia luo sinusta digitaalikopion, joka esiintyy videoilla ja tuottaa sisältöä kasvoillasi. Aidon oloinen, vaikuttava ja ennen kaikkea tehokas.
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
                      <h2 className="feature-title">BLOGIT & ARTIKKELIT</h2>
                      <p className="feature-description">
                        <em>Asiantuntevaa sisältöä, joka ei unohda mitään.</em><br />
                        Rascal AI kirjoittaa artikkeleita ja blogeja juuri sinun kohdeyleisöllesi – strategian ja sisältösuunnitelman mukaisesti. Se muistaa kaiken oleellisen ja kirjoittaa kuin sinä, parhaimmillasi.
                      </p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h2 className="feature-title">UUTISKIRJEET</h2>
                      <p className="feature-description">
                        <em>Sisältö + jakelu – yhdessä paketissa.</em><br />
                        Kun artikkeli on valmis, Rascal AI tiivistää siitä kiinnostavan uutiskirjeen ja lähettää sen automaattisesti oikealle kohderyhmälle.
                      </p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h2 className="feature-title">SISÄLTÖGENERAATTORI</h2>
                      <p className="feature-description">
                        <em>Kysy – saat sisällön muutamassa minuutissa.</em><br />
                        Tarvitsetko postauksen, artikkelin tai kampanjaviestit nopeasti? Rascal AI rakentaa relevantin sisällön lennosta – aina sinun tyylilläsi.
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
                      <h2 className="feature-title">PUHELUT</h2>
                      <p className="feature-description">
                        <em>Tekoäly myy ja kartoittaa – ihmisen tavoin.</em><br />
                        Rascal AI soittaa, kartoittaa tarpeet ja buukkaa tapaamiset suoraan kalenteriisi. Se hoitaa myös asiakaspalvelupuhelut – inhimillisesti ja tehokkaasti.
                      </p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h2 className="feature-title">TEKSTIVIESTIT</h2>
                      <p className="feature-description">
                        <em>Henkilökohtaista viestintää skaalautuvasti.</em><br />
                        Tavoita kohderyhmäsi suoraan puhelimeen. Rascal AI lähettää viestejä, sopii soittoja ja seuraa liidejä – ilman, että sinä nostat sormeakaan.
                      </p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="feature-content">
                      <h2 className="feature-title">CRM-INTEGRAATIOT</h2>
                      <p className="feature-description">
                        <em>Yhdistyy suoraan järjestelmiisi.</em><br />
                        Rascal AI kytkeytyy CRM:ään, jolloin kaikki asiakasdata ja viestintä pysyy automaattisesti ajan tasalla.
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

              {/* CTA Section - kaksilaattainen */}
              <div className="section" id="contact">
                <div className="cta-section-grid">
                  <div className="cta-section">
                    <div className="cta-content">
                      <h1 className="cta-title">
                        Tekoäly Due Diligence
                      </h1>
                      <p className="cta-description">
                        Veloitukseton 60 min kartoitus: missä tekoäly tuo nopeimmat ja suurimmat hyödyt – ilman hypeä ja hakuammuntaa.
                      </p>
                      <a className="btn btn-primary cta-button" href="/ai-due-diligence">Tutustu ja varaa</a>
                    </div>
                  </div>
                  <div className="cta-section">
                    <div className="cta-content">
                      <h1 className="cta-title">
                        Varaa 30 minuuttia
                      </h1>
                      <p className="cta-description">
                        Näytämme, miten Rascal AI vapauttaa myyjäsi parhaaseen työhönsä ja nostaa tulokset uudelle tasolle.
                      </p>
                      <button
                        className="btn btn-primary cta-button"
                        disabled
                      >
                        Tulee pian
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Section */}
            <div className="section" id="team">
              <div className="section-header">
                <h2 className="section-title">Tiimi</h2>
                <p className="section-description">Tutustu ihmisiin Rascal AI:n takana.</p>
              </div>
              <div className="team-grid">
                <div className="team-card">
                  <div className="team-photo">
                    <img src="/Mika-Jarvinen-BW.jpg" alt="Mika Järvinen" loading="lazy" />
                  </div>
                  <div className="team-name">Mika Järvinen</div>
                </div>
                <div className="team-card">
                  <div className="team-photo">
                    <img src="/Henri-Rantanen-BW3.jpg" alt="Henri Rantanen" loading="lazy" />
                  </div>
                  <div className="team-name">Henri Rantanen</div>
                </div>
                <div className="team-card">
                  <div className="team-photo">
                    <img src="/rascal-sami-768x768.jpg" alt="Sami" loading="lazy" />
                  </div>
                  <div className="team-name">Sami Kiias</div>
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
                <a className="footer-link" href="#contact">Demo</a>
                <a className="footer-link" href="#contact">Yhteys</a>
                <a className="footer-link" href="mailto:info@rascalai.fi">Ota yhteyttä</a>
              </div>
              <div className="footer-bottom">
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