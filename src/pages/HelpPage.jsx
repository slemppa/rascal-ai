import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './HelpPage.css'

export default function HelpPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('getting-started')

  const helpSections = [
    {
      id: 'getting-started',
      title: 'Aloitus',
      icon: 'rocket',
      content: [
        {
          title: 'Tervetuloa Rascal AI:hin!',
          description: 'Rascal AI on tekoälyavusteinen työkalu sosiaalisen median sisällön luomiseen ja hallintaan. Tässä oppaassa opit käyttämään kaikkia ominaisuuksia.',
          tips: [
            'Aloita Dashboard-sivulta yleiskuvan saamiseksi',
            'Tutustu julkaisujen hallintaan Posts-sivulla',
            'Käytä sisältöstrategiaa sisällön suunnitteluun'
          ]
        }
      ]
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'dashboard',
      content: [
        {
          title: 'Dashboard - Yleiskuva',
          description: 'Dashboard-sivulla näet kaikki tärkeimmät tiedot yhdellä katsauksella.',
          features: [
            'Viimeisimmät julkaisut ja niiden tilat',
            'Tulevat julkaisut ja aikataulut',
            'Nopeat toiminnot uusien julkaisujen luomiseen',
            'Tilastot ja analyysit'
          ]
        },
        {
          title: 'Nopeat toiminnot',
          description: 'Dashboardin yläosassa on nopeat toiminnot yleisimpiin tehtäviin.',
          tips: [
            'Vedä ja pudota kuvia julkaisuja varten',
            'Lataa äänitiedostoja puheluihin',
            'Muokkaa julkaisuja suoraan listasta'
          ]
        }
      ]
    },
    {
      id: 'posts',
      title: 'Julkaisut',
      icon: 'posts',
      content: [
        {
          title: 'Julkaisujen hallinta',
          description: 'Posts-sivulla hallitset kaikkia sosiaalisen median julkaisujasi.',
          features: [
            'Luo ja muokkaa julkaisuja',
            'Aikatauluta julkaisut',
            'Hallitse julkaisujen tiloja (luonnos, aikataulutettu, julkaistu)',
            'Lisää kuvia ja videoita julkaisuihin'
          ]
        },
        {
          title: 'Julkaisun luominen',
          description: 'Uuden julkaisun luominen on yksinkertaista.',
          steps: [
            'Klikkaa "Uusi julkaisu" -painiketta',
            'Kirjoita idean kuvaus',
            'Lisää julkaisun teksti (caption)',
            'Valitse julkaisupäivä ja -aika',
            'Tallenna julkaisu'
          ]
        },
        {
          title: 'Julkaisujen muokkaus',
          description: 'Voit muokata julkaisuja milloin tahansa.',
          tips: [
            'Klikkaa julkaisun nimeä avataksesi muokkausikkunan',
            'Muutokset tallennetaan automaattisesti',
            'Voit perua julkaisun aikataulun tai muuttaa sitä'
          ]
        }
      ]
    },
    {
      id: 'strategy',
      title: 'Sisältöstrategia',
      icon: 'strategy',
      content: [
        {
          title: 'Sisältöstrategian luominen',
          description: 'Sisältöstrategia-sivulla voit suunnitella sisältösi pitkällä aikavälillä.',
          features: [
            'Luo sisältösuunnitelmia eri aiheille',
            'Aikatauluta sisältö kuukausiksi eteenpäin',
            'Käytä AI:ta sisältöideoiden generointiin',
            'Hallitse sisältökalenteria'
          ]
        },
        {
          title: 'AI-avusteinen sisältösuunnittelu',
          description: 'Rascal AI auttaa sinua luomaan tehokasta sisältöstrategiaa.',
          tips: [
            'Anna AI:lle selkeät ohjeet brändistäsi',
            'Määrittele kohderyhmäsi ja tavoitteesi',
            'Käytä AI:n ehdotuksia inspiraationa',
            'Muokkaa ja henkilökohtaistaa AI:n luomaa sisältöä'
          ]
        }
      ]
    },
    {
      id: 'calls',
      title: 'Puhelut',
      icon: 'calls',
      content: [
        {
          title: 'Uusi puhelujen hallinta',
          description: 'Puhelut-sivulla on kaksi virtaa: Massapuhelut (Google Sheets) ja Yksittäinen puhelu. Molemmat käyttävät backend-API:a ja tallentavat tapahtumat call_logs-tauluun.',
          features: [
            'Massapuhelut: kolmi­vaiheinen modaali (Sheets → Tyyppi & ääni → Aloita/Ajastus)',
            'Ajastus: kellonajat aina 00 tai 30 (HH:MM/HH:MM:SS)',
            'Yksittäinen puhelu: nappi avaa modaalin (Tyyppi & ääni → Nimi & numero → Soita)',
            'Numeron normalisointi: 40 → 040 → +35840…, 00358/358 → +358…',
            'Kirjaus: call_logs (call_date, call_time, call_status=pending)',
            'Frontti kutsuu vain /api/ -endpointteja (esim. /api/mass-call)'            
          ]
        },
        {
          title: 'Massapuhelut (Google Sheets)',
          description: 'Aloita massapuhelut -nappi avaa modaalin, jossa etenet kolmessa vaiheessa.',
          steps: [
            'Vaihe 1 – Google Sheets: liitä julkinen Sheets-linkki ja suorita validointi. Puhelin- ja sähköpostisarakkeet tunnistetaan automaattisesti.',
            'Vaihe 2 – Asetukset: valitse puhelun tyyppi ja ääni (skripti päivittyy tyypin mukaan).',
            'Vaihe 3 – Käynnistys: valitse “Aloita heti” tai “Ajasta puhelut”. Ajastus käyttää päivämäärää ja kellonaikaa (minuutit 00/30).'
          ]
        },
        {
          title: 'Yksittäinen puhelu',
          description: 'Kortissa on nappi “Soita yksittäinen puhelu”, joka avaa kaksivaiheisen modaalin.',
          steps: [
            'Vaihe 1 – Asetukset: valitse puhelun tyyppi ja ääni.',
            'Vaihe 2 – Tiedot: syötä nimi ja puhelinnumero, ja käynnistä puhelu.'
          ],
          tips: [
            'Numero normalisoidaan aina +358-muotoon: 50 → 050 → +35850…',
            'Kaksoispisteellinen aika (HH:MM tai HH:MM:SS) tallentuu call_time-kenttään.'
          ]
        },
        {
          title: 'N8N-integraatio',
          description: 'Ajastetut puhelut poimitaan automaattisesti N8N:llä.',
          tips: [
            'Suodatus: call_date = TODAY ja call_time ≤ NOW, call_status = pending',
            'Massapuheluissa sekä yksittäisissä kirjaukset löytyvät call_logs-taulusta'
          ]
        }
      ]
    },
    {
      id: 'ai-chat',
      title: 'AI Assistentti',
      icon: 'ai',
      content: [
        {
          title: 'AI Assistentti',
          description: 'AI Assistentti on henkilökohtainen avustajasi sisällön luomisessa ja markkinointiin.',
          features: [
            'Kysy neuvoja sisällön luomiseen',
            'Pyydä apua markkinointistrategioihin',
            'Käytä AI:ta sisältöideoiden generointiin',
            'Saa henkilökohtaista tukea projekteihisi'
          ]
        },
        {
          title: 'Parhaat käytännöt',
          description: 'Saat parhaat tulokset AI Assistentista seuraavilla vinkillä.',
          tips: [
            'Ole selkeä ja tarkka kysymyksissäsi',
            'Anna kontekstia brändistäsi ja kohderyhmästäsi',
            'Käytä AI:n vastauksia inspiraationa, ei valmiina sisältönä',
            'Kysy jatkokysymyksiä tarkentaaaksesi vastauksia'
          ]
        }
      ]
    },
    {
      id: 'settings',
      title: 'Asetukset',
      icon: 'settings',
      content: [
        {
          title: 'Tilin asetukset',
          description: 'Asetukset-sivulla voit hallita tilisi tietoja ja asetuksia.',
          features: [
            'Muuta henkilökohtaisia tietojasi',
            'Hallitse salasanasi',
            'Tarkastele tilauksesi tietoja',
            'Hallitse ilmoituksia'
          ]
        },
        {
          title: 'Tietoturva',
          description: 'Tietoturva on tärkeää.',
          tips: [
            'Käytä vahvaa salasanaa',
            'Päivitä salasanasi säännöllisesti',
            'Älä jaa kirjautumistietojasi muille',
            'Kirjaudu ulos kun et käytä sovellusta'
          ]
        }
      ]
    },
    {
      id: 'faq',
      title: 'Usein kysytyt kysymykset',
      icon: 'faq',
      content: [
        {
          title: 'Miten voin perua julkaisun?',
          description: 'Voit perua julkaisun sen aikataulun muuttamalla tai poistamalla sen kokonaan.',
          answer: 'Mene Posts-sivulle, etsi julkaisu ja klikkaa sen nimeä. Muokkausikkunassa voit muuttaa julkaisupäivää tai poistaa julkaisun kokonaan.'
        },
        {
          title: 'Miten voin lisätä kuvia julkaisuun?',
          description: 'Kuvien lisääminen on helppoa.',
          answer: 'Dashboard-sivulla voit vetää ja pudottaa kuvia yläosan kuva-alueelle. Vaihtoehtoisesti voit lisätä kuvia Posts-sivulla julkaisua muokatessa.'
        },
        {
          title: 'Mikä on sisältöstrategia?',
          description: 'Sisältöstrategia auttaa sinua suunnittelemaan sisältösi.',
          answer: 'Sisältöstrategia on pitkän aikavälin suunnitelma siitä, millaista sisältöä luot, milloin ja miksi. Se auttaa sinua pysymään johdonmukaisena ja saavuttamaan markkinointitavoitteesi.'
        },
        {
          title: 'Miten AI Assistentti toimii?',
          description: 'AI Assistentti on tekoälyavusteinen chat-työkalu.',
          answer: 'AI Assistentti käyttää tekoälyä vastatakseen kysymyksiisi ja auttaakseen sinua sisällön luomisessa. Se oppii brändistäsi ja tarpeistasi käytön myötä.'
        }
      ]
    }
  ]

  const currentSection = helpSections.find(section => section.id === activeSection)

  return (
    <div className="help-container">
      <div className="help-header">
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1f2937', margin: 0 }}>Help Center</h2>
      </div>
      <div className="help-content">
        {/* Sidebar */}
        <div className="help-sidebar">
          <h3>Sisältö</h3>
          <nav>
            {helpSections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`help-nav-button ${activeSection === section.id ? 'active' : ''}`}
              >
                <span className="help-section-icon">
                  {section.icon === 'rocket' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.13 22.19l-1.63-3.26c-.13-.26-.39-.42-.68-.42H9.5c-.29 0-.55.16-.68.42l-1.63 3.26c-.13.26-.13.58 0 .84.13.26.39.42.68.42h1.32c.29 0 .55-.16.68-.42l.32-.64.32.64c.13.26.39.42.68.42h1.32c.29 0 .55-.16.68-.42.13-.26.13-.58 0-.84zM5.09 19H7v-1.5H5.09c-.29 0-.55.16-.68.42l-1.63 3.26c-.13.26-.13.58 0 .84.13.26.39.42.68.42H7v-1.5H5.09c-.29 0-.55-.16-.68-.42l-1.63-3.26c-.13-.26-.13-.58 0-.84.13-.26.39-.42.68-.42zM16.91 19H15v-1.5h1.91c.29 0 .55.16.68.42l1.63 3.26c.13.26.13.58 0 .84-.13.26-.39.42-.68.42H15v1.5h1.91c.29 0 .55-.16.68-.42l1.63-3.26c.13-.26.13-.58 0-.84-.13-.26-.39-.42-.68-.42z"/>
                      <path d="M12 2L2 12h3v8h6v-8h3L12 2z"/>
                    </svg>
                  )}
                  {section.icon === 'dashboard' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                    </svg>
                  )}
                  {section.icon === 'posts' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8V4h5v4h3v10z"/>
                    </svg>
                  )}
                  {section.icon === 'strategy' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  )}
                  {section.icon === 'calls' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  )}
                  {section.icon === 'ai' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  )}
                  {section.icon === 'settings' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                    </svg>
                  )}
                  {section.icon === 'faq' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v-2h-2v2zm0-8h2V6h-2v2z"/>
                    </svg>
                  )}
                </span>
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="help-main-content">
          {currentSection && (
            <>
              <div className="help-section-header">
                <h1 className="help-section-title">
                  <span className="help-section-icon">
                    {currentSection.icon === 'rocket' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.13 22.19l-1.63-3.26c-.13-.26-.39-.42-.68-.42H9.5c-.29 0-.55.16-.68.42l-1.63 3.26c-.13.26-.13.58 0 .84.13.26.39.42.68.42h1.32c.29 0 .55-.16.68-.42l.32-.64.32.64c.13.26.39.42.68.42h1.32c.29 0 .55-.16.68-.42.13-.26.13-.58 0-.84zM5.09 19H7v-1.5H5.09c-.29 0-.55.16-.68.42l-1.63 3.26c-.13.26-.13.58 0 .84.13.26.39.42.68.42H7v-1.5H5.09c-.29 0-.55-.16-.68-.42l-1.63-3.26c-.13-.26-.13-.58 0-.84.13-.26.39-.42.68-.42zM16.91 19H15v-1.5h1.91c.29 0 .55.16.68.42l1.63 3.26c.13.26.13.58 0 .84-.13.26-.39.42-.68.42H15v1.5h1.91c.29 0 .55-.16.68-.42l1.63-3.26c.13-.26.13-.58 0-.84-.13-.26-.39-.42-.68-.42z"/>
                        <path d="M12 2L2 12h3v8h6v-8h3L12 2z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'dashboard' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'posts' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8V4h5v4h3v10z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'strategy' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'calls' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'ai' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'settings' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'faq' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v-2h-2v2zm0-8h2V6h-2v2z"/>
                      </svg>
                    )}
                  </span>
                  {currentSection.title}
                </h1>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {currentSection.content.map((item, index) => (
                  <div key={index} className="help-content-item">
                    <h2 className="help-content-title">
                      {item.title}
                    </h2>
                    
                    <p className="help-content-description">
                      {item.description}
                    </p>

                    {item.features && (
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ 
                          margin: '0 0 12px 0', 
                          fontSize: 18, 
                          fontWeight: 600, 
                          color: '#374151' 
                        }}>
                          Ominaisuudet:
                        </h3>
                        <ul className="help-features-list">
                          {item.features.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.tips && (
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ 
                          margin: '0 0 12px 0', 
                          fontSize: 18, 
                          fontWeight: 600, 
                          color: '#374151' 
                        }}>
                          Vinkkejä:
                        </h3>
                        <ul className="help-tips-list">
                          {item.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.steps && (
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ 
                          margin: '0 0 12px 0', 
                          fontSize: 18, 
                          fontWeight: 600, 
                          color: '#374151' 
                        }}>
                          Vaiheet:
                        </h3>
                        <ol className="help-steps-list">
                          {item.steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {item.answer && (
                      <div className="help-answer-box">
                        <p className="help-answer-text">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="help-cta">
        <h2>Tarvitsetko lisäapua?</h2>
        <p>Jos et löydä vastausta kysymykseesi täältä, ota yhteyttä tukeemme.</p>
        <button
          onClick={() => navigate('/ai-chat')}
          className="help-cta-button primary"
        >
          Kysy AI Assistentilta
        </button>
        <button
          onClick={() => window.open('mailto:support@rascalai.com', '_blank')}
          className="help-cta-button secondary"
        >
          Ota yhteyttä
        </button>
      </div>
    </div>
  )
} 