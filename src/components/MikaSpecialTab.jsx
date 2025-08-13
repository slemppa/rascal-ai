import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button.jsx'
import { supabase } from '../lib/supabase'

const MikaSpecialTab = ({ 
  user, 
  callTypes, 
  selectedVoice, 
  mikaSearchResults, 
  mikaSearchName, 
  setMikaSearchName, 
  mikaSearchTitle, 
  setMikaSearchTitle, 
  mikaSearchOrganization, 
  setMikaSearchOrganization, 
  mikaSearchLoading, 
  loadingMikaContacts, 
  mikaContactsError, 
  handleMikaSearch, 
  handleMikaMassCall, 
  handleMikaSingleCall, 
  handleMikaMassCallAll,
  handleMikaMassCallSelected
}) => {
  // Puhelun tyypin valitsemismodaali state
  const [showCallTypeModal, setShowCallTypeModal] = useState(false)
  const [selectedCallTypeForMika, setSelectedCallTypeForMika] = useState('')
  const [selectedVoiceForMika, setSelectedVoiceForMika] = useState(selectedVoice || 'rascal-nainen-1')
  const [mikaCallTypeLoading, setMikaCallTypeLoading] = useState(false)
  const [selectedContactIds, setSelectedContactIds] = useState(new Set())
  const [selectedContactsForModal, setSelectedContactsForModal] = useState([])
  
  // Äänen valinta vaihtoehdot
  const voiceOptions = [
    { value: 'rascal-nainen-1', label: 'Aurora (Nainen, Lämmin ja Ammattimainen)', id: 'GGiK1UxbDRh5IRtHCTlK' },
    { value: 'rascal-nainen-2', label: 'Lumi (Nainen, Positiivinen ja Ilmeikäs)', id: 'bEe5jYFAF6J2nz6vM8oo' },
    { value: 'rascal-mies-1', label: 'Kai (Mies, Rauhallinen ja Luottamusta herättävä)', id: 'waueh7VTxMDDIYKsIaYC' },
    { value: 'rascal-mies-2', label: 'Veeti (Mies, Nuorekas ja Energinen)', id: 's6UtVF1khAck9KlohM9j' }
  ]
  
  // Apufunktio puhelinnumeron normalisointiin +358-muotoon
  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return null
    
    // Poista kaikki ei-numeeriset merkit paitsi + ja -
    let cleaned = phoneNumber.toString().replace(/[^\d+\-]/g, '')
    
    // Jos numero alkaa +358:lla, palauta sellaisenaan
    if (cleaned.startsWith('+358')) {
      return cleaned
    }
    
    // Jos numero alkaa 358:lla ilman +, lisää +
    if (cleaned.startsWith('358')) {
      return '+' + cleaned
    }
    
    // Jos numero alkaa 0:lla, poista se ja lisää +358
    if (cleaned.startsWith('0')) {
      return '+358' + cleaned.substring(1)
    }
    
    // Jos numero on 9 numeroa (suomalainen mobiili), lisää +358
    if (cleaned.length === 9 && /^\d{9}$/.test(cleaned)) {
      return '+358' + cleaned
    }
    
    // Jos numero on 10 numeroa ja alkaa 0:lla, poista 0 ja lisää +358
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return '+358' + cleaned.substring(1)
    }
    
    // Jos numero on jo oikeassa muodossa (10-15 numeroa), lisää +358
    if (cleaned.length >= 10 && cleaned.length <= 15 && /^\d+$/.test(cleaned)) {
      return '+358' + cleaned
    }
    
    // Jos mikään ei täsmää, palauta alkuperäinen
    return phoneNumber
  }

  const handleMikaMassCallAllWithType = async () => {
    if (!selectedCallTypeForMika) {
      alert('Valitse puhelun tyyppi!')
      return
    }
    
    if (!selectedVoiceForMika) {
      alert('Valitse ääni!')
      return
    }

    setMikaCallTypeLoading(true)
    
    try {
      // Käytä valittuja kontakteja, jos niitä on, muuten kaikki hakutulokset
      const sourceContacts = (selectedContactsForModal && selectedContactsForModal.length > 0)
        ? selectedContactsForModal
        : mikaSearchResults

      // Muodosta kontaktidata
      const allContactsData = sourceContacts.map(contact => ({
        id: contact.id || null,
        name: contact.name,
        phone: contact.phones && contact.phones[0] ? contact.phones[0] : '',
        email: contact.primary_email || (contact.emails && contact.emails[0]) || '',
        company: contact.organization?.name || '',
        title: contact.custom_fields && contact.custom_fields[0] ? contact.custom_fields[0] : '',
        address: contact.organization?.address || ''
      })).filter(contact => contact.phone) // Vain kontakteja joilla on puhelinnumero
      
      if (allContactsData.length === 0) {
        alert('Ei kontakteja puhelinnumerolla!')
        return
      }
      
      // Hae skripti ja call_type_id valitusta puhelun tyypistä
      const selectedCallTypeData = callTypes.find(type => type.value === selectedCallTypeForMika)
      if (!selectedCallTypeData) {
        throw new Error('Valittua puhelun tyyppiä ei löytynyt')
      }
      
      const script = selectedCallTypeData?.intro || 'Hei! Soitan sinulle...'
      const callTypeId = selectedCallTypeData.id || 'ef0ae790-b6c0-4264-a798-a913549ef8ea' // Fallback
      
      // Debug: Tulosta data
      console.log('🔍 Lisätään dataa Supabaseen:', {
        contacts: allContactsData,
        callType: selectedCallTypeForMika,
        callTypeId: callTypeId,
        script: script,
        voice_id: selectedVoice,
        user_id: user?.id
      })
      
      // Käytä Supabase clientia suoraan lisäämään tiedot
      console.log('🔍 Käytetään Supabase clientia lisäämään tiedot...')
      
      // Hae ensin users.id käyttäen auth_user_id:tä
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single()
      
      if (userError || !userProfile) {
        throw new Error('Käyttäjää ei löytynyt')
      }
      
      // Valmistellaan call_logs data
      const callLogs = []
      let startedCalls = 0
      let failedCalls = 0
      
      for (const contact of allContactsData) {
        try {
          // Etsi puhelinnumero ja nimi
          let phoneNumber = contact.phone || (contact.phones && contact.phones[0]) || contact.phone_number || contact.tel
          let name = contact.name || contact.customer_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
          
          if (!name) {
            const possibleNameFields = ['title', 'company', 'organization', 'email']
            for (const field of possibleNameFields) {
              if (contact[field]) {
                name = contact[field]
                break
              }
            }
          }
          
          if (!name) {
            name = `Asiakas ${startedCalls + 1}`
          }
          
          if (phoneNumber) {
            // Normalisoi puhelinnumero +358-muotoon
            const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber)
            
            // Hae äänen ID valitusta äänestä
            const selectedVoiceObj = voiceOptions.find(v => v.value === selectedVoiceForMika)
            const voiceId = selectedVoiceObj?.id || selectedVoiceForMika
            
            callLogs.push({
              user_id: userProfile.id,
              customer_name: name,
              phone_number: normalizedPhoneNumber, // Käytä normalisoitua numeroa
              call_type: selectedCallTypeForMika,
              call_type_id: callTypeId,
              voice_id: voiceId, // Käytä äänen ID:tä
              call_date: new Date().toISOString(),
              call_status: 'pending',
              campaign_id: `mika-mass-call-${Date.now()}`,
              summary: `Mika Special mass-call: ${script.trim().substring(0, 100)}...`,
              crm_id: contact.id || null
            })
            
            console.log(`✅ Lisätään kontakti: ${name} (${phoneNumber} → ${normalizedPhoneNumber}) - Call Type: ${selectedCallTypeForMika} - Voice: ${selectedVoiceForMika} (ID: ${voiceId})`)
            startedCalls++
          } else {
            console.log(`❌ Ei puhelinnumeroa: ${name}`)
            failedCalls++
          }
        } catch (error) {
          console.error(`❌ Virhe kontaktin käsittelyssä: ${contact.name}`, error)
          failedCalls++
        }
      }
      
      if (callLogs.length === 0) {
        throw new Error('Puhelinnumeroita ei löytynyt kontaktidatasta')
      }
      
      // Lisää call_logs Supabaseen
      const { data: insertedLogs, error: insertError } = await supabase
        .from('call_logs')
        .insert(callLogs)
        .select()
      
      if (insertError) {
        console.error('Supabase insert error:', insertError)
        throw new Error(`Virhe call_logs kirjoittamisessa: ${insertError.message}`)
      }
      
      console.log(`✅ Lisätty ${insertedLogs.length} puhelua call_logs tauluun`)
      
      const result = {
        success: true,
        startedCalls: startedCalls,
        failedCalls: failedCalls,
        message: 'Tiedot lisätty onnistuneesti Supabaseen'
      }
      
      // Sulje modaali ja tyhjennä valinnat
      setShowCallTypeModal(false)
      setSelectedCallTypeForMika('')
      setSelectedContactsForModal([])
      setSelectedContactIds(new Set())
      
      // Näytä onnistumisilmoitus
      alert(`✅ Mika Special mass-call käynnistetty onnistuneesti!\n\nAloitettu: ${result.startedCalls} puhelua\nOhitettu: ${result.failedCalls} kontakti\n\nPuhelut on tallennettu Supabaseen ja ne alkavat pian!`)
      
    } catch (error) {
      console.error('Frontend: Error starting Mika mass calls:', error)
      alert(`Virhe mass-call käynnistyksessä: ${error.message}`)
    } finally {
      setMikaCallTypeLoading(false)
    }
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32, width: '100%' }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 24 }}>
          🎯 Mika Special - Kontaktihaku
        </h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleMikaSearch();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                Nimi
              </label>
              <input
                type="text"
                value={mikaSearchName}
                onChange={e => setMikaSearchName(e.target.value)}
                placeholder="Syötä nimi..."
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 16 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                Tehtävänimike
              </label>
              <input
                type="text"
                value={mikaSearchTitle}
                onChange={e => setMikaSearchTitle(e.target.value)}
                placeholder="Syötä tehtävänimike..."
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 16 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                Organisaatio
              </label>
              <input
                type="text"
                value={mikaSearchOrganization}
                onChange={e => setMikaSearchOrganization(e.target.value)}
                placeholder="Syötä organisaatio..."
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 16 }}
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="primary"
            style={{ padding: '12px 24px', fontSize: 16, fontWeight: 600, alignSelf: 'flex-start' }}
            disabled={mikaSearchLoading || loadingMikaContacts}
          >
            {mikaSearchLoading ? 'Haetaan...' : 'Hae'}
          </Button>
        </form>
        {loadingMikaContacts && (
          <div style={{ textAlign: 'center', color: '#6b7280', marginBottom: 16 }}>Ladataan kontakteja...</div>
        )}
        {mikaContactsError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, color: '#dc2626', fontSize: 14, marginBottom: 16 }}>
            ❌ {mikaContactsError}
          </div>
        )}
        {mikaSearchResults.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', margin: 0 }}>Hakutulokset ({mikaSearchResults.length})</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  onClick={() => {
                    const selectedRaw = mikaSearchResults
                      .map((c, idx) => ({ c, key: c.id || idx }))
                      .filter(({ key }) => selectedContactIds.has(key))
                      .map(({ c }) => c)
                      .filter(c => c.phones && c.phones[0])
                    if (selectedRaw.length === 0) {
                      alert('Valitse vähintään yksi kontakti, jolla on puhelinnumero')
                      return
                    }
                    setSelectedContactsForModal(selectedRaw)
                    setShowCallTypeModal(true)
                  }}
                  variant="secondary"
                  disabled={selectedContactIds.size === 0}
                  style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600 }}
                >
                  📞 Lisää valitut mass-calls
                </Button>
                <Button
                  onClick={() => setShowCallTypeModal(true)}
                  variant="primary"
                  style={{ 
                    padding: '10px 20px', 
                    fontSize: 14, 
                    fontWeight: 600,
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  📞 Aloitetaan puhelut ({mikaSearchResults.length})
                </Button>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {mikaSearchResults.map((contact, idx) => (
                <div key={contact.id || idx} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedContactIds.has(contact.id || idx)}
                      onChange={(e) => {
                        const next = new Set(selectedContactIds)
                        const key = contact.id || idx
                        if (e.target.checked) next.add(key); else next.delete(key)
                        setSelectedContactIds(next)
                      }}
                    />
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{contact.name || 'Nimetön'}</div>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    <strong>Tehtävänimike:</strong> {contact.custom_fields && contact.custom_fields[0] ? contact.custom_fields[0] : 'Ei määritelty'}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    <strong>Organisaatio:</strong> {contact.organization?.name || 'Ei määritelty'}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    <strong>Osoite:</strong> {contact.organization?.address || 'Ei määritelty'}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    <strong>Sähköposti:</strong> {contact.primary_email || (contact.emails && contact.emails[0]) || '-'}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    <strong>Puhelin:</strong> {contact.phones && contact.phones[0] ? contact.phones[0] : '-'}
                  </div>
                  {contact.result_score && (
                    <div style={{ color: '#059669', fontSize: 12, fontStyle: 'italic' }}>
                      Hakupisteet: {Math.round(contact.result_score * 100)}%
                    </div>
                  )}
                  
                  {/* Mass-calls -nappi */}
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <Button
                      onClick={() => {
                        // Lisää vain tämä kontakti mass-calls -palikkaan
                        handleMikaMassCall(contact)
                      }}
                      variant="primary"
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: 14, 
                        fontWeight: 600,
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                      disabled={!contact.phones || contact.phones.length === 0}
                    >
                      📞 Lisää mass-calls
                    </Button>
                    <Button
                      onClick={() => handleMikaSingleCall(contact)}
                      variant="secondary"
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: 14, 
                        fontWeight: 600,
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                      disabled={!contact.phones || contact.phones.length === 0}
                    >
                      📱 Yksittäinen soitto
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ color: '#6b7280', fontSize: 15, marginTop: 24 }}>
            {(mikaSearchName || mikaSearchTitle || mikaSearchOrganization) && !mikaSearchLoading && 'Ei tuloksia haulla.'}
            {!mikaSearchName && !mikaSearchTitle && !mikaSearchOrganization && 'Syötä vähintään yksi hakukenttä ja paina Hae.'}
          </div>
        )}
      </div>

      {/* Puhelun tyypin valitsemismodaali */}
      {showCallTypeModal && createPortal(
        <div 
          onClick={() => setShowCallTypeModal(false)}
          className="modal-overlay modal-overlay--dark"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-container"
            style={{ maxWidth: '500px' }}
          >
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: 20 }}>
                📞 Valitse puhelun tyyppi ja ääni
              </h2>
              <Button
                onClick={() => setShowCallTypeModal(false)}
                variant="secondary"
                className="modal-close-btn"
              >
                ✕
              </Button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: '#6b7280' }}>
                Valitse puhelun tyyppi ja ääni {(selectedContactsForModal.length > 0 ? selectedContactsForModal.length : mikaSearchResults.length)} kontaktille:
              </p>
              
              <label className="label">Puhelun tyyppi</label>
              <select 
                value={selectedCallTypeForMika} 
                onChange={e => setSelectedCallTypeForMika(e.target.value)}
                className="select"
                style={{ width: '100%', marginBottom: 16 }}
              >
                <option value="">Valitse puhelun tyyppi...</option>
                {callTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              
              <label className="label">Ääni</label>
              <select 
                value={selectedVoiceForMika} 
                onChange={e => setSelectedVoiceForMika(e.target.value)}
                className="select"
                style={{ width: '100%', marginBottom: 16 }}
              >
                {voiceOptions.map(voice => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label}
                  </option>
                ))}
              </select>
              
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setShowCallTypeModal(false)}
                  variant="secondary"
                >
                  Peruuta
                </Button>
                <Button
                  onClick={handleMikaMassCallAllWithType}
                  variant="primary"
                  disabled={!selectedCallTypeForMika || !selectedVoiceForMika || mikaCallTypeLoading}
                >
                  {mikaCallTypeLoading ? 'Käsitellään...' : 'Aloita soitot'}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default MikaSpecialTab 