import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

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
    <div style={{minHeight: '100vh', background: 'var(--brand-dark)', color: '#fff', width: '100vw', boxSizing: 'border-box'}}>
      {/* Ylänavigaatio sama kuin LandingPagella */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 6vw 0 6vw',
        boxSizing: 'border-box',
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <img src="/favicon.png" alt="Rascal AI logo" style={{width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', background: 'var(--brand-green)'}} />
          <span style={{color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: 1}}>Rascal AI</span>
        </div>
        <button 
          onClick={() => navigate('/')} 
          style={{
            padding: '12px 32px', 
            fontSize: 18, 
            borderRadius: 8, 
            background: 'var(--brand-green)', 
            color: 'var(--brand-black)', 
            border: 'none', 
            fontWeight: 700, 
            cursor: 'pointer', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
          }}
        >
          Takaisin etusivulle
        </button>
      </div>
      {/* --- */}
      <div style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        background: 'var(--brand-dark)',
        boxSizing: 'border-box',
        padding: '0',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '40px 0 40px 0',
          background: '#23272f',
          borderRadius: 20,
          boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
          padding: '48px 32px',
          boxSizing: 'border-box',
          minHeight: '80vh',
        }}>
          <h1 style={{fontSize: 36, fontWeight: 800, marginBottom: 32, color: '#fff'}}>Tietosuojaseloste</h1>
          
          <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
            <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>1. Yleistä</h2>
            <p style={{fontSize: 16, marginBottom: 16}}>
              Tämä tietosuojaseloste kuvaa, miten Rascal AI ("me", "meidän") keräämme, käytämme ja suojaamme henkilötietojasi. 
              Tietosuojaseloste on päivitetty viimeksi {new Date().toLocaleDateString('fi-FI')}.
            </p>
            <p style={{fontSize: 16, marginBottom: 16}}>
              GDPR:n (Yleisen tietosuoja-asetuksen) mukaisesti sinulla on oikeus tietää, mitä henkilötietojasi keräämme ja miten niitä käytämme.
            </p>
          </div>

          <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
            <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>2. Henkilötietojen kerääminen</h2>
            <p style={{fontSize: 16, marginBottom: 16}}>Keräämme seuraavia henkilötietoja:</p>
            <ul style={{fontSize: 16, marginBottom: 16, paddingLeft: 20}}>
              <li><strong>Sähköpostiosoite:</strong> Kirjautumista ja palvelun käyttöä varten</li>
              <li><strong>Salasana:</strong> Tietoturvaa varten (salattu)</li>
              <li><strong>Käyttötiedot:</strong> Palvelun käyttöön liittyvät analytiikkatiedot</li>
              <li><strong>Tekniset tiedot:</strong> IP-osoite, selain, laitteen tiedot</li>
            </ul>
          </div>

          <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
            <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>3. Henkilötietojen käyttötarkoitus</h2>
            <p style={{fontSize: 16, marginBottom: 16}}>Käytämme henkilötietojasi seuraaviin tarkoituksiin:</p>
            <ul style={{fontSize: 16, marginBottom: 16, paddingLeft: 20}}>
              <li>Palvelun tarjoaminen ja ylläpito</li>
              <li>Käyttäjätunnuksen luominen ja hallinta</li>
              <li>Palvelun parantaminen ja kehittäminen</li>
              <li>Teknisen ongelmien ratkaiseminen</li>
              <li>Lainmukaisten velvoitteiden täyttäminen</li>
            </ul>
          </div>

          <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
            <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>4. Oikeusperusteet</h2>
            <p style={{fontSize: 16, marginBottom: 16}}>Henkilötietojen käsittely perustuu seuraaviin oikeusperusteisiin:</p>
            <ul style={{fontSize: 16, marginBottom: 16, paddingLeft: 20}}>
              <li><strong>Sopimus:</strong> Palvelun tarjoamiseksi</li>
              <li><strong>Oikeutettu etu:</strong> Palvelun kehittämiseksi ja parantamiseksi</li>
              <li><strong>Suostumus:</strong> Markkinointiviestintään (jos annettu)</li>
            </ul>
          </div>

          <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
            <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>5. Henkilötietojen säilytys</h2>
            <p style={{fontSize: 16, marginBottom: 16}}>
              Henkilötietoja säilytetään vain niin kauan kuin on tarpeen palvelun tarjoamiseksi tai lainmukaisten velvoitteiden täyttämiseksi. 
              Tilin poistamisen yhteydessä henkilötiedot poistetaan 30 päivän kuluessa.
            </p>
          </div>

          <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
            <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>6. Oikeutesi</h2>
            <p style={{fontSize: 16, marginBottom: 16}}>GDPR:n mukaisesti sinulla on seuraavat oikeudet:</p>
            <ul style={{fontSize: 16, marginBottom: 16, paddingLeft: 20}}>
              <li><strong>Oikeus tietoon:</strong> Saat tietää, mitä henkilötietojasi käsittelemme</li>
              <li><strong>Oikeus pääsyyn:</strong> Voit pyytää pääsyä henkilötietoihisi</li>
              <li><strong>Oikeus korjaukseen:</strong> Voit pyytää virheellisten tietojen korjaamista</li>
              <li><strong>Oikeus poistamiseen:</strong> Voit pyytää henkilötietojesi poistamista</li>
              <li><strong>Oikeus rajoittamiseen:</strong> Voit pyytää henkilötietojen käsittelyn rajoittamista</li>
              <li><strong>Oikeus siirtoon:</strong> Voit pyytää henkilötietojesi siirtämistä</li>
              <li><strong>Oikeus vastustamiseen:</strong> Voit vastustaa henkilötietojen käsittelyä</li>
            </ul>
            
            <div style={{background: '#1a1d23', borderRadius: 12, padding: '24px', marginTop: 24}}>
              <h3 style={{fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#fff'}}>Käytä oikeuksiasi</h3>
              <p style={{fontSize: 16, marginBottom: 20}}>
                Voit käyttää GDPR-oikeuksiasi alla olevilla linkeillä:
              </p>
              <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
                <button 
                  onClick={() => handleDataRequest()}
                  style={{
                    background: 'var(--brand-green)',
                    border: 'none',
                    color: 'var(--brand-black)',
                    padding: '12px 24px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 700
                  }}
                >
                  📋 Pyydä henkilötietoni
                </button>
                <button 
                  onClick={() => handleDataDeletion()}
                  style={{
                    background: '#dc2626',
                    border: 'none',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 700
                  }}
                >
                  🗑️ Poista henkilötietoni
                </button>
              </div>
            </div>
          </div>

          <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
            <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>7. Evästeet</h2>
            <p style={{fontSize: 16, marginBottom: 16}}>
              Käytämme evästeitä palvelun toiminnan varmistamiseksi ja käyttökokemuksen parantamiseksi. 
              Evästeet eivät sisällä henkilötietoja, mutta ne auttavat tunnistamaan käyttäjän selaimen.
            </p>
          </div>

          <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
            <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>8. Tietoturva</h2>
            <p style={{fontSize: 16, marginBottom: 16}}>
              Henkilötietojesi suojaaminen on meille tärkeää. Käytämme teknisiä ja organisatorisia toimenpiteitä 
              henkilötietojen suojaamiseksi luvatonta käyttöä, menetystä tai tuhoutumista vastaan.
            </p>
          </div>

          <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
            <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>9. Yhteystiedot</h2>
            <p style={{fontSize: 16, marginBottom: 16}}>
              Jos sinulla on kysymyksiä henkilötietojen käsittelystä tai haluat käyttää oikeuksiasi, 
              ota yhteyttä:
            </p>
            <p style={{fontSize: 16, marginBottom: 16}}>
              <strong>Sähköposti:</strong> privacy@rascal-ai.com<br/>
              <strong>Osoite:</strong> [Yrityksen osoite]<br/>
              <strong>Puhelin:</strong> [Puhelinnumero]
            </p>
          </div>

          <div style={{background: '#23272f', borderRadius: 16, padding: '32px', marginBottom: 32}}>
            <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#fff'}}>10. Muutokset tietosuojaselosteeseen</h2>
            <p style={{fontSize: 16, marginBottom: 16}}>
              Pidätämme oikeuden päivittää tätä tietosuojaselostetta. Merkitsevät muutokset ilmoitetaan 
              käyttäjille sähköpostitse tai palvelun kautta.
            </p>
          </div>

          <div style={{textAlign: 'center', marginTop: 48, padding: '24px', borderTop: '1px solid #444'}}>
            <p style={{fontSize: 14, color: '#ccc'}}>
              Viimeksi päivitetty: {new Date().toLocaleDateString('fi-FI')}
            </p>
          </div>
        </div>
      </div>

      {/* GDPR-toimintojen modaali */}
      {showGdprModal && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(0,0,0,0.8)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#23272f', 
            borderRadius: 20, 
            padding: '32px', 
            maxWidth: 500, 
            width: '90vw',
            color: '#fff'
          }}>
            <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16}}>
              {gdprAction === 'request' ? 'Henkilötietojen pyytäminen' : 'Henkilötietojen poistaminen'}
            </h2>
            <p style={{fontSize: 16, marginBottom: 24, lineHeight: 1.6}}>
              {gdprAction === 'request' 
                ? 'Syötä sähköpostiosoitteesi, niin lähetämme sinulle henkilötietosi JSON-muodossa.'
                : 'Syötä sähköpostiosoitteesi, niin poistamme henkilötietosi järjestelmästämme. Tämä toiminto on peruuttamaton.'
              }
            </p>
            <input 
              type="email" 
              placeholder="Sähköpostiosoite" 
              value={gdprEmail} 
              onChange={e => setGdprEmail(e.target.value)}
              style={{
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: 8, 
                border: '1px solid #444', 
                background: '#1a1d23', 
                color: '#fff', 
                fontSize: 16,
                marginBottom: 24
              }}
            />
            <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end'}}>
              <button 
                onClick={() => setShowGdprModal(false)}
                style={{
                  background: 'none', 
                  border: '1px solid #666', 
                  color: '#ccc', 
                  padding: '10px 20px', 
                  borderRadius: 8, 
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                Peruuta
              </button>
              <button 
                onClick={handleGdprSubmit}
                disabled={!gdprEmail || gdprLoading}
                style={{
                  background: gdprAction === 'request' ? 'var(--brand-green)' : '#dc2626',
                  border: 'none', 
                  color: gdprAction === 'request' ? 'var(--brand-black)' : '#fff', 
                  padding: '10px 20px', 
                  borderRadius: 8, 
                  cursor: gdprLoading ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  fontWeight: 700,
                  opacity: gdprLoading ? 0.6 : 1
                }}
              >
                {gdprLoading ? 'Käsitellään...' : (gdprAction === 'request' ? 'Pyydä tiedot' : 'Poista tiedot')}
              </button>
            </div>
            {gdprError && (
              <div style={{color: '#f87171', marginTop: 16, fontSize: 14}}>
                {gdprError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 