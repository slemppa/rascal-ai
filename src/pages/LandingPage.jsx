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

  useEffect(() => {
    if (location.state?.showLogoutMessage) {
      // Optionally surface a toast here; keeping behavior minimal
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, navigate, location.pathname])

  // Testimonials carousel behavior from v4
  useEffect(() => {
    const root = document.querySelector('[data-carousel]')
    if (!root) return
    const track = root.querySelector('[data-track]')
    const prev = root.querySelector('[data-prev]')
    const next = root.querySelector('[data-next]')
    const dots = root.querySelector('[data-dots]')
    const slides = Array.from(track.children)
    let index = 0
    let autoplayId = null
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function updateDots(){
      if(!dots) return
      dots.innerHTML = ''
      slides.forEach((_, i) => {
        const b = document.createElement('button')
        b.setAttribute('aria-label', `Siirry kohtaan ${i+1}`)
        if(i === index) b.classList.add('active')
        b.addEventListener('click', () => { index = i; scrollToIndex(); restartAutoplay(); })
        dots.appendChild(b)
      })
    }
    function updateButtons(){
      if(prev) prev.disabled = index === 0
      if(next) next.disabled = index === slides.length - 1
    }
    function scrollToIndex(){
      const slide = slides[index]
      const trackRect = track.getBoundingClientRect()
      const slideRect = slide.getBoundingClientRect()
      const delta = (slideRect.left - trackRect.left) - (trackRect.width/2 - slideRect.width/2)
      track.scrollTo({ left: track.scrollLeft + delta, behavior: 'smooth' })
      updateDots(); updateButtons()
    }
    function stopAutoplay(){ if(autoplayId) { clearInterval(autoplayId); autoplayId = null } }
    function autoplay(){ if(prefersReduced) return; stopAutoplay(); autoplayId = setInterval(() => { index = (index + 1) % slides.length; scrollToIndex() }, 3500) }

    prev?.addEventListener('click', () => { index = Math.max(0, index - 1); scrollToIndex(); restartAutoplay() })
    next?.addEventListener('click', () => { index = Math.min(slides.length - 1, index + 1); scrollToIndex(); restartAutoplay() })
    function restartAutoplay(){ stopAutoplay(); autoplay() }
    const onScroll = () => {
      const centers = slides.map(slide => Math.abs(slide.getBoundingClientRect().left + slide.offsetWidth/2 - (track.getBoundingClientRect().left + track.offsetWidth/2)))
      index = centers.indexOf(Math.min.apply(null, centers))
      updateDots(); updateButtons()
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    updateDots(); updateButtons(); autoplay()
    return () => { stopAutoplay(); track.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <>
      <PageMeta title="RascalAI.fi – Myyjän paras työpari" description="Rascal AI vapauttaa myyjien ajan rutiineista ja valmistelusta, jotta voit keskittyä voittaviin asiakaskohtaamisiin." image="/hero-v2.jpeg" />

      {/* V4 styles inline to ensure visual parity */}
      <style>{`
        :root{--bg:#1A2B4C;--surface:#F5F5F5;--panel:#FFFFFF;--text:#E7ECF3;--text-dark:#333333;--muted:#8FA3BF;--brand:#FF6A00;--brand-strong:#FF6A00;--accent:#FF6A00;--violet:#2D2F5E;--warning:#F0A544;--radius:14px;--gap:16px;--maxw:1200px}
        *{box-sizing:border-box}html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;overflow-x:hidden}
        a{color:var(--brand);text-decoration:none}a:hover{color:#E55E00;text-decoration:underline}
        .page{max-width:100%;margin:0 auto;padding:8px 0 16px;background:var(--bg)}
        header.topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 16px;margin-bottom:0;min-height:56px;backdrop-filter:saturate(140%) blur(8px);background:rgba(26,43,76,.35);border-bottom:1px solid rgba(255,255,255,.08)}
        .logo{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.2px;font-family:Poppins,Inter,sans-serif}.logo img{width:28px;height:28px;display:block}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:8px 12px;border-radius:12px;border:1px solid #E5E7EB;background:var(--panel);color:var(--text-dark);font-weight:600;transition:transform .1s,background .2s,border-color .2s,box-shadow .2s;white-space:nowrap;font-family:Poppins,Inter,sans-serif}
        .btn{border-radius:999px}.btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.12)}.btn.primary{background:var(--brand);color:#fff;border-color:var(--brand)}.btn.primary:hover{background:#E55E00;border-color:#E55E00}.btn.ghost{border-color:rgba(255,255,255,.35);background:transparent;color:#fff}
        .grid{display:grid;grid-template-columns:repeat(12,1fr);gap:var(--gap)}.panel{background:var(--panel);color:var(--text-dark);border:1px solid #E5E7EB;border-radius:var(--radius);padding:20px;box-shadow:0 10px 24px rgba(0,0,0,.08)}
        .subtle{color:var(--muted)}p{color:var(--text)}p.subtle{color:rgba(231,236,243,.82)}.panel p{color:var(--text-dark)}.panel p.subtle{color:#4B5563}.hero .subtle{color:rgba(255,255,255,.92)}
        h1,h2,h3{margin:0 0 10px;line-height:1.2;font-family:'Playfair Display',Georgia,serif;color:inherit}h1{font-size:clamp(28px,4vw,44px)}h2{font-size:clamp(22px,3vw,28px)}
        .hero{grid-column:1 / -1;display:block;padding:80px 0;min-height:72vh;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.55)),radial-gradient(900px 500px at 20% 60%,rgba(116,27,168,.28),transparent 60%),url('/hero-v2.jpeg') center/cover no-repeat,var(--bg);position:relative}
        .hero-title{font-size:clamp(34px,6vw,56px)}.hero-copy{grid-column:1 / span 8;display:grid;gap:18px;align-content:center;justify-items:start;text-shadow:0 2px 18px rgba(0,0,0,.5);max-width:720px}
        .hero-cta{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}.hero-inner{max-width:var(--maxw);margin:0 auto;width:100%;display:grid;grid-template-columns:repeat(12,1fr);gap:var(--gap);padding:0 20px}
        .section{grid-column:1 / -1;max-width:var(--maxw);margin:0 auto;padding:64px 20px}.section.fullbleed{max-width:none;width:100vw;margin-left:calc(50% - 50vw);padding-left:20px;padding-right:20px}.section.fullbleed::before{display:none}
        .hero.section{max-width:none;padding-left:0;padding-right:0;width:100vw;margin-left:calc(50% - 50vw)}
        .section-header{grid-column:1 / -1;max-width:var(--maxw);margin:0 auto 12px;display:grid;gap:6px}.eyebrow{display:inline-block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.7);background:rgba(255,255,255,.08);padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.14);width:fit-content;font-family:Poppins,Inter,sans-serif}
        .section-title{font-size:clamp(22px,3.2vw,36px);font-family:'Playfair Display',Georgia,serif;color:#fff}
        .features{display:grid;grid-template-columns:repeat(12,1fr);gap:var(--gap)}.feature{grid-column:span 4;transition:transform .12s,box-shadow .2s}.feature.panel{display:grid;gap:6px;align-content:start;justify-content:start;place-content:start;align-items:start;justify-items:start;place-items:start;min-height:160px}
        .steps-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:var(--gap)}.step{grid-column:span 4}
        .kpi-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:var(--gap);align-items:stretch}.kpi{grid-column:span 3;text-align:center}
        .triple-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:var(--gap)}.triple{grid-column:span 4}
        .logos-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:var(--gap);align-items:center}.logo-box{grid-column:span 2;height:40px;border:1px solid #E5E7EB;border-radius:10px;background:var(--panel)}
        .carousel{position:relative;overflow:hidden;border-radius:var(--radius);background:var(--panel);padding:40px 20px}
        .carousel-track{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-ms-overflow-style:none}
        .carousel-track::-webkit-scrollbar{display:none}
        .testimonial-card{flex:0 0 100%;scroll-snap-align:start;display:grid;gap:16px;text-align:center;min-height:200px;align-content:center}
        .testimonial-card .quote{font-size:clamp(18px,2.5vw,24px);font-family:'Playfair Display',Georgia,serif;color:var(--text-dark);line-height:1.4}
        .testimonial-card .helper{color:var(--muted);font-size:14px;font-weight:500}
        .carousel-btn{position:absolute;top:50%;transform:translateY(-50%);background:var(--panel);border:1px solid #E5E7EB;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;z-index:10}
        .carousel-btn:hover{background:var(--brand);color:#fff;border-color:var(--brand)}
        .carousel-btn:disabled{opacity:.5;cursor:not-allowed}
        .carousel-btn.prev{left:20px}
        .carousel-btn.next{right:20px}
        .carousel-dots{display:flex;gap:8px;justify-content:center;margin-top:20px}
        .carousel-dots button{width:8px;height:8px;border-radius:50%;border:none;background:rgba(0,0,0,.2);cursor:pointer;transition:background .2s}
        .carousel-dots button.active{background:var(--brand)}
        footer{margin-top:32px;padding-top:16px;border-top:1px solid rgba(255,255,255,.18);color:var(--muted);font-size:13px}
      `}</style>

      <div className="page">
        <header className="topbar" aria-label="Ylätunniste">
          <div className="logo">
            <img src="/favicon.png" alt="Rascal AI" width="28" height="28" />
            <span>Rascal AI</span>
          </div>
          <nav className="cta-top" aria-label="Pikalinkit">
            <a className="btn ghost" href="#cta">Varaa demo</a>
            <a className="btn" href="#contact">Ota yhteyttä</a>
            <button className="btn primary" onClick={() => setShowSignInModal(true)} aria-label="Kirjaudu sisään">Kirjaudu</button>
          </nav>
      </header>

        <main className="grid" role="main">
          <section className="hero section" aria-labelledby="hero-title">
            <div className="hero-inner">
              <div className="hero-copy">
                <span className="badge">Myyjän paras työpari</span>
                <h1 id="hero-title" className="hero-title">Jos myyjäsi tekevät vielä kaiken itse, teet ison virheen.</h1>
                <p className="subtle">Me elämme aikaa, jossa kilpailu asiakkaiden ajasta on brutaalia. Ja silti – suurin osa myyjistä hukkaa tuntikausia valmisteluun, sisällön tuottamiseen ja hallinnollisiin rutiineihin.</p>
                <p className="subtle">Tämä on kallista – ei siksi, että rutiinit vievät aikaa, vaan koska ne vievät pois asiakaskohtaamisista, joissa syntyy liikevaihto ja asiakassuhteet vahvistuvat.</p>
                <div className="hero-cta">
                  <a className="btn primary" href="#cta">Varaa demo</a>
                  <a className="btn ghost" href="#how">Katso, miten Rascal AI toimii</a>
                  <button className="btn" onClick={() => setShowSignInModal(true)}>Kirjaudu</button>
                </div>
              </div>
            </div>
          </section>

          {/* Miksi */}
          <section className="section why-split" id="why" aria-labelledby="why-title">
            <div className="why-grid">
              <div className="why-left">
                <div className="section-header">
                  <span className="eyebrow">Miksi</span>
                  <h2 id="why-title" className="section-title">Miksi Rascal AI?</h2>
                  <p className="section-subtitle">Poista rutiinit, vapauta myyjät kohtaamisiin ja nosta tulokset uudelle tasolle.</p>
                </div>
              </div>
              <div className="why-right panel" role="region" aria-label="Perustelut">
                <p className="subtle">Rascal Company syntyi yhdestä kysymyksestä: Mitä tapahtuisi, jos myyjäsi käyttäisivät 30–50 % enemmän ajasta asiakkaiden kanssa – jo ensi kuussa?</p>
                <p className="subtle">Ratkaisumme on Rascal AI – myyjän ja markkinoinnin paras työpari.</p>
              </div>
            </div>
          </section>

          {/* Mitä tekee */}
          <section className="section fullbleed band-dark vector-grid vector-fade" id="how" aria-labelledby="how-title" style={{ paddingTop: 20 }}>
            <div className="section-header">
              <span className="eyebrow">Kyvykkyydet</span>
              <h2 id="how-title" className="section-title">Mitä Rascal AI tekee?</h2>
              <p className="section-subtitle">Se tekee sen, mitä ihmisen ei kannata – ja vielä enemmän:</p>
            </div>
            <div className="features">
              <div className="feature panel"><h3>Rakentaa sisältöstrategian ihanneasiakasprofiilin mukaisesti</h3></div>
              <div className="feature panel"><h3>Laatii kuukausittaiset markkinointisisältöehdotukset eri somekanaviin, uutiskirjeisiin, blogeihin ja sähköpostisuoriin</h3></div>
              <div className="feature panel"><h3>Tekee outbound- ja inbound-soitot sovitun soittoskriptin mukaisesti, ohjaten keskustelua asiakkaan vastaukset huomioiden</h3></div>
              <div className="feature panel"><h3>Oppii jatkuvasti julkaistuista sisällöistä ja toteutetuista toimenpiteistä</h3></div>
              <div className="feature panel"><h3>Raportoi automaattisesti kaikki puhelut, keskustelut ja sovitut jatkotoimenpiteet</h3></div>
              <div className="feature panel"><h3>Toimii myyjien henkilökohtaisena sparraajana kaikessa myyntiin ja markkinointiin liittyvässä</h3></div>
            </div>
          </section>

          {/* Prosessi */}
          <section className="section fullbleed band-violet vector-grid" aria-labelledby="steps-title">
            <div className="section-header">
              <span className="eyebrow">Prosessi</span>
              <h2 id="steps-title" className="section-title">Miten se toimii käytännössä</h2>
              <p className="section-subtitle">Käynnistämme nopeasti ja viemme tuloksiin asteittain.</p>
            </div>
            <div className="steps-grid">
              <div className="step panel"><div className="step-num">Vaihe 1</div><div className="step-title">Käynnistyssessio</div><p className="subtle">Tavoitteet, ICP ja toistuvat rutiinit. Sovitaan skriptit ja sisällön suunta.</p></div>
              <div className="step panel"><div className="step-num">Vaihe 2</div><div className="step-title">Kytkennät ja oppi</div><p className="subtle">Kalenteri, sähköposti ja materiaalit. AI oppii brändisi ja prosessisi.</p></div>
              <div className="step panel"><div className="step-num">Vaihe 3</div><div className="step-title">Live ja kehittäminen</div><p className="subtle">Käyttöönotto, mittarit ja jatkuva parannus – viikoittain läpinäkyvästi.</p></div>
            </div>
          </section>

          {/* Integraatiot */}
          <section className="section fullbleed band-dark vector-grid" aria-labelledby="brain-title">
            <div className="section-header">
              <span className="eyebrow">Kyvykkyydet</span>
              <h2 id="brain-title" className="section-title">Älykkäät integraatiot</h2>
              <p className="section-subtitle">Web, materiaalit ja brändi – tieto mukana joka hetki.</p>
            </div>
            <div className="triple-grid">
              <div className="triple panel"><h3>Hedra</h3><p className="subtle">Videotuotanto ja avatarit nopeaan demotuotantoon sekä personoituihin videoihin.</p></div>
              <div className="triple panel"><h3>ElevenLabs</h3><p className="subtle">Luonnollinen puhesynteesi ja äänet eri kielillä ja äänensävytarkkuudella.</p></div>
              <div className="triple panel"><h3>Leonardo</h3><p className="subtle">Generatiiviset kuvat, kuvitus ja variaatiot markkinointi- ja somekäyttöön.</p></div>
              <div className="triple panel"><h3>OpenAI</h3><p className="subtle">LLM-äly: sisältöjen tuotanto, päättely ja työnkulut – räätälöity liiketoimintatarpeisiin.</p></div>
            </div>
          </section>

          {/* CTA + Yhteystiedot */}
          <section className="section" aria-label="Yhteydenotto ja demo">
            <div className="cta-contact-grid">
              <div className="panel cta-block" id="cta" aria-labelledby="cta-title">
                <h2 id="cta-title">📅 Varaa 30 minuuttia</h2>
                <p className="subtle">Näytämme, miten Rascal AI vapauttaa myyjäsi parhaaseen työhönsä ja nostaa tulokset uudelle tasolle.</p>
                <div className="hero-cta">
                  <button className="btn primary" onClick={() => setShowSignInModal(true)}>Varaa 30 min demo</button>
                  <a className="btn ghost" href="#testimonials">Lue asiakastarinat</a>
                </div>
              </div>
              <div className="panel contact-block" id="contact" aria-labelledby="contact-title">
                <h2 id="contact-title">Ota yhteyttä</h2>
                <p className="subtle">Tarvitsetko lisätietoa tai haluatko keskustella tarkemmin?</p>
                <p>
                  <a href="mailto:info@rascalai.fi" className="linklike">info@rascalai.fi</a><br/>
                  <a href="tel:+358454905548" className="linklike">+358 45 490 5548</a>
                </p>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="section" aria-labelledby="testimonials-title">
            <h2 id="testimonials-title" style={{ textAlign:'center' }}>Asiakkaat kertovat</h2>
            <div className="carousel modern" data-carousel id="testimonials">
              <button className="carousel-btn prev" aria-label="Edellinen" data-prev>‹</button>
              <div className="carousel-track" data-track>
                <article className="testimonial-card" role="group" aria-roledescription="slide" aria-label="1 / 3">
                  <div className="quote">“Rascal AI vapautti kalenterista tuntikausia – vihdoin aikaa asiakkaille.”</div>
                  <div className="helper">— Head of Sales, FI</div>
                </article>
                <article className="testimonial-card" role="group" aria-roledescription="slide" aria-label="2 / 3">
                  <div className="quote">“Laadukkaammat liidit ja selkeämmät ehdotukset – tiimin fiilis on korkealla.”</div>
                  <div className="helper">— Commercial Lead, SE</div>
                </article>
                <article className="testimonial-card" role="group" aria-roledescription="slide" aria-label="3 / 3">
                  <div className="quote">“Onboarding oli nopea ja tulokset näkyivät ensimmäisen kuukauden aikana.”</div>
                  <div className="helper">— VP Sales, DE</div>
                </article>
              </div>
              <button className="carousel-btn next" aria-label="Seuraava" data-next>›</button>
              <div className="carousel-dots" role="tablist" aria-label="Karusellin sivut" data-dots></div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer role="contentinfo">
          <div className="footer-grid">
            <div className="footer-left">© 2025 Rascal AI · Rascal Company - More than meets the eye</div>
            <div className="footer-right">
              <a href="#privacy">Tietosuojaseloste</a>
              <a href="#terms">Käyttöehdot</a>
              <a href="https://www.linkedin.com" rel="noopener" target="_blank">LinkedIn</a>
            </div>
          </div>
        </footer>
        </div>

      {/* Modals */}
      {showSignInModal && (
        <div className="modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) setShowSignInModal(false) }}>
          <div className="modal-container auth-modal">
            <SignIn onClose={() => setShowSignInModal(false)} onForgotClick={()=>{ setShowSignInModal(false); setShowForgotModal(true) }} onMagicLinkClick={()=>{ setShowSignInModal(false); setShowMagicModal(true) }} />
          </div>
        </div>
      )}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-container auth-modal">
            <ForgotPassword onClose={() => { setShowForgotModal(false); setShowSignInModal(true) }} />
          </div>
        </div>
      )}
      {showMagicModal && (
        <div className="modal-overlay">
          <div className="modal-container auth-modal">
            <MagicLink onClose={() => { setShowMagicModal(false); setShowSignInModal(true) }} />
          </div>
        </div>
      )}
    </>
  )
} 