import React, { useState, useEffect } from 'react'
import Button from './Button'
import './ModalComponents.css'

const EditCallTypeModal = ({ 
  showModal, 
  onClose, 
  editingCallType, 
  setEditingCallType, 
  onSave 
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  // ESC-toiminnallisuus - pitää olla heti useState jälkeen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showModal, onClose])

  if (!showModal || !editingCallType) return null

  const steps = [
    { id: 1, label: 'Perustiedot' },
    { id: 2, label: 'Sisältö' },
    { id: 3, label: 'Lisäasetukset' },
    { id: 4, label: 'Yhteenveto' }
  ]

  // Tyhjän tilan klikkaus
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    onSave()
  }

  return (
    <div className="modal-overlay modal-overlay--light" onClick={handleOverlayClick}>
      <div className="modal-container edit-call-type-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            Muokkaa puhelun tyyppiä
          </h2>
          <Button
            onClick={onClose}
            variant="secondary"
            className="modal-close-btn"
          >
            ×
          </Button>
        </div>

        {/* Vaiheindikaattori */}
        <div className="steps-container">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="step-item">
                <div className={`step-number ${currentStep >= step.id ? 'active' : ''}`}>
                  {step.id}
                </div>
                <span className={`step-label ${currentStep >= step.id ? 'active' : ''}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`step-separator ${currentStep > step.id ? 'active' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Sisältö */}
        <div className="modal-content">
          {currentStep === 1 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Nimi
                </label>
                <input
                  type="text"
                  value={editingCallType.name || editingCallType.callType || editingCallType.label || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, name: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Tila
                </label>
                <select
                  value={editingCallType.status || 'Active'}
                  onChange={e => setEditingCallType({ ...editingCallType, status: e.target.value })}
                  className="form-select"
                >
                  <option value="Active">Aktiivinen</option>
                  <option value="Draft">Luonnos</option>
                  <option value="Archived">Arkistoitu</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Versio
                </label>
                <input
                  type="text"
                  value={editingCallType.version || 'v1.0'}
                  onChange={e => setEditingCallType({ ...editingCallType, version: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">AI-rooli</label>
                  <textarea
                    value={editingCallType.identity || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, identity: e.target.value })}
                    placeholder={
`• Kuka assistentti on (nimi + rooli)?\n• Minkä brändin nimissä toimii?\n• Mitä ongelmaa/tilannetta auttaa ratkaisemaan?\n• Mitä korkeantason tavoitetta palvelee?`
                    }
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div>Olet [Yritys]n AI‑assistentti [Nimi]. Autat [kohdeyleisöä] [aihe]‑asioissa ja ohjaat tarvittaessa ihmisasiantuntijalle.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Puhumistyylin kuvaus</label>
                  <textarea
                    value={editingCallType.style || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, style: e.target.value })}
                    placeholder={
`• Kieli ja puhuttelu (sinä/te).\n• Sävyt: ystävällinen/napakka/ammatillinen.\n• Vältettävät asiat (jargoni, pitkät lauseet).\n• Rytmivinkit (lyhyet lauseet, tauot … / –).`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div>Puhu selkeää suomea, sinuttele, ole lämmin ja napakka. Vältä jargonia. Käytä lyhyitä lauseita ja luonnollisia taukoja (… tai –).</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Puhelun tavoitteet</label>
                  <textarea
                    value={editingCallType.goals || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, goals: e.target.value })}
                    placeholder={
`• Listaa 3–5 konkreettista tavoitetta tälle kontaktityypille.\n• Mitä tietoa pitää kerätä?\n• Mitä lopputulos/next step on?`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div>1) Selvitä [X]. 2) Kartoita [kiinnostus/haasteet]. 3) Tarjoa apuvaihtoehto. 4) Kysy jatkoyhteydenotto. 5) Kerää paras aika ja yhteystapa.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Keskusteluohjeet</label>
                  <textarea
                    value={editingCallType.guidelines || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, guidelines: e.target.value })}
                    placeholder={
`• Miten keskustelua rytmitetään.\n• Yksi kysymys kerrallaan, odota vastaus.\n• Täsmennykset, jos vastaus on epäselvä.\n• Jos asiakas kysyy → vastaa lyhyesti ja palaa runkoon.\n• Empatia ja keskeyttämättömyys.`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div>Esitä vain yksi kysymys kerrallaan ja odota vastaus. Jos vastaus on epäselvä, pyydä esimerkki. Vastaa asiakkaan kysymyksiin ytimekkäästi ja jatka runkoa.</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Aloitusrepliikki</label>
                  <textarea
                    value={editingCallType.intro || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, intro: e.target.value })}
                    placeholder={
`• Tervehdys + esittely + syy yhteyteen.\n• Aseta odotukset (kysyn muutaman kysymyksen).\n• Kutsu jatkamaan.`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div>Moikka! Täällä [Nimi], [Yritys]n AI‑assistentti. Soitan/ vastaan, koska [syy]. Jos sopii, kysyn pari ytimekästä kysymystä — aloitetaanko?</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Kysymyslista</label>
                  <textarea
                    value={editingCallType.questions || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, questions: e.target.value })}
                    placeholder={
`• Numeroi 4–7 ydinkysymystä.\n• Kirjoita jokainen omalle rivilleen.\n• Lisää haarat: Jos ei/kyllä → tee X.\n• Lisää: odota vastausta joka väliin.`
                    }
                    rows={8}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div>{`1) Olitko mukana [tapahtuma]?\nodota vastausta\nJos ei → kysy haluaako linkin tai tallenteen.\nodota vastausta\n2) Mikä sai kiinnostumaan [aiheesta]?\nodota vastausta\n3) Missä koet eniten haastetta: [vaihtoehdot]?\nodota vastausta\n4) Haluatko, että asiantuntija on yhteydessä?\nodota vastausta\nJos kyllä → kysy paras aika ja tapa (soitto/sähköposti).`}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Lopetusrepliikki</label>
                  <textarea
                    value={editingCallType.outro || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, outro: e.target.value })}
                    placeholder={
`• Kiitä ja tarkista, onko muuta.\n• Tarjoa yhteenveto/linkit sähköpostiin.\n• Vahvista seuraavat askeleet.\n• Päätä ystävällisesti.`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div>{`Kiitos juttutuokiosta! Laitanko yhteenvedon ja linkit sähköpostilla?\nodota vastausta\nSovitaan näin: [seuraava askel]. Mukavaa päivää ja kuulemiin!`}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Lisämuistiinpanot</label>
                  <textarea
                    value={editingCallType.notes || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, notes: e.target.value })}
                    placeholder={
`• Mitä metatietoa tulee kirjata (aika, tapa, lupa, sähköposti, toiveet).\n• Erityiset liput/etiketit (kiireellinen, palautetta, eskalointi).`
                    }
                    rows={4}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div>Tallenna: suosittu yhteydenottoaika, yhteystapa, sähköposti, webinaarilinkin/tallenteen pyyntö, lyhyt yhteenveto haasteista/tavoitteista.</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Yhteenveto (analytiikka)</label>
                  <textarea
                    value={editingCallType.summary || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, summary: e.target.value })}
                    placeholder={
`• 2–3 virkkeen tiivistelmä suomeksi.\n• Kerro mitä selvisi + sovitut jatkotoimet.`
                    }
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div>Tiivistä 2–3 virkkeeseen: osallistuiko [tapahtuma], tärkeimmät kiinnostukset/haasteet, sovitut next steps (soittoaika/tapa).</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
                <div className="form-group">
                  <label className="form-label">Menestyksen arviointi (analytiikka)</label>
                  <textarea
                    value={editingCallType.success_assessment || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, success_assessment: e.target.value })}
                    placeholder={
`• Arvioi 2–3 virkkeessä, täyttyivätkö Goals‑kohdan tavoitteet.\n• Kerro miksi onnistui/ei onnistunut ja mainitse puuttuvat kohdat.`
                    }
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 13, color: '#374151' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Mini‑esimerkki</div>
                  <div>Arvioi, saavutettiinko: 1) osallistumistieto, 2) kiinnostukset/haasteet, 3) jatkoyhteydenotto, 4) yhteydenoton aika/tapa. Perustele lyhyesti.</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <div className="modal-actions-left">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              Peruuta
            </Button>
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handlePrevious}
                variant="secondary"
              >
                Edellinen
              </Button>
            )}
          </div>
          
          <div className="modal-actions-right">
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
              >
                Seuraava
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
              >
                Tallenna muutokset
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditCallTypeModal 