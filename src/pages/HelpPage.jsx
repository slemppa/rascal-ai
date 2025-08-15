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
      icon: '🚀',
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
      icon: '📊',
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
      icon: '📝',
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
      icon: '🎯',
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
      icon: '📞',
      content: [
        {
          title: 'Uusi puhelujen hallinta',
          description: 'Puhelut-sivulla on kaksi virtaa: Massapuhelut (Google Sheets) ja Yksittäinen puhelu. Molemmat käyttävät backend-API:a ja tallentavat tapahtumat call_logs-tauluun.',
          features: [
            '📊 Massapuhelut: kolmi­vaiheinen modaali (Sheets → Tyyppi & ääni → Aloita/Ajastus)',
            '🕐 Ajastus: kellonajat aina 00 tai 30 (HH:MM/HH:MM:SS)',
            '📞 Yksittäinen puhelu: nappi avaa modaalin (Tyyppi & ääni → Nimi & numero → Soita)',
            '🔁 Numeron normalisointi: 40 → 040 → +35840…, 00358/358 → +358…',
            '🗄️ Kirjaus: call_logs (call_date, call_time, call_status=pending)',
            '🔐 Frontti kutsuu vain /api/ -endpointteja (esim. /api/mass-call)'            
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
      icon: '🤖',
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
      icon: '⚙️',
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
      icon: '❓',
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
                <span className="help-section-icon">{section.icon}</span>
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
                  <span className="help-section-icon">{currentSection.icon}</span>
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