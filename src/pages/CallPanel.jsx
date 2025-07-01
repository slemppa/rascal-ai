import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './CallPanel.css'
import CallStats from './CallStats'
import PageHeader from '../components/PageHeader'

export default function CallPanel() {
  const [sheetUrl, setSheetUrl] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [callStatus, setCallStatus] = useState(null)
  const [polling, setPolling] = useState(false)
  const pollingRef = useRef(null)
  const [stats, setStats] = useState({ totalCount: 0, calledCount: 0, failedCount: 0 })
  
  // Uudet state-muuttujat
  const [callType, setCallType] = useState('myynti')
  const [script, setScript] = useState('Hei! Soitan [Yritys] puolesta. Meillä on kiinnostava tarjous teille...')
  const [selectedVoice, setSelectedVoice] = useState('nova')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [calling, setCalling] = useState(false)
  const [inboundVoice, setInboundVoice] = useState('nova')
  const [inboundScript, setInboundScript] = useState('Kiitos soitostasi! Olen AI-assistentti ja autan sinua mielellään...')
  
  const callTypes = [
    { value: 'myynti', label: 'Myyntipuhelu' },
    { value: 'asiakaspalvelu', label: 'Asiakaspalvelu' },
    { value: 'kartoitus', label: 'Tarpeiden kartoitus' },
    { value: 'seuranta', label: 'Seurantapuhelu' },
    { value: 'kiitos', label: 'Kiitospuhelu' }
  ]

  const voiceOptions = [
    { value: 'nova', label: 'Nova (Nainen, Neutraali)' },
    { value: 'alloy', label: 'Alloy (Miestä muistuttava, Neutraali)' },
    { value: 'echo', label: 'Echo (Mies, Brittiläinen)' },
    { value: 'fable', label: 'Fable (Nainen, Brittiläinen)' },
    { value: 'onyx', label: 'Onyx (Mies, Amerikkalainen)' },
    { value: 'shimmer', label: 'Shimmer (Nainen, Lämmin)' }
  ]

  const handleValidate = async () => {
    setValidating(true)
    setError('')
    setValidationResult(null)
    try {
      // Placeholder URL
      const res = await axios.post('https://oma-n8n-url.fi/webhook/validate-sheet', { sheetUrl })
      setValidationResult(res.data)
      setStats({
        totalCount: res.data.phoneCount || 0,
        calledCount: 0,
        failedCount: 0
      })
    } catch (e) {
      setError('Validointi epäonnistui')
    } finally {
      setValidating(false)
    }
  }

  const handleStartCalls = async () => {
    setStarting(true)
    setError('')
    try {
      // Placeholder URL
      await axios.post('https://oma-n8n-url.fi/webhook/start-calls', { sheetUrl })
      setPolling(true)
    } catch (e) {
      setError('Soittojen käynnistys epäonnistui')
    } finally {
      setStarting(false)
    }
  }

  const handleSingleCall = async () => {
    setCalling(true)
    setError('')
    try {
      // Placeholder URL
      await axios.post('https://oma-n8n-url.fi/webhook/single-call', { 
        phoneNumber,
        callType,
        script,
        voice: selectedVoice
      })
      alert(`Soitto numerolle ${phoneNumber} aloitettu!`)
      setPhoneNumber('') // Tyhjennä kenttä onnistuneen soiton jälkeen
    } catch (e) {
      setError('Yksittäisen puhelun aloitus epäonnistui')
    } finally {
      setCalling(false)
    }
  }

  const handleSaveInboundSettings = async () => {
    setError('')
    try {
      await axios.post('https://oma-n8n-url.fi/webhook/save-inbound-settings', {
        voice: inboundVoice,
        script: inboundScript
      })
      alert('Inbound-asetukset tallennettu!')
    } catch (e) {
      setError('Inbound-asetusten tallennus epäonnistui')
    }
  }

  // Pollaa soittojen tilaa 5s välein
  useEffect(() => {
    if (polling) {
    pollingRef.current = setInterval(async () => {
      try {
          const res = await axios.get('https://oma-n8n-url.fi/webhook/call-status')
        setCallStatus(res.data)
          setStats(res.data.stats || stats)
          
          // Pysäytä polling jos kaikki soittot on tehty
          if (res.data.status === 'completed') {
            setPolling(false)
          }
      } catch (e) {
          console.error('Polling error:', e)
      }
    }, 5000)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [polling])

  // Responsiivinen apu
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 600 && window.innerWidth < 1024;
  let gridCols = '1fr';
  if (isTablet) gridCols = '1fr 1fr';
  if (!isMobile && !isTablet) gridCols = '1fr 1fr 1fr';

  return (
    <>
      <PageHeader title="Puhelut" />
      <div style={{ padding: 32 }}>
        {/* Kehitysvaroitus */}
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>
            🚧 Tätä työstetään
          </div>
          <div style={{ color: '#a16207', fontSize: 14 }}>
            Puheluominaisuus on kehityksessä. Toiminnot eivät ole vielä käytettävissä.
          </div>
        </div>
        
        <div className="callpanel-root" style={{ 
          display: 'grid', 
          gridTemplateColumns: gridCols, 
          gap: 24, 
          marginTop: 24 
        }}>
          {/* Vasemman puolen laatikko */}
          <div>
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
              Aloita puhelut
            </h2>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Google Sheets URL
              </label>
            <input
                type="url"
              value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleValidate}
              disabled={validating || !sheetUrl}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: validating || !sheetUrl ? 'not-allowed' : 'pointer',
                  opacity: validating || !sheetUrl ? 0.6 : 1
                }}
            >
                {validating ? 'Validoitaan...' : 'Validoi'}
            </button>
              
              <button
                onClick={handleStartCalls}
                disabled={starting || !validationResult}
                style={{
                  padding: '12px 24px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: starting || !validationResult ? 'not-allowed' : 'pointer',
                  opacity: starting || !validationResult ? 0.6 : 1
                }}
              >
                {starting ? 'Käynnistetään...' : 'Aloita soittot'}
              </button>
            </div>
            
            {error && (
              <div style={{
                marginTop: 16,
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626'
              }}>
                {error}
              </div>
            )}
            
            {validationResult && (
              <div style={{
                marginTop: 16,
                padding: '12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                color: '#16a34a'
              }}>
                <strong>Validointi onnistui!</strong><br/>
                Löydetty {validationResult.phoneCount} puhelinnumeroa.
              </div>
            )}
            </div>

            {/* Yksittäinen puhelu -laatikko */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32, marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
                Tee puhelu
              </h2>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14 }}>
                  Puhelinnumero
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+358 40 123 4567"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button
                onClick={handleSingleCall}
                disabled={calling || !phoneNumber.trim()}
                style={{
                  padding: '12px 24px',
                  background: calling || !phoneNumber.trim() ? '#9ca3af' : '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: calling || !phoneNumber.trim() ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {calling ? '📞 Soittaa...' : '📞 Soita'}
              </button>

              <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
                Käyttää oikealla valittuja asetuksia (tyyppi, ääni, skripti)
              </div>
            </div>
            
            {callStatus && (
              <CallStats 
                status={callStatus.status}
                stats={stats}
                calls={callStatus.calls || []}
              />
            )}
          </div>

          {/* Oikean puolen laatikko */}
          <div>
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32, marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
                Toiminnot
              </h2>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14 }}>
                  Puhelun tyyppi
                </label>
                <select
                  value={callType}
                  onChange={(e) => setCallType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: 14,
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {callTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14 }}>
                  Ääni
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: 14,
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {voiceOptions.map(voice => (
                    <option key={voice.value} value={voice.value}>
                      {voice.label}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Valitse puheluissa käytettävä ääni
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Placeholder toiminnallisuus
                      alert(`Testattaisiin ${voiceOptions.find(v => v.value === selectedVoice)?.label} ääntä`)
                    }}
                    style={{
                      padding: '4px 12px',
                      fontSize: 12,
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: '#374151'
                    }}
                  >
                    🔊 Testaa ääni
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14 }}>
                  Skripti
                </label>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Kirjoita puheluskripti..."
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: 120
                  }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                  Käytä [Yritys], [Nimi], [Tuote] yms. paikkamerkkejä personointiin
                </div>
                             </div>
             </div>
           </div>

           {/* Inbound-puhelut laatikko */}
           <div>
             <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32 }}>
               <h2 style={{ margin: '0 0 24px 0', fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
                 Inbound-asetukset
               </h2>
               
               <div style={{ marginBottom: 24 }}>
                 <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14 }}>
                   Ääni
                 </label>
                 <select
                   value={inboundVoice}
                   onChange={(e) => setInboundVoice(e.target.value)}
                   style={{
                     width: '100%',
                     padding: '12px 16px',
                     border: '1px solid #d1d5db',
                     borderRadius: 8,
                     fontSize: 14,
                     background: '#fff',
                     cursor: 'pointer'
                   }}
                 >
                   {voiceOptions.map(voice => (
                     <option key={voice.value} value={voice.value}>
                       {voice.label}
                     </option>
                   ))}
                 </select>
                 <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ fontSize: 12, color: '#6b7280' }}>
                     Ääni inbound-puheluille
                   </div>
                   <button
                     type="button"
                     onClick={() => {
                       alert(`Testattaisiin ${voiceOptions.find(v => v.value === inboundVoice)?.label} ääntä`)
                     }}
                     style={{
                       padding: '4px 12px',
                       fontSize: 12,
                       background: '#f3f4f6',
                       border: '1px solid #d1d5db',
                       borderRadius: 6,
                       cursor: 'pointer',
                       color: '#374151'
                     }}
                   >
                     🔊 Testaa
                   </button>
                 </div>
               </div>

               <div style={{ marginBottom: 24 }}>
                 <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14 }}>
                   Inbound-skripti
                 </label>
                 <textarea
                   value={inboundScript}
                   onChange={(e) => setInboundScript(e.target.value)}
                   placeholder="Kirjoita inbound-puhelujen skripti..."
                   rows={6}
                   style={{
                     width: '100%',
                     padding: '12px 16px',
                     border: '1px solid #d1d5db',
                     borderRadius: 8,
                     fontSize: 14,
                     fontFamily: 'inherit',
                     resize: 'vertical',
                     minHeight: 100
                   }}
                 />
                 <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                   Tervehdys ja ohjeistus asiakkaille jotka soittavat sinulle
                 </div>
               </div>

               <button
                 onClick={handleSaveInboundSettings}
                 style={{
                   width: '100%',
                   padding: '12px 24px',
                   background: '#2563eb',
                   color: '#fff',
                   border: 'none',
                   borderRadius: 8,
                   cursor: 'pointer',
                   fontSize: 14,
                   fontWeight: 600,
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: 8
                 }}
               >
                 💾 Tallenna asetukset
               </button>
             </div>
           </div>
         </div>
        </div>
      </>
    )
  } 