import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import PageMeta from '../components/PageMeta'
import './FeaturesPage.css'

const features = [
  {
    title: 'AI-puhelinmarkkinointi',
    description: 'Automatisoi puhelut asiakkaillesi älykkään AI-assistentin avulla',
    icon: '📞',
    details: [
      'Neljä eri ääntä (2 miestä, 2 naista)',
      'Luonnollinen keskustelu',
      'Automaattinen puhelujen aikataulutus',
      'Reaaliaikainen puhelujen seuranta',
      'Puhelujen tallennus ja analyysi',
      'Kustomoitavat puheluskriptit'
    ],
    benefits: ['Säästä 80% ajasta', 'Paranna konversiota', 'Skalautuva ratkaisu']
  },
  {
    title: 'Dashboard-näkymä',
    description: 'Näe kaikki markkinointisi yhdellä silmäyksellä',
    icon: '📊',
    details: [
      'Yhdistetty näkymä kaikista kanavista',
      'Reaaliaikainen data',
      'Selkeät graafit ja numerot',
      'Kustomoitavat widgetit',
      'Mobiili-ystävällinen',
      'Automaattinen päivitys'
    ],
    benefits: ['Näe totuuden heti', 'Nopeat päätökset', 'Aikaa säästyy']
  },
  {
    title: 'Sisältöstrategiat',
    description: 'Suunnittele ja hallitse sisältöä kuukausiksi eteenpäin',
    icon: '📅',
    details: [
      'Visuaalinen sisältökalenteri',
      'Automaattinen aikataulutus',
      'Sisältötyyppien hallinta',
      'Kampanjoiden suunnittelu',
      'Tiimityökalut',
      'Deadline-hälytykset'
    ],
    benefits: ['Järjestä sisältösi', 'Vältä kiireet', 'Paranna laatua']
  },
  {
    title: 'AI-avustaja',
    description: 'Älykäs assistentti auttaa sisällön suunnittelussa ja analyysissä',
    icon: '🤖',
    details: [
      'Vastaa kysymyksiin heti',
      'Sisällön ideointi',
      'Markkinointitulosten analyysi',
      'Oppii sinun tyylistäsi',
      '24/7 saatavilla',
      'Monikielinen tuki'
    ],
    benefits: ['Älykkäät ehdotukset', 'Nopeat vastaukset', 'Oppiva järjestelmä']
  },
  {
    title: 'Sosiaalisen median hallinta',
    description: 'Hallitse kaikki sosiaalisen median kanavasi yhdestä paikasta',
    icon: '📱',
    details: [
      'Useita kanavia samassa näkymässä',
      'Automaattinen julkaisu',
      'Sisällön aikataulutus',
      'Engagement-seuranta',
      'Analytiikka ja raportit',
      'Tiimityökalut'
    ],
    benefits: ['Yhdistetty hallinta', 'Aikaa säästyy', 'Parempi näkyvyys']
  },
  {
    title: 'Email-markkinointi',
    description: 'Automatisoi email-kampanjat ja paranna konversiota',
    icon: '📧',
    details: [
      'Automaattiset email-sekvenssit',
      'Segmentointi ja personalisointi',
      'A/B-testaus',
      'Konversio-seuranta',
      'GDPR-yhteensopiva',
      'Analytiikka ja raportit'
    ],
    benefits: ['Automatisoi prosessit', 'Paranna konversiota', 'Säästä aikaa']
  },
  {
    title: 'Analytiikka ja raportit',
    description: 'Saa syvällisiä tietoja markkinointisi suorituskyvystä',
    icon: '📈',
    details: [
      'Reaaliaikainen seuranta',
      'Kustomoitavat raportit',
      'ROI-mittaukset',
      'Kohdeyleisön analyysi',
      'Trendien tunnistus',
      'Automaattiset raportit'
    ],
    benefits: ['Tietopohjaiset päätökset', 'Näe vaikutukset', 'Optimoi kampanjat']
  },
  {
    title: 'Integraatiot',
    description: 'Yhdistä Rascal AI muihin työkaluihisi saumattomasti',
    icon: '🔗',
    details: [
      'Zapier-integraatiot',
      'API-tuki',
      'CRM-yhteydet',
      'Maksupalvelut',
      'Analytiikkatyökalut',
      'Kustomoidut webhookit'
    ],
    benefits: ['Saumaton työskentely', 'Ei duplikaattidataa', 'Automatisoi prosessit']
  }
]

