import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import './AIDueDiligencePage.css'
import './BlogPage.css'
import SiteHeader from '../components/SiteHeader'

export default function AIDueDiligencePage() {
  const { t } = useTranslation('common')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  return (
    <>
      <PageMeta 
        title={t('aiDD.meta.title')}
        description={t('aiDD.meta.description')}
        image="/hero-v3.jpg"
      />

      <div className="ai-dd-page">
        {/* Header samaa brändiä */}
        <SiteHeader onOpenSignIn={() => setShowSignInModal(true)} />

        <main className="ai-dd-main">
          <section className="ai-dd-hero">
            <div className="ai-dd-hero-inner">
              <h1 className="ai-dd-title">{t('aiDD.hero.title')}</h1>
              <p className="ai-dd-subtitle">{t('aiDD.hero.subtitle')}</p>
            </div>
          </section>

          <section className="ai-dd-section">
            <h2>{t('aiDD.sections.whatIs.title')}</h2>
            <p>{t('aiDD.sections.whatIs.p')}</p>
          </section>

          <section className="ai-dd-section">
            <h2>{t('aiDD.sections.problem.title')}</h2>
            <ul>
              {t('aiDD.sections.problem.items', { returnObjects: true }).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="ai-dd-section">
            <h2>{t('aiDD.sections.deliverables.title')}</h2>
            <ol>
              {t('aiDD.sections.deliverables.items', { returnObjects: true }).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
          </section>

          <section className="ai-dd-section">
            <h2>{t('aiDD.sections.process.title')}</h2>
            <ol>
              {t('aiDD.sections.process.items', { returnObjects: true }).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
          </section>

          <section className="ai-dd-section">
            <h2>{t('aiDD.sections.benefits.title')}</h2>
            <ul>
              {t('aiDD.sections.benefits.items', { returnObjects: true }).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </section>


          <section className="ai-dd-section ai-dd-cta">
            <div className="ai-dd-cta-card">
              <h3>{t('aiDD.cta.title')}</h3>
              <p>{t('aiDD.cta.body')}</p>
              <a 
                href="https://calendar.app.google/LiXrLDnPEGMb4eoS9" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
                onClick={() => {
                  // Google Analytics event tracking
                  if (typeof gtag !== 'undefined') {
                    gtag('event', 'conversion', {
                      'event_category': 'booking',
                      'event_label': 'ai_due_diligence_booking',
                      'value': 1
                    });
                  }
                }}
              >
                {t('aiDD.cta.button')}
              </a>
            </div>
          </section>
        </main>
      </div>

      {showSignInModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) setShowSignInModal(false) }}>
          <div className="modal-container">
            <SignIn 
              onClose={() => setShowSignInModal(false)}
              onForgotClick={() => { setShowSignInModal(false); setShowForgotModal(true) }}
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
    </>
  )
}


