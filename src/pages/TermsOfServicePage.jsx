import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function TermsOfServicePage() {
  const navigate = useNavigate()

  return (
    <div style={{minHeight: '100vh', background: 'var(--brand-dark)', color: '#fff', padding: '20px 6vw'}}>
      {/* Ylänavigaatio */}
      <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 32px 0'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <img src="/favicon.png" alt="Rascal AI logo" style={{width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: 'var(--brand-green)'}} />
          <span style={{color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: 1}}>Rascal AI</span>
        </div>
        <button 
          onClick={() => navigate('/')} 
          style={{
            padding: '12px 24px', 
            fontSize: 16, 
            borderRadius: 8, 
            background: 'var(--brand-green)', 
            color: 'var(--brand-black)', 
            border: 'none', 
            fontWeight: 700, 
            cursor: 'pointer'
          }}
        >
          Takaisin etusivulle
        </button>
      </div>

      {/* Sisältö */}
      <div style={{maxWidth: '800px', margin: '0 auto', lineHeight: 1.6}}>
        <h1 style={{fontSize: 36, fontWeight: 800, marginBottom: 32, color: '#fff'}}>Käyttöehdot</h1>
        
        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>1. Yleistä</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Nämä käyttöehdot ("Ehdot") koskevat Rascal AI -palvelun käyttöä. Palvelua tarjoaa Rascal AI ("me", "meidän").
            Käyttämällä palvelua hyväksyt nämä ehdot kokonaan.
          </p>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Ehdot on päivitetty viimeksi {new Date().toLocaleDateString('fi-FI')}.
          </p>
        </div>

        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>2. Palvelun kuvaus</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Rascal AI tarjoaa markkinointidashboard-palvelua, joka mahdollistaa markkinointitoimintojen seurannan 
            ja hallinnan yhdessä näkymässä. Palvelu sisältää:
          </p>
          <ul style={{fontSize: 16, marginBottom: 16, paddingLeft: 20}}>
            <li>Markkinointitoimintojen seuranta</li>
            <li>Analytiikkatietojen näyttäminen</li>
            <li>Raporttien luominen</li>
            <li>Integraatiot kolmansien osapuolten palveluihin</li>
          </ul>
        </div>

        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>3. Käyttäjätili</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Palvelun käyttämiseksi sinun on luotava käyttäjätili. Vastaat:
          </p>
          <ul style={{fontSize: 16, marginBottom: 16, paddingLeft: 20}}>
            <li>Tietojesi oikeellisuudesta</li>
            <li>Salasanasi turvallisuudesta</li>
            <li>Tilisi käytöstä</li>
            <li>Kaikista tilisi kautta tehdystä toiminnasta</li>
          </ul>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Me pidätämme oikeuden sulkea tilisi, jos nämä ehdot rikotaan.
          </p>
        </div>

        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>4. Maksut ja hinnoittelu</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Palvelun hinnoittelu on saatavilla palvelun kautta. Maksut suoritetaan etukäteen ja ne ovat 
            palautuksia. Hinnat voivat muuttua ilmoituksella.
          </p>
        </div>

        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>5. Käyttörajoitukset</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>Et saa käyttää palvelua:</p>
          <ul style={{fontSize: 16, marginBottom: 16, paddingLeft: 20}}>
            <li>Lainvastaisiin tarkoituksiin</li>
            <li>Muiden oikeuksien loukkaamiseksi</li>
            <li>Palvelun toiminnan häiritsemiseksi</li>
            <li>Haittaohjelmien levittämiseksi</li>
            <li>Kolmansien osapuolten palveluiden väärinkäyttöön</li>
          </ul>
        </div>

        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>6. Henkilötiedot</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Henkilötietojesi käsittelystä on erillinen tietosuojaseloste. Käyttämällä palvelua 
            hyväksyt henkilötietojesi käsittelyn tietosuojaselosteen mukaisesti.
          </p>
        </div>

        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>7. Immateriaalioikeudet</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Palvelu ja sen sisältö ovat meidän tai lisenssinantajiemme omaisuutta. Et saa:
          </p>
          <ul style={{fontSize: 16, marginBottom: 16, paddingLeft: 20}}>
            <li>Kopioida, muokata tai levittää palvelun sisältöä</li>
            <li>Käyttää palvelun koodia tai rakennetta</li>
            <li>Luoda johdannaisia palvelusta</li>
          </ul>
        </div>

        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>8. Vastuunrajoitukset</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Palvelu tarjotaan "sellaisena kuin on". Emme takaa palvelun:
          </p>
          <ul style={{fontSize: 16, marginBottom: 16, paddingLeft: 20}}>
            <li>Keskeytymätöntä toimintaa</li>
            <li>Virheettömyyttä</li>
            <li>Tietyn tarkoituksen täyttämistä</li>
          </ul>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Emme ole vastuussa välillisistä vahingoista tai menetyksistä.
          </p>
        </div>

        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>9. Palvelun muutokset</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Pidätämme oikeuden muuttaa tai lopettaa palvelun milloin tahansa. Merkitsevät muutokset 
            ilmoitetaan käyttäjille etukäteen.
          </p>
        </div>

        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>10. Ehtojen muutokset</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Pidätämme oikeuden päivittää nämä ehdot. Muutokset tulevat voimaan julkaisun jälkeen. 
            Jatkamalla palvelun käyttöä hyväksyt päivitetyt ehdot.
          </p>
        </div>

        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>11. Sovellettava laki</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Nämä ehdot noudattavat suomen lakia. Mahdolliset riidat ratkaistaan suomen tuomioistuimissa.
          </p>
        </div>

        <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
          <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>12. Yhteystiedot</h2>
          <p style={{fontSize: 16, marginBottom: 16}}>
            Jos sinulla on kysymyksiä näistä ehdoista, ota yhteyttä:
          </p>
          <p style={{fontSize: 16, marginBottom: 16}}>
            <strong>Sähköposti:</strong> legal@rascal-ai.com<br/>
            <strong>Osoite:</strong> [Yrityksen osoite]<br/>
            <strong>Puhelin:</strong> [Puhelinnumero]
          </p>
        </div>

        <div style={{textAlign: 'center', marginTop: 48, padding: '24px', borderTop: '1px solid #444'}}>
          <p style={{fontSize: 14, color: '#ccc'}}>
            Viimeksi päivitetty: {new Date().toLocaleDateString('fi-FI')}
          </p>
        </div>
      </div>
    </div>
  )
} 