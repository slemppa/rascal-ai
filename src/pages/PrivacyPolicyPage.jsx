import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './LegalPages.css'

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()
  const [showGdprModal, setShowGdprModal] = useState(false)
  const [gdprAction, setGdprAction] = useState('request')
  const [gdprEmail, setGdprEmail] = useState('')
  const [gdprLoading, setGdprLoading] = useState(false)
  const [gdprError, setGdprError] = useState('')

  const handleDataRequest = () => {
    setGdprAction('request')
    setGdprEmail('')
    setGdprError('')
    setShowGdprModal(true)
  }

  const handleDataDeletion = () => {
    setGdprAction('deletion')
    setGdprEmail('')
    setGdprError('')
    setShowGdprModal(true)
  }

  const handleGdprSubmit = async () => {
    if (!gdprEmail) {
      setGdprError('Sähköpostiosoite vaaditaan')
      return
    }

    setGdprLoading(true)
    setGdprError('')

    try {
      const endpoint = gdprAction === 'request' ? '/api/gdpr-data-request' : '/api/gdpr-data-deletion'
      const response = await axios.post(endpoint, { 
        email: gdprEmail,
        reason: gdprAction === 'deletion' ? 'User requested deletion via privacy policy page' : undefined
      })

      if (response.data.success) {
        alert(gdprAction === 'request' 
          ? 'Henkilötietosi on lähetetty sähköpostiisi.' 
          : 'Henkilötietosi on poistettu järjestelmästä.'
        )
        setShowGdprModal(false)
      } else {
        setGdprError(response.data.error || 'Virhe toiminnon suorittamisessa')
      }
    } catch (error) {
      console.error('GDPR action error:', error)
      setGdprError(error.response?.data?.error || 'Virhe palvelinyhteydessä')
    } finally {
      setGdprLoading(false)
    }
  }

  return (
    <div className="legal-page">
      {/* Ylänavigaatio sama kuin LandingPagella */}
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
      {/* --- */}
      <div className="legal-container">
        <div className="legal-content">
          <h1 className="legal-title">Tietosuojaseloste</h1>
          
          <div className="legal-section">
            <h2 className="legal-section-title">1. Yleistä</h2>
            <p className="legal-text">
              Tämä tietosuojaseloste kuvaa, miten Rascal AI ("me", "meidän") keräämme, käytämme ja suojaamme henkilötietojasi. 
              Tietosuojaseloste on päivitetty viimeksi {new Date().toLocaleDateString('fi-FI')}.
            </p>
            <p className="legal-text">
              GDPR:n (Yleisen tietosuoja-asetuksen) mukaisesti sinulla on oikeus tietää, mitä henkilötietojasi keräämme ja miten niitä käytämme.
            </p>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">2. Henkilötietojen kerääminen</h2>
            <p className="legal-text">Keräämme seuraavia henkilötietoja:</p>
            <ul className="legal-list">
              <li>Nimi ja yhteystiedot (sähköposti, puhelinnumero)</li>
              <li>Yrityksen tiedot</li>
              <li>Palvelun käyttötiedot</li>
              <li>Tekniset tiedot (IP-osoite, selain)</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">3. Henkilötietojen käyttö</h2>
            <p className="legal-text">Käytämme henkilötietojasi seuraaviin tarkoituksiin:</p>
            <ul className="legal-list">
              <li>Palvelun tarjoaminen ja ylläpito</li>
              <li>Asiakaspalvelu</li>
              <li>Palvelun kehittäminen</li>
              <li>Lakien noudattaminen</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">4. Henkilötietojen jakaminen</h2>
            <p className="legal-text">
              Emme jaa henkilötietojasi kolmansille osapuolille ilman suostumustasi, paitsi:
            </p>
            <ul className="legal-list">
              <li>Lain edellyttämässä tapauksessa</li>
              <li>Palveluntarjoajille (esim. pilvipalvelut)</li>
              <li>Suostumuksesi perusteella</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">5. Henkilötietojen turvallisuus</h2>
            <p className="legal-text">
              Suojaamme henkilötietojasi teknisillä ja organisatorisilla toimenpiteillä:
            </p>
            <ul className="legal-list">
              <li>Salaus tiedoille</li>
              <li>Rajoitettu pääsy henkilötietoihin</li>
              <li>Säännölliset tietoturva-auditit</li>
              <li>Henkilökunnan koulutus</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">6. Oikeutesi</h2>
            <p className="legal-text">Sinulla on oikeus:</p>
            <ul className="legal-list">
              <li>Saada tietoja henkilötietojesi käsittelystä</li>
              <li>Oikaista virheellisiä tietoja</li>
              <li>Poistaa henkilötietojasi</li>
              <li>Rajoittaa henkilötietojen käsittelyä</li>
              <li>Siirtää henkilötietojasi</li>
              <li>Vastustaa henkilötietojen käsittelyä</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">7. Evästeet</h2>
            <p className="legal-text">
              Käytämme evästeitä palvelun toiminnan varmistamiseksi ja käyttökokemuksen parantamiseksi. 
              Voit hallita evästeitä selaimen asetuksissa.
            </p>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">8. Henkilötietojen säilytys</h2>
            <p className="legal-text">
              Säilytämme henkilötietojasi vain niin kauan kuin se on tarpeen palvelun tarjoamiseksi 
              tai lakisääteisten velvoitteiden täyttämiseksi.
            </p>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">9. Tietosuojaselosteen päivitykset</h2>
            <p className="legal-text">
              Päivitämme tietosuojaselostetta tarpeen mukaan. Merkitsevät muutokset ilmoitetaan käyttäjille.
            </p>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">10. Yhteystiedot</h2>
            <p className="legal-text">
              Jos sinulla on kysymyksiä henkilötietojen käsittelystä, ota yhteyttä:
            </p>
            <div className="legal-contact">
              <p className="legal-contact-text">
                Rascal AI<br />
                Sähköposti: privacy@rascal.ai<br />
                Puhelin: +358 40 123 4567
              </p>
            </div>
          </div>

          <div className="legal-section">
            <h2 className="legal-section-title">11. GDPR-oikeuksien käyttö</h2>
            <p className="legal-text">
              Voit käyttää GDPR-oikeuksiasi alla olevien painikkeiden avulla:
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button 
                onClick={handleDataRequest}
                style={{
                  padding: '10px 20px',
                  background: '#4ADE80',
                  color: '#181B20',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Pyydä henkilötietoni
              </button>
              <button 
                onClick={handleDataDeletion}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Poista henkilötietoni
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GDPR Modal */}
      {showGdprModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#23272f',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            color: '#fff'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>
              {gdprAction === 'request' ? 'Pyydä henkilötietosi' : 'Poista henkilötietosi'}
            </h3>
            <p style={{ marginBottom: '16px', fontSize: '14px', color: '#cbd5e1' }}>
              {gdprAction === 'request' 
                ? 'Syötä sähköpostiosoitteesi, niin lähetämme henkilötietosi sinulle.'
                : 'Syötä sähköpostiosoitteesi, niin poistamme henkilötietosi järjestelmästä.'
              }
            </p>
            <input
              type="email"
              value={gdprEmail}
              onChange={(e) => setGdprEmail(e.target.value)}
              placeholder="sähköposti@esimerkki.fi"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #374151',
                borderRadius: '6px',
                background: '#181B20',
                color: '#fff',
                fontSize: '14px',
                marginBottom: '16px'
              }}
            />
            {gdprError && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {gdprError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowGdprModal(false)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#cbd5e1',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <button
                onClick={handleGdprSubmit}
                disabled={gdprLoading}
                style={{
                  padding: '8px 16px',
                  background: gdprLoading ? '#6b7280' : '#4ADE80',
                  color: '#181B20',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: gdprLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {gdprLoading ? 'Käsitellään...' : (gdprAction === 'request' ? 'Pyydä' : 'Poista')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 