import React from 'react'
import { useNavigate } from 'react-router-dom'
import './LegalPages.css'

export default function TermsOfServicePage() {
  const navigate = useNavigate()

  return (
    <div className="legal-page">
      {/* Ylänavigaatio */}
      <div className="legal-header">
        <div className="legal-logo">
          <img src="/favicon.png" alt="Rascal AI logo" />
          <span>Rascal AI</span>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="legal-back-button"
        >
          Takaisin etusivulle
        </button>
      </div>

      {/* Sisältö */}
      <div className="legal-container">
        <div className="legal-content">
          <h1 className="legal-title">Käyttöehdot</h1>
          
          <div className="legal-section">
            <h2 className="legal-section-title">1. Yleistä</h2>
            <p className="legal-text">
              Nämä käyttöehdot ("Ehdot") koskevat Rascal AI -palvelun käyttöä. Palvelua tarjoaa Rascal AI ("me", "meidän").
              Käyttämällä palvelua hyväksyt nämä ehdot kokonaan.
            </p>
            <p className="legal-text">
              Ehdot on päivitetty viimeksi {new Date().toLocaleDateString('fi-FI')}.
            </p>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">2. Palvelun kuvaus</h2>
            <p className="legal-text">
              Rascal AI tarjoaa markkinointidashboard-palvelua, joka mahdollistaa markkinointitoimintojen seurannan 
              ja hallinnan yhdessä näkymässä. Palvelu sisältää:
            </p>
            <ul className="legal-list">
              <li>Markkinointitoimintojen seuranta</li>
              <li>Analytiikkatietojen näyttäminen</li>
              <li>Raporttien luominen</li>
              <li>Integraatiot kolmansien osapuolten palveluihin</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">3. Käyttäjätili</h2>
            <p className="legal-text">
              Palvelun käyttämiseksi sinun on luotava käyttäjätili. Vastaat:
            </p>
            <ul className="legal-list">
              <li>Tietojesi oikeellisuudesta</li>
              <li>Salasanasi turvallisuudesta</li>
              <li>Tilisi käytöstä</li>
              <li>Kaikista tilisi kautta tehdystä toiminnasta</li>
            </ul>
            <p className="legal-text">
              Me pidätämme oikeuden sulkea tilisi, jos nämä ehdot rikotaan.
            </p>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">4. Maksut ja hinnoittelu</h2>
            <p className="legal-text">
              Palvelun hinnoittelu on saatavilla palvelun kautta. Maksut suoritetaan etukäteen ja ne ovat 
              palautuksia. Hinnat voivat muuttua ilmoituksella.
            </p>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">5. Käyttörajoitukset</h2>
            <p className="legal-text">Et saa käyttää palvelua:</p>
            <ul className="legal-list">
              <li>Lainvastaisiin tarkoituksiin</li>
              <li>Muiden oikeuksien loukkaamiseksi</li>
              <li>Palvelun toiminnan häiritsemiseksi</li>
              <li>Haittaohjelmien levittämiseksi</li>
              <li>Kolmansien osapuolten palveluiden väärinkäyttöön</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">6. Henkilötiedot</h2>
            <p className="legal-text">
              Henkilötietojesi käsittelystä on erillinen tietosuojaseloste. Käyttämällä palvelua 
              hyväksyt henkilötietojesi käsittelyn tietosuojaselosteen mukaisesti.
            </p>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">7. Immateriaalioikeudet</h2>
            <p className="legal-text">
              Palvelu ja sen sisältö ovat meidän tai lisenssinantajiemme omaisuutta. Et saa:
            </p>
            <ul className="legal-list">
              <li>Kopioida, muokata tai levittää palvelun sisältöä</li>
              <li>Käyttää palvelun koodia tai rakennetta</li>
              <li>Luoda johdannaisia palvelusta</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">8. Vastuunrajoitukset</h2>
            <p className="legal-text">
              Palvelu tarjotaan "sellaisena kuin on". Emme takaa palvelun:
            </p>
            <ul className="legal-list">
              <li>Keskeytymätöntä toimintaa</li>
              <li>Virheettömyyttä</li>
              <li>Tietyn tarkoituksen täyttämistä</li>
            </ul>
            <p className="legal-text">
              Emme ole vastuussa välillisistä vahingoista tai menetyksistä.
            </p>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">9. Palvelun muutokset</h2>
            <p className="legal-text">
              Pidätämme oikeuden muuttaa tai lopettaa palvelun milloin tahansa. Merkitsevät muutokset 
              ilmoitetaan käyttäjille etukäteen.
            </p>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">10. Yhteystiedot</h2>
            <p className="legal-text">
              Jos sinulla on kysymyksiä näistä ehdoista, ota yhteyttä:
            </p>
            <div className="legal-contact">
              <p className="legal-contact-text">
                Rascal AI<br />
                Sähköposti: info@rascal.ai<br />
                Puhelin: +358 40 123 4567
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 