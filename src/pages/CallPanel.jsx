import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import AddCallTypeModal from '../components/AddCallTypeModal'
import EditCallTypeModal from '../components/EditCallTypeModal'
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
  const [name, setName] = useState('')
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
  const [addTypeLoading, setAddTypeLoading] = useState(false)
  const [addTypeError, setAddTypeError] = useState('')
  const [addTypeSuccess, setAddTypeSuccess] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Puhelulokien state-muuttujat
  const [callLogs, setCallLogs] = useState([])
  const [callLogsStats, setCallLogsStats] = useState({ totalCount: 0, successfulCount: 0, failedCount: 0, averageDuration: 0 })
  const [loadingCallLogs, setLoadingCallLogs] = useState(false)
  const [callLogsError, setCallLogsError] = useState('')

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
      
      // Etsi valitun puhelun tyypin recordId
      const selectedCallType = callTypes.find(type => type.value === callType)
      const recordId = selectedCallType?.recordId || selectedCallType?.id
      
      if (!recordId) {
        setSingleCallError('Puhelun tyypin tunniste ei löytynyt')
        setCalling(false)
        return
      }
      
      const response = await axios.post('/api/single-call', { 
        phoneNumber,
        name,
        callType,
        recordId,
        script,
        voice: selectedVoice,
        companyId
      })
      
      if (response.data.success) {
        alert(`✅ ${response.data.message}`)
        setPhoneNumber('')
        setName('')
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

  // Puhelun tyyppien hallinta - N8N-integraatio
  const handleSaveCallType = async () => {
    try {
      if (editingCallType) {
        // Päivitä olemassa oleva puhelutyyppi N8N:n kautta
        const fields = {
          Name: editingCallType.callType || editingCallType.Name,
          Identity: editingCallType.identity || editingCallType.Identity || '',
          Style: editingCallType.style || editingCallType.Style || '',
          Guidelines: editingCallType.guidelines || editingCallType.Guidelines || '',
          Goals: editingCallType.goals || editingCallType.Goals || '',
          Intro: editingCallType.intro || editingCallType.Intro || '',
          Questions: editingCallType.questions || editingCallType.Questions || '',
          Outro: editingCallType.outro || editingCallType.Outro || '',
          Notes: editingCallType.notes || editingCallType.Notes || '',
          Version: editingCallType.version || editingCallType.Version || 'v1.0',
          Status: editingCallType.status || editingCallType.Status || 'Active',
        }

        const response = await axios.put('/api/update-call-type', {
          recordId: editingCallType.recordId || editingCallType.id,
          fields: fields
        })

        if (response.data.success) {
          alert('Puhelun tyyppi päivitetty!')
          fetchCallTypes() // Päivitä lista N8N:stä
        } else {
          throw new Error('Päivitys epäonnistui')
        }
      } else {
        // Lisää uusi puhelutyyppi (käytä olemassa olevaa handleAddCallType-funktiota)
        await handleAddCallType()
        return // handleAddCallType hoitaa loput
      }
      
      setEditingCallType(null)
      setShowEditModal(false)
    } catch (error) {
      console.error('Puhelun tyypin tallennus epäonnistui:', error)
      alert('Puhelun tyypin tallennus epäonnistui: ' + (error.response?.data?.error || error.message))
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

  // Päivitä skripti kun puhelutyyppi muuttuu
  const updateScriptFromCallType = (selectedCallType) => {
    const selectedType = callTypes.find(type => type.value === selectedCallType)
    if (selectedType) {
      // Käytä Intro-kenttää skriptinä, koska se on puhelun aloitus
      if (selectedType.Intro) {
        setScript(selectedType.Intro)
      } else if (selectedType.intro) {
        setScript(selectedType.intro)
      } else {
        setScript('')
      }
    }
  }

  // Hae puhelun tyypit komponentin latauksen yhteydessä
  const fetchCallTypes = async () => {
    try {
      setLoadingCallTypes(true)
      
      // Hae companyId samalla tavalla kuin App.jsx:ssä
      let companyId = null
      try {
        const userObj = JSON.parse(localStorage.getItem('user') || '{}')
        companyId = userObj.companyId
      } catch (e) {
        console.error('Virhe user-objektin parsimisessa:', e)
      }
      
      if (!companyId) {
        console.warn('CompanyId ei löytynyt, käytetään fallback-tyyppejä')
        // Fallback oletustyypeille
        setCallTypes([
          { value: 'myynti', label: 'Myyntipuhelu' },
          { value: 'asiakaspalvelu', label: 'Asiakaspalvelu' }
        ])
        return
      }
      
      // Hae puhelutyypit Airtablesta
      const response = await axios.get(`/api/call-types?companyId=${companyId}`)
      
      if (response.data.records) {
        // Muunna Airtable data frontend-ystävälliseen muotoon
        const formattedCallTypes = response.data.records.map(record => ({
          value: record.fields.Name || record.id,
          label: record.fields.Name || 'Nimeämätön puhelutyyppi',
          description: record.fields.Identity || '',
          recordId: record.id,
          id: record.id,
          // Tallenna kaikki alkuperäiset tiedot
          ...record.fields
        }))
        
        setCallTypes(formattedCallTypes)
        
        // Aseta ensimmäinen tyyppi oletukseksi jos ei ole valittu
        if (formattedCallTypes.length > 0 && !callType) {
          const firstType = formattedCallTypes[0].value
          setCallType(firstType)
          // Päivitä skripti ensimmäiselle tyypille
          setTimeout(() => updateScriptFromCallType(firstType), 100)
        }
        
        console.log('Puhelutyypit haettu:', formattedCallTypes.length)
      } else {
        throw new Error('Puhelutyyppien haku epäonnistui')
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

  const handleAddCallType = async () => {
    setAddTypeLoading(true)
    setAddTypeError('')
    setAddTypeSuccess('')
    try {
      // Hae companyId localStoragesta
      let companyId = null
      try {
        const userObj = JSON.parse(localStorage.getItem('user') || '{}')
        companyId = userObj.companyId
      } catch (e) {}
      if (!companyId) {
        setAddTypeError('Yrityksen tunniste puuttuu!')
        setAddTypeLoading(false)
        return
      }
      // Rakenna fields-objekti
      const fields = {
        Name: newCallType.callType,
        Company: [companyId],
        Identity: newCallType.identity || '',
        Style: newCallType.style || '',
        Guidelines: newCallType.guidelines || '',
        Goals: newCallType.goals || '',
        Intro: newCallType.intro || '',
        Questions: newCallType.questions || '',
        Outro: newCallType.outro || '',
        Notes: newCallType.notes || '',
        Version: newCallType.version || 'v1.0',
        Status: newCallType.status || 'Active',
      }
      const response = await axios.post('/api/create-call-type', { fields })
      if (response.data.success) {
        setAddTypeSuccess('Puhelutyyppi lisätty!')
        setNewCallType({ callType: '', label: '', description: '', identity: '', style: '', guidelines: '', goals: '', intro: '', questions: '', outro: '', notes: '', version: '', status: 'Active' })
        fetchCallTypes() // Päivitä lista
      } else {
        setAddTypeError('Lisäys epäonnistui')
      }
    } catch (e) {
      setAddTypeError('Lisäys epäonnistui: ' + (e.response?.data?.error || e.message))
    } finally {
      setAddTypeLoading(false)
    }
  }

  const closeModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setEditingCallType(null)
    setNewCallType({ callType: '', label: '', description: '', identity: '', style: '', guidelines: '', goals: '', intro: '', questions: '', outro: '', notes: '', version: '', status: 'Active' })
    setAddTypeError('')
    setAddTypeSuccess('')
  }

  const openEditModal = (callType) => {
    setEditingCallType(callType)
    setShowEditModal(true)
  }

  const openAddModal = () => {
    setShowAddModal(true)
  }

  // Hae puheluloki N8N:n kautta
  const fetchCallLogs = async () => {
    try {
      setLoadingCallLogs(true)
      setCallLogsError('')
      
      // Hae companyId samalla tavalla kuin muissakin funktioissa
      let companyId = null
      try {
        const userObj = JSON.parse(localStorage.getItem('user') || '{}')
        companyId = userObj.companyId
      } catch (e) {
        console.error('Virhe user-objektin parsimisessa:', e)
      }
      
      if (!companyId) {
        setCallLogsError('Yrityksen tunniste puuttuu!')
        return
      }

      // Hae puheluloki N8N:n kautta
      const response = await axios.get(`/api/call-logs?companyId=${companyId}&limit=100`)
      
      if (response.data.logs) {
        setCallLogs(response.data.logs)
        setCallLogsStats(response.data.stats)
        console.log('Puheluloki haettu:', response.data.logs.length, 'tapahtumaa')
      } else {
        throw new Error('Puhelulokin haku epäonnistui')
      }
    } catch (error) {
      console.error('Puhelulokin haku epäonnistui:', error)
      setCallLogsError('Puhelulokin haku epäonnistui: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoadingCallLogs(false)
    }
  }

    useEffect(() => {
      fetchCallTypes()
    }, []) // Tyhjä riippuvuuslista - suoritetaan vain kerran

    // Hae puheluloki kun "Lokit" välilehti avataan
    useEffect(() => {
      if (activeTab === 'logs') {
        fetchCallLogs()
      }
    }, [activeTab]) // Suoritetaan kun activeTab muuttuu

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
              <div className="callpanel-root" style={{ 
                display: 'grid', 
                gridTemplateColumns: gridCols, 
                gap: 24, 
                marginTop: 0 
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
                        Nimi
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Matti Meikäläinen"
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
                      disabled={calling || !name.trim() || !phoneNumber.trim() || !callType || !script.trim() || !selectedVoice}
                      style={{
                        padding: '12px 24px',
                        background: calling || !name.trim() || !phoneNumber.trim() || !callType || !script.trim() || !selectedVoice ? '#9ca3af' : '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: calling || !name.trim() || !phoneNumber.trim() || !callType || !script.trim() || !selectedVoice ? 'not-allowed' : 'pointer',
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
                        onChange={(e) => {
                          setCallType(e.target.value)
                          updateScriptFromCallType(e.target.value)
                        }}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ fontWeight: 600, color: '#374151', fontSize: 14 }}>
                          Skripti
                        </label>
                        <div style={{ 
                          background: '#f0f9ff', 
                          color: '#0369a1', 
                          padding: '4px 12px', 
                          borderRadius: 12, 
                          fontSize: 12, 
                          fontWeight: 600 
                        }}>
                          📝 Valitusta tyypistä
                        </div>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: 8,
                          fontSize: 14,
                          fontFamily: 'inherit',
                          minHeight: 120,
                          background: '#f9fafb',
                          color: '#374151',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          overflowY: 'auto',
                          maxHeight: 200
                        }}
                      >
                        {script ? script : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                            Valitse puhelun tyyppi nähdäksesi skriptin
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                        Skripti päivittyy automaattisesti valitun puhelutyypin mukaan
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
              <div style={{
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                padding: 32
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                    📊 Puheluloki
                  </h2>
                  <button
                    type="button"
                    onClick={fetchCallLogs}
                    disabled={loadingCallLogs}
                    style={{
                      padding: '8px 16px',
                      fontSize: 14,
                      background: loadingCallLogs ? '#9ca3af' : '#3b82f6',
                      border: 'none',
                      borderRadius: 8,
                      cursor: loadingCallLogs ? 'not-allowed' : 'pointer',
                      color: '#fff',
                      fontWeight: 500
                    }}
                  >
                    {loadingCallLogs ? '🔄 Päivitetään...' : '🔄 Päivitä'}
                  </button>
                </div>
                
                <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32 }}>
                  Puhelujen tilastot ja historialoki Google Sheets -tietokannasta.
                </p>
                
                {/* Tilastot */}
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
                      {callLogsStats.successfulCount}
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
                      {callLogsStats.failedCount}
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
                      {callLogsStats.averageDuration}s
                    </div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>Keskimääräinen kesto</div>
                  </div>

                  <div style={{ 
                    background: '#f8fafc', 
                    padding: 24, 
                    borderRadius: 12, 
                    border: '1px solid #e2e8f0' 
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>
                      {callLogsStats.totalCount}
                    </div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>Yhteensä</div>
                  </div>
                </div>

                {/* Virheviesti */}
                {callLogsError && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24,
                    color: '#dc2626',
                    fontSize: 14
                  }}>
                    ❌ {callLogsError}
                  </div>
                )}
                
                {/* Puheluloki lista */}
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#374151' }}>
                    Puheluhistoria
                  </h3>
                  
                  {loadingCallLogs ? (
                    <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                      Ladataan puhelulokia...
                    </div>
                  ) : callLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                      Ei puheluja vielä tallennettu
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {callLogs.map((log, index) => (
                        <div
                          key={log.row_number || index}
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
                              {log.Nimi || 'Tuntematon nimi'}
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                              {log.Puhelinnumero || 'Tuntematon numero'}
                              {log.row_number && ` • Rivi ${log.row_number}`}
                            </div>
                            {/* Näytä kysymykset jos niitä on vastattu */}
                            {(log['Kysymys A '] || log['Kysymys B '] || log['Kysymys C'] || log['Kysymys D ']) && (
                              <div style={{ fontSize: 12, color: '#6b7280' }}>
                                {log['Kysymys A '] && `A: ${log['Kysymys A ']} `}
                                {log['Kysymys B '] && `B: ${log['Kysymys B ']} `}
                                {log['Kysymys C'] && `C: ${log['Kysymys C']} `}
                                {log['Kysymys D '] && `D: ${log['Kysymys D ']}`}
                              </div>
                            )}
                          </div>
                          <div style={{ 
                            padding: '4px 12px', 
                            borderRadius: 12, 
                            fontSize: 12, 
                            fontWeight: 600,
                            background: (log.Onnistunut === 'Kyllä' || log.Onnistunut === 'kyllä' || log.Onnistunut === '1') ? '#dcfce7' : '#fef2f2',
                            color: (log.Onnistunut === 'Kyllä' || log.Onnistunut === 'kyllä' || log.Onnistunut === '1') ? '#166534' : '#dc2626'
                          }}>
                            {(log.Onnistunut === 'Kyllä' || log.Onnistunut === 'kyllä' || log.Onnistunut === '1') ? '✅ Onnistui' : '⏳ Odottaa'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                    onClick={openAddModal}
                    style={{
                      padding: '12px 24px',
                      fontSize: 14,
                      background: '#3b82f6',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: '#fff',
                      fontWeight: 600
                    }}
                  >
                    ➕ Lisää uusi tyyppi
                  </button>
                </div>
                
                <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: 14 }}>
                  Hallitse puhelun tyyppejä Airtable-tietokannassa. Vain Active-status olevat tyypit näkyvät puheluissa.
                </p>
                
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
                          onClick={() => openEditModal(type)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseOut={e => e.currentTarget.style.background = '#f9fafb'}
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
                          <div style={{ color: '#6b7280', fontSize: 14 }}>
                            ✏️
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
      
      {/* Modaalit */}
      <AddCallTypeModal
        showModal={showAddModal}
        onClose={closeModals}
        newCallType={newCallType}
        setNewCallType={setNewCallType}
        onAdd={handleAddCallType}
        loading={addTypeLoading}
        error={addTypeError}
        success={addTypeSuccess}
      />
      <EditCallTypeModal
        showModal={showEditModal}
        onClose={closeModals}
        editingCallType={editingCallType}
        setEditingCallType={setEditingCallType}
        onSave={handleSaveCallType}
      />
    </>
  )
}