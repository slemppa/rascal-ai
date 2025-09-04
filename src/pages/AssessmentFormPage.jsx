import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageMeta from '../components/PageMeta'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import './AssessmentFormPage.css'
import SiteHeader from '../components/SiteHeader'

export default function AssessmentFormPage() {
  const { t } = useTranslation('common')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  return (
    <>
      <PageMeta 
        title="Assessment Form - RascalAI"
        description="Fill out the assessment form to book your free AI due diligence session."
        image="/hero-v3.jpg"
      />

      <div className="assessment-form-page">
        <SiteHeader onOpenSignIn={() => setShowSignInModal(true)} />

        <main className="assessment-form-main">
          <div className="form-container">
            <iframe 
              src="https://tangible-virgo-5f2.notion.site/ebd/264fa34d5afa809ca7ece124ea117948" 
              width="100%" 
              height="100vh" 
              frameBorder="0" 
              allowFullScreen
              title="Assessment Form"
              className="notion-form"
            />
          </div>
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