const useCases = [
  {
    title: 'Pienet yritykset',
    description: 'Automatisoi markkinointisi ja kasva tehokkaasti',
    icon: '🏢',
    benefits: ['Säästä aikaa', 'Paranna näkyvyyttä', 'Kasva nopeammin']
  },
  {
    title: 'Markkinointitiimit',
    description: 'Yhdistä kaikki markkinointikanavat yhdessä',
    icon: '👥',
    benefits: ['Yhdistetty näkymä', 'Tiimityökalut', 'Parempi koordinointi']
  },
  {
    title: 'Sisällöntuottajat',
    description: 'Suunnittele ja hallitse sisältöä tehokkaasti',
    icon: '✍️',
    benefits: ['Sisältökalenteri', 'Aikataulutus', 'Laadun parantaminen']
  },
  {
    title: 'Yrittäjät',
    description: 'Keskity liiketoimintaan, anna AI:n hoitaa markkinointi',
    icon: '💼',
    benefits: ['Automatisointi', 'Aikaa säästyy', 'Parempi ROI']
  }
]

export default function FeaturesPage() {
  const navigate = useNavigate()
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // ESC-näppäimen kuuntelu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showForgotModal) {
          setShowForgotModal(false)
        } else if (showSignInModal) {
          setShowSignInModal(false)
        }
      }
    }

    if (showSignInModal || showForgotModal) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showSignInModal, showForgotModal])



  return (
    <>
      <PageMeta 
        title="Ominaisuudet - Rascal AI"
        description="Tutustu Rascal AI:n kaikkiin ominaisuuksiin: AI-puhelinmarkkinointi, dashboard-näkymä, sisältöstrategiat ja paljon muuta."
        image="/hero.png"
      />
      
      <div className="features-page">
        {/* Header */}
        <header className="features-header">
          <div className="header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
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
              className="login-button"
              onClick={() => setShowSignInModal(true)}
            >
              Kirjaudu sisään
            </button>
          </div>
        </header>

        {/* Auth Modals */}
        {showSignInModal && (
          <div 
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSignInModal(false);
              }
            }}
          >
            <div className="modal-container">
              <SignIn 
                onClose={() => setShowSignInModal(false)}
                onForgotClick={() => { setShowSignInModal(false); setShowForgotModal(true); }}
              />
            </div>
          </div>
        )}
        {showForgotModal && (
          <div 
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowForgotModal(false);
              }
            }}
          >
            <div className="modal-container">
              <ForgotPassword onClose={() => { setShowForgotModal(false); setShowSignInModal(true); }} />
            </div>
          </div>
        )}

        <div className="features-content">
          {/* Hero Section */}
          <section className="features-hero">
            <h1>Kaikki mitä tarvitset markkinointiin yhdessä paikassa</h1>
            <p>Rascal AI yhdistää kaikki markkinointityökalusi yhdeksi tehokkaaksi kokonaisuudeksi. Säästä aikaa, paranna tuloksia ja kasva nopeammin.</p>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">80%</div>
                <div className="stat-label">Aikaa säästyy</div>
              </div>
              <div className="stat">
                <div className="stat-number">3x</div>
                <div className="stat-label">Parempi konversio</div>
              </div>
              <div className="stat">
                <div className="stat-number">24/7</div>
                <div className="stat-label">AI-tuki</div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                
                <div className="feature-details">
                  <h4>Ominaisuudet:</h4>
                  <ul>
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
                    ))}
                  </ul>
                </div>

                <div className="feature-benefits">
                  <h4>Hyödyt:</h4>
                  <div className="benefits-tags">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <span key={benefitIndex} className="benefit-tag">{benefit}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Use Cases Section */}
          <section className="use-cases-section">
            <h2>Kenelle Rascal AI sopii?</h2>
            <div className="use-cases-grid">
              {useCases.map((useCase, index) => (
                <div key={index} className="use-case-card">
                  <div className="use-case-icon">{useCase.icon}</div>
                  <h3>{useCase.title}</h3>
                  <p>{useCase.description}</p>
                  <div className="use-case-benefits">
                    {useCase.benefits.map((benefit, benefitIndex) => (
                      <span key={benefitIndex} className="benefit-tag">{benefit}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="features-cta">
            <h2>Valmis kokeilemaan?</h2>
            <p>Aloita ilmaisella kokeilujaksolla ja koe Rascal AI:n voima omassa liiketoiminnassasi.</p>
            <div className="cta-buttons">
              <button className="cta-primary" onClick={() => navigate('/pricing')}>Katso hinnat</button>
              <button className="cta-secondary" onClick={() => navigate('/contact')}>Ota yhteyttä</button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="features-footer">
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