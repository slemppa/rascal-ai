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
  const [singleCallError, setSingleCallError] = useState('')
  const [starting, setStarting] = useState(false)
  const [callStatus, setCallStatus] = useState(null)
  const [polling, setPolling] = useState(false)
  const pollingRef = useRef(null)
  const [stats, setStats] = useState({ totalCount: 0, calledCount: 0, failedCount: 0 })
  
  // Uudet state-muuttujat
  const [callType, setCallType] = useState('myynti')
  const [script, setScript] = useState('Hei! Soitan [Yritys] puolesta. Meillä on kiinnostava tarjous teille...')
  const [selectedVoice, setSelectedVoice] = useState('aurora')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [calling, setCalling] = useState(false)
  const [inboundVoice, setInboundVoice] = useState('aurora')
  const [inboundScript, setInboundScript] = useState('Kiitos soitostasi! Olen AI-assistentti ja autan sinua mielellään...')
  const [currentAudio, setCurrentAudio] = useState(null)
  const [audioInfo, setAudioInfo] = useState('')
  const audioElementsRef = useRef([])
  const [activeTab, setActiveTab] = useState('calls')
  
  const callTypes = [
    { value: 'myynti', label: 'Myyntipuhelu' },
    { value: 'asiakaspalvelu', label: 'Asiakaspalvelu' },
    { value: 'kartoitus', label: 'Tarpeiden kartoitus' },
    { value: 'seuranta', label: 'Seurantapuhelu' },
    { value: 'kiitos', label: 'Kiitospuhelu' }
  ]

  const voiceOptions = [
    { value: 'aurora', label: 'Aurora (Nainen, Lämmin ja Ammattimainen)' },
    { value: 'lumi', label: 'Lumi (Nainen, Positiivinen ja Ilmeikäs)' },
    { value: 'kai', label: 'Kai (Mies, Rauhallinen ja Luottamusta herättävä)' },
    { value: 'veeti', label: 'Veeti (Mies, Nuorekas ja Energinen)' }
  ]

  // Pysäytä kaikki äänielementit
  const stopAllAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }
    
    audioElementsRef.current.forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause()
        audio.currentTime = 0
      }
    })
    
    audioElementsRef.current = []
    setCurrentAudio(null)
  }

  // Ääninäytteen toisto
  const playVoiceSample = (voiceValue) => {
    stopAllAudio()

    const audioFileMap = {
      'aurora': 'rascal-nainen-1',
      'lumi': 'rascal-nainen-2', 
      'kai': 'rascal-mies-1',
      'veeti': 'rascal-mies-2'
    }

    const voiceName = voiceOptions.find(v => v.value === voiceValue)?.label || voiceValue
    const fileName = audioFileMap[voiceValue]
    
    if (!fileName) {
      setAudioInfo('❌ Ääninäyte ei ole saatavilla')
      return
    }

    setAudioInfo(`🔄 Ladataan ${voiceName}...`)

    const tryFormats = ['mp3', 'wav', 'ogg']
    let audio = null

    const tryNextFormat = (formatIndex = 0) => {
      if (formatIndex >= tryFormats.length) {
        setAudioInfo('❌ Ääninäytettä ei voitu toistaa')
        return
      }

      const format = tryFormats[formatIndex]
      audio = new Audio(`/${fileName}.${format}`)
      
      audioElementsRef.current.push(audio)
      
      audio.onloadedmetadata = () => {
        const duration = Math.round(audio.duration)
        setAudioInfo(`📀 ${voiceName} (${duration}s)`)
      }
      
      audio.oncanplaythrough = () => {
        setCurrentAudio(audio)
        audio.play().then(() => {
          setAudioInfo(`▶️ Soittaa: ${voiceName}`)
        }).catch(e => {
          console.error('Äänen toisto epäonnistui:', e)
          setAudioInfo('❌ Äänen toisto epäonnistui')
        })
      }
      
      audio.onended = () => {
        setAudioInfo(`✅ Valmis: ${voiceName}`)
        setCurrentAudio(null)
        audioElementsRef.current = audioElementsRef.current.filter(a => a !== audio)
        setTimeout(() => setAudioInfo(''), 3000)
      }
      
      audio.onerror = () => {
        audioElementsRef.current = audioElementsRef.current.filter(a => a !== audio)
        tryNextFormat(formatIndex + 1)
      }
    }

    tryNextFormat()
  }

  const handleValidate = async () => {
    setValidating(true)
    setError('')
    setValidationResult(null)
    try {
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
      // Lähetä sekä sheetUrl että Toiminnot-moduulin asetukset
      await axios.post('https://oma-n8n-url.fi/webhook/start-calls', { 
        sheetUrl,
        callType,
        script,
        voice: selectedVoice
      })
      setPolling(true)
    } catch (e) {
      setError('Soittojen käynnistys epäonnistui')
    } finally {
      setStarting(false)
    }
  }

  const handleSingleCall = async () => {
    setCalling(true)
    setSingleCallError('')
    try {
      const companyId = localStorage.getItem('companyId')
      const response = await axios.post('/api/single-call', { 
        phoneNumber,
        callType,
        script,
        voice: selectedVoice,
        companyId
      })
      
      if (response.data.success) {
        alert(`✅ ${response.data.message}`)
        setPhoneNumber('')
      } else {
        setSingleCallError(response.data.error || 'Puhelun käynnistys epäonnistui')
      }
    } catch (e) {
      console.error('Single call error:', e)
      const errorMessage = e.response?.data?.error || 'Yksittäisen puhelun aloitus epäonnistui'
      setSingleCallError(errorMessage)
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

  // Cleanup äänet komponentin purkautuessa
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
      audioElementsRef.current.forEach(audio => {
        if (audio && !audio.paused) {
          audio.pause()
          audio.currentTime = 0
        }
      })
      audioElementsRef.current = []
    }
  }, [])

  // Responsiivinen apu
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1200;
  let gridCols = '1fr';
  if (isTablet) gridCols = '1fr 1fr';
  if (!isMobile && !isTablet) gridCols = '1fr 1fr 1fr';

  return (
    <>
      <PageHeader title={activeTab === 'calls' ? 'Puhelut' : 'Lokit'} />
      
      <div className="call-panel-wrapper" style={{ flex: 1, minHeight: 0 }}>
        {/* Välilehdet - täsmälleen kuten AIChatPage:ssa */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          background: '#f9fafb',
          flexShrink: 0,
          padding: '0 32px',
          gap: 0,
          height: 48,
          margin: 0
        }}>
          <button
            onClick={() => setActiveTab('calls')}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              background: activeTab === 'calls' ? '#fff' : 'transparent',
              color: activeTab === 'calls' ? 'var(--brand-dark, #1f2937)' : '#6b7280',
              fontWeight: activeTab === 'calls' ? 700 : 500,
              cursor: 'pointer',
              borderBottom: activeTab === 'calls' ? '3px solid var(--brand-accent, #7c3aed)' : '3px solid transparent',
              fontSize: 18,
              letterSpacing: 0.5,
              transition: 'background 0.15s, color 0.15s',
              borderRadius: 0,
              outline: 'none',
              boxShadow: 'none',
              margin: 0,
              padding: 0
            }}
            onMouseOver={e => { if(activeTab !== 'calls') e.currentTarget.style.background = '#f3f4f6' }}
            onMouseOut={e => { if(activeTab !== 'calls') e.currentTarget.style.background = 'transparent' }}
          >
            📞 Puhelut
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              background: activeTab === 'logs' ? '#fff' : 'transparent',
              color: activeTab === 'logs' ? 'var(--brand-dark, #1f2937)' : '#6b7280',
              fontWeight: activeTab === 'logs' ? 700 : 500,
              cursor: 'pointer',
              borderBottom: activeTab === 'logs' ? '3px solid var(--brand-accent, #7c3aed)' : '3px solid transparent',
              fontSize: 18,
              letterSpacing: 0.5,
              transition: 'background 0.15s, color 0.15s',
              borderRadius: 0,
              outline: 'none',
              boxShadow: 'none',
              margin: 0,
              padding: 0
            }}
            onMouseOver={e => { if(activeTab !== 'logs') e.currentTarget.style.background = '#f3f4f6' }}
            onMouseOut={e => { if(activeTab !== 'logs') e.currentTarget.style.background = 'transparent' }}
          >
            📊 Lokit
          </button>
        </div>

        {/* Sisältö */}
        <div style={{ padding: 32 }}>
          {activeTab === 'calls' && (
            <>
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
                {/* Ensimmäinen sarake - Aloita puhelut ja Tee puhelu allekkain */}
                <div>
                  {/* Aloita puhelut -laatikko */}
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
                        disabled={starting || !validationResult || !callType || !script.trim() || !selectedVoice}
                        style={{
                          padding: '12px 24px',
                          background: starting || !validationResult || !callType || !script.trim() || !selectedVoice ? '#9ca3af' : '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: starting || !validationResult || !callType || !script.trim() || !selectedVoice ? 'not-allowed' : 'pointer',
                          opacity: starting || !validationResult || !callType || !script.trim() || !selectedVoice ? 0.6 : 1
                        }}
                      >
                        {starting ? 'Käynnistetään...' : 'Aloita soittot'}
                      </button>
                    </div>
                    
                    <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
                      Käyttää Toiminnot-moduulin asetuksia (tyyppi, ääni, skripti)
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

                  {/* Tee puhelu -laatikko */}
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
                      disabled={calling || !phoneNumber.trim() || !callType || !script.trim() || !selectedVoice}
                      style={{
                        padding: '12px 24px',
                        background: calling || !phoneNumber.trim() || !callType || !script.trim() || !selectedVoice ? '#9ca3af' : '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: calling || !phoneNumber.trim() || !callType || !script.trim() || !selectedVoice ? 'not-allowed' : 'pointer',
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
                      Käyttää Toiminnot-moduulin asetuksia (tyyppi, ääni, skripti)
                    </div>
                    
                    {singleCallError && (
                      <div style={{
                        marginTop: 16,
                        padding: '12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#dc2626',
                        fontSize: 14
                      }}>
                        {singleCallError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Toinen sarake - Toiminnot */}
                <div>
                  <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32, marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
                        Toiminnot
                      </h2>
                      {callType && script.trim() && selectedVoice && (
                        <div style={{ 
                          background: '#dcfce7', 
                          color: '#166534', 
                          padding: '4px 12px', 
                          borderRadius: 12, 
                          fontSize: 12, 
                          fontWeight: 600 
                        }}>
                          ✅ Valmis
                        </div>
                      )}
                    </div>
                    
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
                          onClick={() => playVoiceSample(selectedVoice)}
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
                      {audioInfo && (
                        <div style={{
                          marginTop: 8,
                          padding: '8px 12px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          fontSize: 12,
                          color: '#475569',
                          fontFamily: 'monospace'
                        }}>
                          {audioInfo}
                        </div>
                      )}
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

                {/* Kolmas sarake - Inbound-asetukset */}
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
                          onClick={() => playVoiceSample(inboundVoice)}
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
            </>
          )}
          
          {activeTab === 'logs' && (
            <div>
              {/* Lokit-näkymä placeholder */}
              <div style={{
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                padding: 32,
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ margin: '0 0 16px 0', fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                    📊 Puheluloki
                  </h2>
                  <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32 }}>
                    Tässä näkymässä näytetään puhelujen tilastot, historialoki ja analytiikka.
                  </p>
                </div>
                
                {/* Placeholder tilastot */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: 24, 
                  marginBottom: 32 
                }}>
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: 24, 
                    borderRadius: 12, 
                    border: '1px solid #e2e8f0' 
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>
                      0
                    </div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>Onnistuneet puhelut</div>
                  </div>
                  
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: 24, 
                    borderRadius: 12, 
                    border: '1px solid #e2e8f0' 
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
                      0
                    </div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>Epäonnistuneet</div>
                  </div>
                  
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: 24, 
                    borderRadius: 12, 
                    border: '1px solid #e2e8f0' 
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>
                      0s
                    </div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>Keskimääräinen kesto</div>
                  </div>
                </div>
                
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: 12,
                  padding: 20,
                  fontSize: 14,
                  color: '#0c4a6e'
                }}>
                  🚧 Lokitoiminnallisuus toteutetaan seuraavaksi. Tässä tulee näkymään:
                  <ul style={{ marginTop: 12, textAlign: 'left', paddingLeft: 20 }}>
                    <li>Puheluhistoria ja -tilastot</li>
                    <li>Onnistumisprosentit äänittäin</li>
                    <li>Kustannusanalytiikka</li>
                    <li>Keskimääräiset puhelun kestot</li>
                    <li>Aikasarjakaaviot puheluista</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}