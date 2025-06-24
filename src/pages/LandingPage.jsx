import React from 'react'
import { useNavigate } from 'react-router-dom'

const placeholderImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80',
]

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <div style={{minHeight: '100vh', minWidth: '100vw', background: 'var(--brand-dark)', display: 'flex', flexDirection: 'column'}}>
      {/* Ylänavigaatio */}
      <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 6vw 0 6vw'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          {/* Logo tai pelkkä nimi */}
          <div style={{width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, color: 'var(--brand-black)'}}>R</div>
          <span style={{color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: 1}}>Rascal AI</span>
        </div>
        <button onClick={() => navigate('/login')} style={{padding: '12px 32px', fontSize: 18, borderRadius: 8, background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Kirjaudu sisään</button>
      </div>
      {/* Hero-osio: vasemmalla tekstit ja laatikko allekkain, oikealla iso kuva */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '0 6vw', gap: 32, marginTop: 8}}>
        {/* Vasemmalla: tekstit ja laatikko allekkain */}
        <div style={{maxWidth: 520, color: '#fff', textAlign: 'left', flex: 1, display: 'flex', flexDirection: 'column', gap: 24}}>
          <h1 style={{fontSize: 36, fontWeight: 800, marginBottom: 0}}>Näe markkinointisi yhdellä silmäyksellä 🧠</h1>
          <p style={{fontSize: 20, fontWeight: 500, marginBottom: 0}}>
            Rascal AI Dashboard kokoaa kaiken olennaisen yhteen näkymään – julkaisut, uutiskirjeet, tilaajat ja seuraavan sisällön aikataulun. Reaaliaikaisesti ja ilman taulukkohelvettiä.
          </p>
          <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: '100%', minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Haluatko nähdä miten se toimii käytännössä?</div>
            <div style={{fontSize: 15, marginBottom: 12}}>
              👉 Pyydä demoa tai testaa itse.<br/>
              Dashboard voidaan räätälöidä juuri sinun yrityksesi tarpeisiin.
            </div>
            <div style={{display: 'flex', gap: 12, marginTop: 8}}>
              <button style={{padding: '10px 20px', fontSize: 16, borderRadius: 8, background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Ota yhteyttä</button>
              <button style={{padding: '10px 20px', fontSize: 16, borderRadius: 8, background: '#fff', color: 'var(--brand-dark)', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Katso esittely</button>
            </div>
          </div>
        </div>
        {/* Oikealla: iso kuva */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 320, height: 400, borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 24px rgba(0,0,0,0.22)', background: '#222'}}>
            <img src={placeholderImages[0]} alt="placeholder" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        </div>
      </div>
      {/* Kaikki laatikot riviin, mukaan lukien laatikko 6 */}
      <div style={{display: 'flex', flexDirection: 'row', gap: 24, justifyContent: 'center', margin: '24px 0 0 0', flexWrap: 'wrap', paddingBottom: 64}}>
        {/* Laatikko 1 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Säästä aikaa. Pysy kartalla. Tee parempia päätöksiä.</div>
          <div style={{fontSize: 16, marginBottom: 12}}>Rascal AI Dashboard on sinulle, jos:</div>
          <ul style={{textAlign: 'left', fontSize: 15, margin: 0, lineHeight: 1.7}}>
            <li>✅ Olet kyllästynyt etsimään tietoja eri työkaluista</li>
            <li>✅ Haluat nähdä yhdellä silmäyksellä missä mennään</li>
            <li>✅ Tarvitset helpon tavan seurata markkinointisi tilaa ilman exceleitä</li>
            <li>✅ Arvostat selkeyttä ja visuaalisuutta</li>
          </ul>
        </div>
        {/* Laatikko 2 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Mitä näet dashboardilla?</div>
          <ul style={{textAlign: 'left', fontSize: 15, margin: 0, lineHeight: 1.7}}>
            <li>🔸 Tulevat julkaisut – Mikä on työn alla ja milloin se julkaistaan</li>
            <li>🔸 Uutiskirjeet & sähköpostit – Montako avasi? Kuka klikkasi?</li>
            <li>🔸 Tilaajien kasvu – Seuranta yhdellä silmäyksellä</li>
            <li>🔸 Sisällöntuotannon sykli – Milloin seuraava juttu tulee ulos?</li>
          </ul>
        </div>
        {/* Laatikko 3 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Kenelle tämä on tehty?</div>
          <div style={{fontSize: 15, marginBottom: 8}}>
            🎯 Yrittäjille, markkinoijille ja sisällöntuottajille, jotka haluavat nopeasti ymmärtää markkinointinsa tilan – ilman ylimääräistä säätöä.<br/>
            Ei koodia. Ei integraatiostressiä. Kaikki valmiina.
          </div>
        </div>
        {/* Laatikko 4 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Miltä se näyttää?</div>
          <div style={{fontSize: 15, marginBottom: 8}}>
            Moderni ja mobiiliystävällinen käyttöliittymä näyttää asiat selkeästi. Pystyt käyttämään sitä tietokoneella, tabletilla tai puhelimella. Ei kikkailua – vain faktat, visuaalisesti.
          </div>
        </div>
        {/* Laatikko 5 */}
        <div style={{background: '#23272f', borderRadius: 16, padding: '28px 32px', color: '#fff', fontWeight: 500, fontSize: 17, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', width: 320, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700, fontSize: 18, marginBottom: 12}}>Miksi valita Rascal AI Dashboard?</div>
          <ul style={{textAlign: 'left', fontSize: 15, margin: 0, lineHeight: 1.7}}>
            <li>💡 Yksi näkymä, kaikki tärkeä</li>
            <li>⏱️ Säästät tunteja viikossa</li>
            <li>🔄 Päivittyy automaattisesti – ei manuaalista päivittelyä</li>
            <li>📱 Toimii kaikkialla – myös puhelimella</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 