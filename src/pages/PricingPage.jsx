import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import PageMeta from '../components/PageMeta'
import './PricingPage.css'

const pricingPlans = [
  {
    name: 'Rascal AI',
    startPrice: '5000 + alv',
    monthlyPrice: '300 + alv',
    callPrice: '0.11',
    messagePrice: '0,08',
    description: 'Yksinkertainen ja selkeä hinnoittelu',
    features: [
      'AI-puhelinmarkkinointi (2 ääntä)',
      'Sisältöstrategiat ja kalenteri',
      'Dashboard-näkymä',
      'Email-uutiskirjeet',
      'Sosiaalisen median hallinta',
      'Perus-analytiikka',
      'Email-tuki',
      'Puhelut veloitetaan per minuutti'
    ],
    cta: 'Aloita nyt',
    popular: true
  }
]

const faqItems = [
  {
    question: 'Mikä on starttihinta?',
    answer: 'Starttihinta 99€ sisältää alustan käyttöönoton, konfiguroinnin ja peruskoulutuksen. Tämä on kertamaksu.'
  },
  {
    question: 'Miten puhelumaksut toimivat?',
    answer: 'Puhelut veloitetaan per soitettu minuutti (0,50€/min). Maksat vain todellisesta käytöstä.'
  },
  {
    question: 'Onko kuukausimaksu pakollinen?',
    answer: 'Kyllä, 49€/kk kuukausimaksu sisältää alustan käytön, päivitykset ja tuen.'
  },
  {
    question: 'Mitä maksutapoja hyväksytte?',
    answer: 'Hyväksymme kaikki yleisimmät luottokortit (Visa, Mastercard, American Express) ja PayPal-maksut.'
  },
  {
    question: 'Onko sopimuksia?',
    answer: 'Ei! Voit peruuttaa milloin tahansa. Kuukausimaksu perutaan seuraavalla laskutusjaksolla.'
  },
  {
    question: 'Miten laskutus toimii?',
    answer: 'Starttihinta laskutetaan heti, kuukausimaksu kuukausittain etukäteen ja puhelumaksut kuukauden lopussa.'
  }
]

export default function PricingPage() {
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
        title="Hinnat - Rascal AI"
        description="Selkeät ja kilpailukykyiset hinnat Rascal AI:lle. Aloita ilmaiseksi ja valitse sopiva suunnitelma liiketoimintasi tarpeisiin."
        image="/hero.png"
      />
      
      <div className="pricing-page">
        {/* Header */}
        <header className="pricing-header">
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
          <div className="modal-overlay">
            <div className="modal-container">
              <ForgotPassword onClose={() => { setShowForgotModal(false); setShowSignInModal(true); }} />
            </div>
          </div>
        )}

        <div className="pricing-content">
          {/* Hero Section */}
          <section className="pricing-hero">
            <h1>Selkeät hinnat, ei yllätyksiä</h1>
            <p>Yksinkertainen hinnoittelu: starttihinta + kuukausimaksu + puhelumaksut per minuutti.</p>
          </section>

          {/* Pricing Cards */}
          <section className="pricing-cards">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="popular-badge">Suosituin</div>}
                
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <div className="pricing-structure">
                    <div className="start-price">
                      <span className="price-label">Starttihinta</span>
                      <div className="price">
                        <span className="currency">€</span>
                        <span className="amount">{plan.startPrice}</span>
                        <span className="period">kertamaksu</span>
                      </div>
                    </div>
                    <div className="monthly-price">
                      <span className="price-label">Kuukausimaksu</span>
                      <div className="price">
                        <span className="currency">€</span>
                        <span className="amount">{plan.monthlyPrice}</span>
                        <span className="period">/kk</span>
                      </div>
                    </div>
                    <div className="call-price">
                      <span className="price-label">Puhelumaksut</span>
                      <div className="price">
                        <span className="currency">€</span>
                        <span className="amount">{plan.callPrice}</span>
                        <span className="period">/min</span>
                      </div>
                    </div>
                    <div className="message-price">
                      <span className="price-label">Viestimaksut</span>
                      <div className="price">
                        <span className="currency">€</span>
                        <span className="amount">{plan.messagePrice}</span>
                        <span className="period">/viesti</span>
                      </div>
                    </div>
                  </div>
                  <p className="description">{plan.description}</p>
                </div>

                <ul className="features">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex}>
                      <span className="checkmark">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button className={`cta-button ${plan.popular ? 'primary' : 'secondary'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </section>

          {/* FAQ Section */}
          <section className="faq-section">
            <h2>Usein kysytyt kysymykset</h2>
            <div className="faq-items">
              {faqItems.map((item, index) => (
                <div key={index} className="faq-item">
                  <div className="faq-question">
                    <span>{item.question}</span>
                    <button className="faq-toggle">+</button>
                  </div>
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
            <h2>Valmis aloittamaan?</h2>
            <p>Aloita Rascal AI:n kanssa ja koe tekoälyn voima omassa liiketoiminnassasi.</p>
            <button className="cta-button" onClick={() => navigate('/contact')}>Ota yhteyttä</button>
          </section>
        </div>

        {/* Footer */}
        <footer className="pricing-footer">
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