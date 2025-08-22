import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SignIn from '../components/auth/SignIn'
import ForgotPassword from '../components/auth/ForgotPassword'
import MagicLink from '../components/auth/MagicLink'
import './AIDueDiligencePage.css'
import './BlogPage.css'
import SiteHeader from '../components/SiteHeader'

export default function AIDueDiligencePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [showMagicModal, setShowMagicModal] = useState(false)

  return (
    <>
      <PageMeta 
        title="Tekoäly Due Diligence – RascalAI.fi"
        description="Yhden tunnin veloitukseton kartoitus: missä tekoäly tuo nopeimmat ja suurimmat hyödyt myynnissä, markkinoinnissa, asiakaspalvelussa, tuotekehityksessä ja johtamisessa."
        image="/hero-v3.jpg"
      />

      <div className="ai-dd-page">
        {/* Header samaa brändiä */}
        <SiteHeader onOpenSignIn={() => setShowSignInModal(true)} />

        <main className="ai-dd-main">
          <section className="ai-dd-hero">
            <div className="ai-dd-hero-inner">
              <h1 className="ai-dd-title">Tekoäly Due Diligence</h1>
              <p className="ai-dd-subtitle">Veloitukseton 60 min kartoitus: missä tekoäly tuo nopeimmat ja suurimmat hyödyt – ilman hypeä ja hakuammuntaa.</p>
            </div>
          </section>

          <section className="ai-dd-section">
            <h2>Mikä se on?</h2>
            <p>RascalAI:n Tekoäly Due Diligence on yhden tunnin veloitukseton kartoitus, joka näyttää, missä tekoäly tuo teidän liiketoiminnassa nopeimmat ja suurimmat hyödyt. Se tunnistaa kriittiset kohdat myynnissä, markkinoinnissa, asiakaspalvelussa, tuotekehityksessä ja johtamisessa – ilman hypeä ja hakuammuntaa.</p>
          </section>

          <section className="ai-dd-section">
            <h2>Mitä ongelmaa se ratkaisee?</h2>
            <ul>
              <li>Poistaa arvailun: mihin tekoäly kannattaa viedä ensin</li>
              <li>Yhdistää hajanaiset kokeilut yhdeksi etenemissuunnitelmaksi</li>
              <li>Varmistaa, että AI-hankkeet kytkeytyvät KPI/OKR-mittareihin</li>
              <li>Ehkäisee turhat investoinnit ja riskit</li>
            </ul>
          </section>

          <section className="ai-dd-section">
            <h2>Mitä saat?</h2>
            <ol>
              <li>AI-Heatmap: selkeä kuva, missä tekoäly tuo eniten hyötyä</li>
              <li>Top 10 -mahdollisuutta: one-pager-kuvaus arvoista ja vaikutuksista</li>
              <li>90 päivän etenemissuunnitelma: konkreettiset seuraavat askeleet</li>
              <li>Data- ja riskiprofiili: GDPR, tietosuoja ja laadunvarmistus</li>
              <li>Koulutus- ja muutosmalli: miten tiimi saa AI:sta täyden hyödyn</li>
            </ol>
          </section>

          <section className="ai-dd-section">
            <h2>Miten se tehdään – 5 vaihetta</h2>
            <ol>
              <li>Align – kirkastetaan tavoitteet ja mittarit</li>
              <li>Map – kartoitetaan prosessit ja rutiinit</li>
              <li>Measure – arvioidaan nykytila ja datavalmius</li>
              <li>Prioritize – pisteytetään hyödyt, riskit ja toteutettavuus</li>
              <li>Plan – rakennetaan selkeä etenemissuunnitelma</li>
            </ol>
          </section>

          <section className="ai-dd-section">
            <h2>Hyödyt liiketoiminnalle</h2>
            <ul>
              <li>Myynti: nopeammat kaupat, parempi voittoprosentti</li>
              <li>Markkinointi: tarkempi kohdentaminen, parempi ROI</li>
              <li>Asiakaspalvelu: lyhyemmät vasteajat, tyytyväisemmät asiakkaat</li>
              <li>Tuotekehitys: ideasta markkinoille nopeammin</li>
              <li>Johtaminen: ajantasaiset raportit, parempi päätöksenteko</li>
            </ul>
          </section>

          <section className="ai-dd-section ai-dd-cta">
            <div className="ai-dd-cta-card">
              <h3>Aloitetaan veloituksettomalla 60 min kartoituksella</h3>
              <p>Varmistetaan, että tekoälystä tulee teille uusi tiimin jäsen, joka vauhdittaa kasvua ja tehostaa arkea.</p>
              <a 
                href="https://calendar.app.google/LiXrLDnPEGMb4eoS9" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Varaa kartoitus
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


