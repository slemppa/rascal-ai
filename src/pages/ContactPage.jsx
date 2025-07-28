import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import MagicLink from '../components/auth/MagicLink'
import PageMeta from '../components/PageMeta'
import './ContactPage.css'

const contactInfo = [
  {
    title: 'Sähköposti',
    value: 'info@rascal-ai.fi',
    icon: '📧',
    description: 'Vastaanotamme viestejä 24/7'
  },
  {
    title: 'Puhelin',
    value: '+358 50 123 4567',
    icon: '📞',
    description: 'Ma-Pe 9:00-17:00'
  },
  {
    title: 'Toimisto',
    value: 'Helsinki, Suomi',
    icon: '🏢',
    description: 'Vierailut sopimuksen mukaan'
  },
  {
    title: 'Support',
    value: 'support@rascal-ai.fi',
    icon: '🛠️',
    description: 'Tekninen tuki'
  }
]

const faqItems = [
  {
    question: 'Miten voin aloittaa Rascal AI:n käytön?',
    answer: 'Voit aloittaa ilmaisella 14 päivän kokeilujaksolla. Rekisteröidy sivustollamme ja aloita heti.'
  },
  {
    question: 'Mitä maksutapoja hyväksytte?',
    answer: 'Hyväksymme kaikki yleisimmät luottokortit (Visa, Mastercard, American Express) ja PayPal-maksut.'
  },
  {
    question: 'Onko tuki saatavilla?',
    answer: 'Kyllä! Kaikki suunnitelmamme sisältävät email-tuen. Pro ja Enterprise -suunnitelmista saat prioriteettitukea.'
  },
  {
    question: 'Voinko peruuttaa tilaukseni?',
    answer: 'Kyllä, voit peruuttaa tilauksesi milloin tahansa. Tietosi säilyvät 30 päivää peruutuksen jälkeen.'
  }
]

export default function ContactPage() {
  const navigate = useNavigate()
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [showMagicModal, setShowMagicModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // ESC-näppäimen kuuntelu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showMagicModal) {
          setShowMagicModal(false)
        } else if (showForgotModal) {
          setShowForgotModal(false)
        } else if (showSignInModal) {
          setShowSignInModal(false)
        }
      }
    }

    if (showSignInModal || showForgotModal || showMagicModal) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showSignInModal, showForgotModal, showMagicModal])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simuloidaan lomakkeen lähetystä
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitSuccess(true)
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
      })
      
      // Piilota success-viesti 5 sekunnin jälkeen
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
    }, 2000)
  }

  return (
    <>
      <PageMeta 
        title="Yhteystiedot - Rascal AI"
        description="Ota yhteyttä Rascal AI:hin. Olemme täällä auttamassa sinua markkinointisi automatisoinnissa."
        image="/hero.png"
      />
      
      <div className="contact-page">
        {/* Header */}
        <header className="contact-header">
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
                onMagicLinkClick={() => { setShowSignInModal(false); setShowMagicModal(true); }}
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
        {showMagicModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <MagicLink onClose={() => { setShowMagicModal(false); setShowSignInModal(true); }} />
            </div>
          </div>
        )}

        <div className="contact-content">
          {/* Hero Section */}
          <section className="contact-hero">
            <h1>Ota yhteyttä</h1>
            <p>Olemme täällä auttamassa sinua markkinointisi automatisoinnissa. Kysy mitä tahansa tai pyydä demo.</p>
          </section>

          {/* Contact Form and Info */}
          <section className="contact-main">
            <div className="contact-form-section">
              <h2>Lähetä viesti</h2>
              {submitSuccess && (
                <div className="success-message">
                  Kiitos viestistäsi! Otamme sinuun yhteyttä pian.
                </div>
              )}
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Nimi *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Sähköposti *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="company">Yritys</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Aihe *</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Valitse aihe</option>
                      <option value="demo">Pyydä demo</option>
                      <option value="pricing">Hintaesittely</option>
                      <option value="support">Tekninen tuki</option>
                      <option value="partnership">Kumppanuus</option>
                      <option value="other">Muu</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Viesti *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="6"
                    required
                    placeholder="Kerro lisää tarpeistasi..."
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Lähetetään...' : 'Lähetä viesti'}
                </button>
              </form>
            </div>

            <div className="contact-info-section">
              <h2>Yhteystiedot</h2>
              <div className="contact-info-grid">
                {contactInfo.map((info, index) => (
                  <div key={index} className="contact-info-card">
                    <div className="contact-icon">{info.icon}</div>
                    <h3>{info.title}</h3>
                    <div className="contact-value">{info.value}</div>
                    <p className="contact-description">{info.description}</p>
                  </div>
                ))}
              </div>

              <div className="contact-cta">
                <h3>Haluatko nähdä Rascal AI:n toiminnassa?</h3>
                <p>Varaa aika demo-keskusteluun ja näe miten voimme auttaa sinua.</p>
                <button className="demo-button" onClick={() => navigate('/pricing')}>
                  Pyydä demo
                </button>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="contact-faq">
            <h2>Usein kysytyt kysymykset</h2>
            <div className="faq-grid">
              {faqItems.map((item, index) => (
                <div key={index} className="faq-item">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="contact-footer">
          <div className="footer-content">
            <div className="footer-logo">
              <img src="/favicon.png" alt="Rascal AI logo" />
              <span>Rascal AI</span>
            </div>
            <div className="footer-links">
              <a href="/features">Ominaisuudet</a>
              <a href="/pricing">Hinnat</a>
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