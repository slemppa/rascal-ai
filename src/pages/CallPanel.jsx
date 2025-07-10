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
  const [editingCallType, setEditingCallType] = useState(null)
  const [newCallType, setNewCallType] = useState({ callType: '', label: '', description: '' })
  const [callTypes, setCallTypes] = useState([])
  const [loadingCallTypes, setLoadingCallTypes] = useState(true)

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
      // Hae companyId samalla tavalla kuin App.jsx:ssä
      let companyId = null
      try {
        const userObj = JSON.parse(localStorage.getItem('user') || '{}')
        companyId = userObj.companyId
      } catch (e) {
        console.error('Virhe user-objektin parsimisessa:', e)
      }
      
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

  // Puhelun tyyppien hallinta - mock-toteutus
  const handleSaveCallType = async () => {
    try {
      if (editingCallType) {
        // Päivitä olemassa oleva mock-dataa
        const updatedCallTypes = callTypes.map(ct => 
          ct.value === editingCallType.value 
            ? { ...ct, label: editingCallType.label, description: editingCallType.description }
            : ct
        )
        setCallTypes(updatedCallTypes)
        alert('Puhelun tyyppi päivitetty!')
      } else {
        // Lisää uusi mock-dataan
        const newType = {
          value: newCallType.callType,
          label: newCallType.label,
          description: newCallType.description
        }
        setCallTypes([...callTypes, newType])
        alert('Uusi puhelun tyyppi lisätty!')
        setNewCallType({ callType: '', label: '', description: '' })
      }
      
      setEditingCallType(null)
    } catch (error) {
      console.error('Puhelun tyypin tallennus epäonnistui:', error)
      alert('Puhelun tyypin tallennus epäonnistui')
    }
  }

  const handleDeleteCallType = async (recordId) => {
    if (!confirm('Haluatko varmasti poistaa tämän puhelun tyypin?')) {
      return
    }

    try {
      // Poista mock-datasta
      const updatedCallTypes = callTypes.filter(ct => ct.value !== recordId)
      setCallTypes(updatedCallTypes)
      alert('Puhelun tyyppi poistettu!')
    } catch (error) {
      console.error('Puhelun tyypin poisto epäonnistui:', error)
      alert('Puhelun tyypin poisto epäonnistui')
    }
  }

  // Hae puhelun tyypit komponentin latauksen yhteydessä
  const fetchCallTypes = async () => {
    try {
      setLoadingCallTypes(true)
      
      // Käytä mock-dataa Airtable-kutsun sijaan
      const mockCallTypes = [
        { value: 'myynti', label: 'Myyntipuhelu' },
        { value: 'asiakaspalvelu', label: 'Asiakaspalvelu' },
        { value: 'kartoitus', label: 'Tarpeiden kartoitus' },
        { value: 'seuranta', label: 'Seurantapuhelu' },
        { value: 'kiitos', label: 'Kiitospuhelu' }
      ]
      
      setCallTypes(mockCallTypes)
      // Aseta ensimmäinen tyyppi oletukseksi jos ei ole valittu
      if (mockCallTypes.length > 0 && !callType) {
        setCallType(mockCallTypes[0].value)
      }
    } catch (error) {
      console.error('Puhelun tyyppien haku epäonnistui:', error)
      // Fallback oletustyypeille
      setCallTypes([
        { value: 'myynti', label: 'Myyntipuhelu' },
        { value: 'asiakaspalvelu', label: 'Asiakaspalvelu' }
      ])
    } finally {
      setLoadingCallTypes(false)
    }
  }

    useEffect(() => {
      fetchCallTypes()
    }, []) // Tyhjä riippuvuuslista - suoritetaan vain kerran

  // Pollaa soittojen tilaa 5s välein - korjattu turvallisuus
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
          
          <button
            onClick={() => setActiveTab('manage')}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              background: activeTab === 'manage' ? '#fff' : 'transparent',
              color: activeTab === 'manage' ? 'var(--brand-dark, #1f2937)' : '#6b7280',
              fontWeight: activeTab === 'manage' ? 700 : 500,
              cursor: 'pointer',
              borderBottom: activeTab === 'manage' ? '3px solid var(--brand-accent, #7c3aed)' : '3px solid transparent',
              fontSize: 18,
              letterSpacing: 0.5,
              transition: 'background 0.15s, color 0.15s',
              borderRadius: 0,
              outline: 'none',
              boxShadow: 'none',
              margin: 0,
              padding: 0
            }}
            onMouseOver={e => { if(activeTab !== 'manage') e.currentTarget.style.background = '#f3f4f6' }}
            onMouseOut={e => { if(activeTab !== 'manage') e.currentTarget.style.background = 'transparent' }}
          >
            ⚙️ Hallinta
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ fontWeight: 500 }}>
                          Google Sheets URL
                        </label>
                        <button
                          type="button"
                          onClick={() => setActiveTab('manage')}
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            cursor: 'pointer',
                            color: '#374151',
                            fontWeight: 500
                          }}
                        >
                          ➕ Lisää puhelun tyyppi
                        </button>
                      </div>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ fontWeight: 600, color: '#374151', fontSize: 14 }}>
                          Puhelun tyyppi
                        </label>
                        <button
                          type="button"
                          onClick={() => setActiveTab('manage')}
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            cursor: 'pointer',
                            color: '#374151',
                            fontWeight: 500
                          }}
                        >
                          ➕ Lisää uusi
                        </button>
                      </div>
                      <select
                        value={callType}
                        onChange={(e) => setCallType(e.target.value)}
                        disabled={loadingCallTypes}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: 8,
                          fontSize: 14,
                          background: loadingCallTypes ? '#f9fafb' : '#fff',
                          cursor: loadingCallTypes ? 'not-allowed' : 'pointer',
                          opacity: loadingCallTypes ? 0.6 : 1
                        }}
                      >
                        {loadingCallTypes ? (
                          <option>Ladataan puhelun tyyppejä...</option>
                        ) : callTypes.length === 0 ? (
                          <option>Ei puhelun tyyppejä saatavilla</option>
                        ) : (
                          callTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))
                        )}
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
          
          {activeTab === 'manage' && (
            <div>
              <div style={{
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                padding: 32
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                    ⚙️ Puhelun tyyppien hallinta
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCallType(null)
                      setNewCallType({ callType: '', label: '', description: '' })
                    }}
                    style={{
                      padding: '8px 16px',
                      fontSize: 14,
                      background: '#3b82f6',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: '#fff',
                      fontWeight: 500
                    }}
                  >
                    ➕ Lisää uusi tyyppi
                  </button>
                </div>
                
                <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: 14 }}>
                  Hallitse puhelun tyyppejä Airtable-tietokannassa. Vain Active-status olevat tyypit näkyvät puheluissa.
                </p>
                
                {/* Uuden puhelun tyypin lisäys */}
                <div style={{ marginBottom: 32, padding: 24, background: '#f8fafc', borderRadius: 12 }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#374151' }}>
                    {editingCallType ? 'Muokkaa puhelun tyyppiä' : 'Lisää uusi puhelun tyyppi'}
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                        Tunniste (value)
                      </label>
                      <input
                        type="text"
                        value={editingCallType ? editingCallType.value : newCallType.callType}
                        onChange={(e) => {
                          if (editingCallType) {
                            setEditingCallType({ ...editingCallType, value: e.target.value })
                          } else {
                            setNewCallType({ ...newCallType, callType: e.target.value })
                          }
                        }}
                        placeholder="esim. myynti, asiakaspalvelu"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 8,
                          fontSize: 14
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                        Näyttönimi (label)
                      </label>
                      <input
                        type="text"
                        value={editingCallType ? editingCallType.label : newCallType.label}
                        onChange={(e) => {
                          if (editingCallType) {
                            setEditingCallType({ ...editingCallType, label: e.target.value })
                          } else {
                            setNewCallType({ ...newCallType, label: e.target.value })
                          }
                        }}
                        placeholder="esim. Myyntipuhelu"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 8,
                          fontSize: 14
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                        Status
                      </label>
                      <select
                        value={editingCallType ? editingCallType.status : 'Active'}
                        onChange={(e) => {
                          if (editingCallType) {
                            setEditingCallType({ ...editingCallType, status: e.target.value })
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 8,
                          fontSize: 14,
                          background: '#fff'
                        }}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Active">Active</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                        Järjestys (Sort Order)
                      </label>
                      <input
                        type="number"
                        value={editingCallType ? editingCallType.sortOrder : 0}
                        onChange={(e) => {
                          if (editingCallType) {
                            setEditingCallType({ ...editingCallType, sortOrder: parseInt(e.target.value) || 0 })
                          }
                        }}
                        placeholder="0"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 8,
                          fontSize: 14
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>
                      Kuvaus (vapaaehtoinen)
                    </label>
                    <textarea
                      value={editingCallType ? editingCallType.description : newCallType.description}
                      onChange={(e) => {
                        if (editingCallType) {
                          setEditingCallType({ ...editingCallType, description: e.target.value })
                        } else {
                          setNewCallType({ ...newCallType, description: e.target.value })
                        }
                      }}
                      placeholder="Lyhyt kuvaus puhelun tyypistä..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={handleSaveCallType}
                      disabled={!((editingCallType && editingCallType.value && editingCallType.label) || 
                                (!editingCallType && newCallType.callType && newCallType.label))}
                      style={{
                        padding: '12px 24px',
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                        opacity: ((editingCallType && editingCallType.value && editingCallType.label) || 
                                  (!editingCallType && newCallType.callType && newCallType.label)) ? 1 : 0.6
                      }}
                    >
                      {editingCallType ? '💾 Päivitä' : '➕ Lisää'}
                    </button>
                    
                    {editingCallType && (
                      <button
                        onClick={() => setEditingCallType(null)}
                        style={{
                          padding: '12px 24px',
                          background: '#f3f4f6',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600
                        }}
                      >
                        ❌ Peruuta
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Olemassa olevat puhelun tyypit */}
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#374151' }}>
                    Olemassa olevat puhelun tyypit
                  </h3>
                  
                  {loadingCallTypes ? (
                    <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                      Ladataan puhelun tyyppejä...
                    </div>
                  ) : callTypes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                      Ei puhelun tyyppejä vielä lisätty
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {callTypes.map((type, index) => (
                        <div
                          key={type.id || index}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                              {type.label}
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                              Tunniste: <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>{type.value}</code>
                              <span style={{ marginLeft: 12, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500, 
                                background: type.status === 'Active' ? '#dcfce7' : type.status === 'Draft' ? '#fef3c7' : '#f3f4f6',
                                color: type.status === 'Active' ? '#166534' : type.status === 'Draft' ? '#92400e' : '#6b7280'
                              }}>
                                {type.status}
                              </span>
                            </div>
                            {type.description && (
                              <div style={{ fontSize: 12, color: '#6b7280' }}>
                                {type.description}
                              </div>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setEditingCallType(type)}
                              style={{
                                padding: '8px 12px',
                                background: '#f3f4f6',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 500
                              }}
                            >
                              ✏️ Muokkaa
                            </button>
                            
                            <button
                              onClick={() => handleDeleteCallType(type.id)}
                              style={{
                                padding: '8px 12px',
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 500
                              }}
                            >
                              🗑️ Poista
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}