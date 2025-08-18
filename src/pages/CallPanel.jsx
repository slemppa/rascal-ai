import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import AddCallTypeModal from '../components/AddCallTypeModal'
import EditCallTypeModal from '../components/EditCallTypeModal'
import MikaSpecialTab from '../components/MikaSpecialTab.jsx'
import './CallPanel.css'
import CallStats from './CallStats'
import Button from '../components/Button'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import PageMeta from '../components/PageMeta'
import '../components/ModalComponents.css'

export default function CallPanel() {
  const { user } = useAuth()
  
  // Kovakoodatut tarkistukset
  const isMika = user?.email === 'mika.jarvinen@kuudesaisti.fi'
  const isAdmin = user?.email === 'sami@mak8r.fi'
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
  const [callType, setCallType] = useState('AI-assarin kartoitus')
  const [script, setScript] = useState('Hei! Soitan [Yritys] puolesta. Meillä on kiinnostava tarjous teille...')
  const [selectedVoice, setSelectedVoice] = useState('rascal-nainen-1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [name, setName] = useState('')
  const [calling, setCalling] = useState(false)
  const [inboundVoice, setInboundVoice] = useState('rascal-nainen-1')
  const [inboundScript, setInboundScript] = useState('Kiitos soitostasi! Olen AI-assistentti ja autan sinua mielellään...')
  const [inboundWelcomeMessage, setInboundWelcomeMessage] = useState('Kiitos soitostasi! Olen AI-assistentti ja autan sinua mielellään...')
  const [inboundSettingsId, setInboundSettingsId] = useState(null)
  const [inboundSettingsLoaded, setInboundSettingsLoaded] = useState(false)
  const [showInboundModal, setShowInboundModal] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)
  const [audioInfo, setAudioInfo] = useState('')
  const audioElementsRef = useRef([])
  const [activeTab, setActiveTab] = useState('calls')
  const [editingCallType, setEditingCallType] = useState(null)
  const [newCallType, setNewCallType] = useState({ 
    callType: '', 
    label: '', 
    description: '', 
    identity: '', 
    style: '', 
    guidelines: '', 
    goals: '', 
    intro: '', 
    questions: '', 
    outro: '', 
    notes: '', 
    version: '', 
    status: 'Active', 
    summary: '', 
    success_assessment: '',
    first_sms: '' // Uusi kenttä: Ensimmäinen SMS
  })
  const [callTypes, setCallTypes] = useState([])
  const [loadingCallTypes, setLoadingCallTypes] = useState(true)
  const [addTypeLoading, setAddTypeLoading] = useState(false)
  const [addTypeError, setAddTypeError] = useState('')
  const [addTypeSuccess, setAddTypeSuccess] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Puhelulokien state-muuttujat
  const [callLogs, setCallLogs] = useState([])
  const [loadingCallLogs, setLoadingCallLogs] = useState(false)
  const [callLogsError, setCallLogsError] = useState('')
  const [updatingLogIds, setUpdatingLogIds] = useState({})
  
  // Viestilokin state-muuttujat
  const [messageLogs, setMessageLogs] = useState([])
  const [loadingMessageLogs, setLoadingMessageLogs] = useState(false)
  const [messageLogsError, setMessageLogsError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Pagination ja filtterit
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [callTypeFilter, setCallTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  // Yksityiskohtainen näkymä
  const [selectedLog, setSelectedLog] = useState(null)
  const [showLogDetail, setShowLogDetail] = useState(false)
  const [loadingLogDetail, setLoadingLogDetail] = useState(false)

  const voiceOptions = [
    { value: 'rascal-nainen-1', label: 'Aurora (Nainen, Lämmin ja Ammattimainen)', id: 'GGiK1UxbDRh5IRtHCTlK' },
    { value: 'rascal-nainen-2', label: 'Lumi (Nainen, Positiivinen ja Ilmeikäs)', id: 'bEe5jYFAF6J2nz6vM8oo' },
    { value: 'rascal-mies-1', label: 'Kai (Mies, Rauhallinen ja Luottamusta herättävä)', id: 'waueh7VTxMDDIYKsIaYC' },
    { value: 'rascal-mies-2', label: 'Veeti (Mies, Nuorekas ja Energinen)', id: 's6UtVF1khAck9KlohM9j' }
  ]

  // Haetaan käyttäjän oma voice_id public.users-taulusta
  const [userVoiceId, setUserVoiceId] = useState(null)
  const [userVoiceLabel, setUserVoiceLabel] = useState('Oma ääni')

  // Lisätään isPlaying-state äänen toistoa varten
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState(null)
  const [currentlyPlayingVoice, setCurrentlyPlayingVoice] = useState(null)
  const [isStopping, setIsStopping] = useState(false)
  
  // Mika Special - lomakehaku state-muuttujat
  const [mikaContacts, setMikaContacts] = useState([])
  const [loadingMikaContacts, setLoadingMikaContacts] = useState(false)
  const [mikaContactsError, setMikaContactsError] = useState('')
  const [mikaSearchName, setMikaSearchName] = useState('')
  const [mikaSearchTitle, setMikaSearchTitle] = useState('')
  const [mikaSearchOrganization, setMikaSearchOrganization] = useState('')
  const [mikaSearchResults, setMikaSearchResults] = useState([])
  const [mikaSearchLoading, setMikaSearchLoading] = useState(false)
  
  // Massapuhelumodaalin state-muuttujat
  const [showMassCallModal, setShowMassCallModal] = useState(false)
  const [massCallStep, setMassCallStep] = useState(1) // 1: sheets, 2: settings, 3: schedule
  const [massCallSheetUrl, setMassCallSheetUrl] = useState('')
  const [massCallValidating, setMassCallValidating] = useState(false)
  const [massCallValidationResult, setMassCallValidationResult] = useState(null)
  const [massCallError, setMassCallError] = useState('')
  const [massCallCallType, setMassCallCallType] = useState('')
  const [massCallSelectedVoice, setMassCallSelectedVoice] = useState('rascal-nainen-1')
  const [massCallScheduledDate, setMassCallScheduledDate] = useState('')
  const [massCallScheduledTime, setMassCallScheduledTime] = useState('')
  const [massCallStarting, setMassCallStarting] = useState(false)
  const [massCallScheduling, setMassCallScheduling] = useState(false)
  const [massCallSmsFirst, setMassCallSmsFirst] = useState(false)
  
  // Yksittäisen puhelun modaali
  const [showSingleCallModal, setShowSingleCallModal] = useState(false)
  const [singleCallStep, setSingleCallStep] = useState(1) // 1: tyyppi/ääni, 2: tiedot

  useEffect(() => {
    const fetchUserVoiceId = async () => {
      if (!user?.id) return
      try {
      const { data, error } = await supabase
        .from('users')
        .select('voice_id')
        .eq('auth_user_id', user.id)
        .single()
        
        if (error) {
          console.error('Error fetching user voice_id:', error)
          return
        }
        
      if (data?.voice_id) {
        setUserVoiceId(data.voice_id)
        setUserVoiceLabel('Oma ääni')
        // Aseta selectedVoice käyttäjän oman äänen voice_id:ksi
        setSelectedVoice(data.voice_id)
        }
      } catch (err) {
        console.error('Error in fetchUserVoiceId:', err)
      }
    }
    fetchUserVoiceId()
  }, [user])



  // Hae puheluloki ja call types kun käyttäjä muuttuu
  useEffect(() => {
    if (user?.id) {
      fetchCallLogs()
      fetchCallTypes()
    }
  }, [user?.id])

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
    setIsPlaying(false)
    setCurrentlyPlayingVoice(null)
    setAudioInfo('')
  }

  // Ääninäytteen toisto
  const playVoiceSample = (voiceValue) => {
    if (isPlaying && audio) {
      audio.pause()
      audio.currentTime = 0
      setIsPlaying(false)
      setAudio(null)
      return
    }
    const newAudio = new Audio(`/${voiceValue}.mp3`)
    setAudio(newAudio)
    newAudio.play()
    setIsPlaying(true)
    newAudio.onended = () => {
      setIsPlaying(false)
      setAudio(null)
    }
  }

  // Muunna kesto muotoon min:sec
  const formatDuration = (duration) => {
    if (!duration) return '-'
    
    // Jos duration on jo muodossa "mm:ss", palauta se sellaisenaan
    if (typeof duration === 'string' && duration.includes(':')) {
      return duration
    }
    
    // Jos duration on sekunneissa (numero tai string), muunna muotoon "mm:ss"
    const seconds = parseInt(duration)
    if (!isNaN(seconds)) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    
    // Jos ei voida muuntaa, palauta alkuperäinen arvo
    return duration
  }

  const handleValidate = async () => {
    setValidating(true)
    setError('')
    setValidationResult(null)
    try {
      // Hae user_id Supabasesta
      const user_id = user?.id

      const res = await fetch('/api/validate-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sheetUrl, user_id })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setValidationResult(data)
        setStats({
          totalCount: data.phoneCount || 0,
          calledCount: 0,
          failedCount: 0
        })
      } else {
        setError(data.error || 'Validointi epäonnistui')
      }
    } catch (e) {
      console.error('❌ Validate-sheet virhe:', e)
      console.error('❌ Virheen response:', e.response)
      console.error('❌ Virheen message:', e.message)
      
      const errorMessage = e.response?.data?.error || 'Validointi epäonnistui'
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage))
    } finally {
      setValidating(false)
    }
  }

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
    // Tämä kattaa muodot kuten: 401234567, 501234567, 301234567
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

  const handleStartCalls = async () => {
    setStarting(true)
    setError('')
    try {
      // Tarkista onko kyseessä Mika Special -data
      const isMikaSpecialData = validationResult?.data && Array.isArray(validationResult.data) && validationResult.data.length > 0
      
      if (isMikaSpecialData) {
        // Käytä Mika Special mass-call v2 API:a
        
        const response = await fetch('/api/mika-mass-call-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contacts: validationResult.data,
            callType: callType,
            script: script,
            voice_id: selectedVoice,
            user_id: user?.id
          })
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Mika mass-call epäonnistui')
        }
        
        setPolling(true)
        alert(`✅ Mika Special mass-call käynnistetty onnistuneesti!\n\nAloitettu: ${result.startedCalls} puhelua\nOhitettu: ${result.failedCalls} kontakti`)
        
      } else {
        // Käytä normaalia mass-call API:a Google Sheets -datalle
        
        // Hae user_id Supabasesta
        const user_id = user?.id

        // Hae ensin public.users.id käyttäen auth_user_id:tä
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user_id)
          .single()

        if (userError || !userData) {
          throw new Error('Käyttäjää ei löytynyt')
        }

        const publicUserId = userData.id

        // Hae call_type_id call_types taulusta
        const { data: callTypeData, error: callTypeError } = await supabase
          .from('call_types')
          .select('id')
          .eq('name', callType)
          .eq('user_id', publicUserId)
          .single()

        if (callTypeError || !callTypeData) {
          throw new Error('Puhelun tyyppiä ei löytynyt')
        }

        const call_type_id = callTypeData.id

        // Käytä validationResult.rows dataa ja lisää jokainen suoraan Supabaseen
        if (!validationResult || !validationResult.rows) {
          throw new Error('Validointi pitää suorittaa ensin')
        }



        const callLogs = []
        let successCount = 0
        let errorCount = 0

        // Etsi sarakkeiden otsikot ensin
        let nameColumn = null
        let phoneColumn = null
        let emailColumn = null
        
        // Etsi nimisarakkeen otsikko
        for (const columnName of validationResult.columns || []) {
          if (columnName.toLowerCase().includes('name') || 
              columnName.toLowerCase().includes('nimi') ||
              columnName.toLowerCase().includes('etunimi') ||
              columnName.toLowerCase().includes('sukunimi')) {
            nameColumn = columnName
            break
          }
        }
        
        // Etsi puhelinnumerosarakkeen otsikko
        for (const columnName of validationResult.columns || []) {
          if (columnName.toLowerCase().includes('phone') || 
              columnName.toLowerCase().includes('puhelin') || 
              columnName.toLowerCase().includes('numero') ||
              columnName.toLowerCase().includes('tel')) {
            phoneColumn = columnName
            break
          }
        }

        // Etsi sähköpostisarakkeen otsikko (tiukempi tunnistus)
        for (const columnName of validationResult.columns || []) {
          const lower = String(columnName).toLowerCase().trim()
          if (
            lower === 'email' ||
            lower === 'e-mail' ||
            lower.includes('email') ||
            lower.includes('sähköposti') ||
            lower.includes('sahkoposti')
          ) {
            emailColumn = columnName
            break
          }
        }
        
        if (!nameColumn || !phoneColumn) {
          throw new Error('Vaadittuja sarakkeita ei löytynyt. Tarvitaan sekä nimisarakke että puhelinnumerosarakke.')
        }

        for (const [rowIndex, row] of (validationResult.rows || []).entries()) {
          // Hae arvot sarakkeiden otsikoiden perusteella
          const phoneNumber = normalizePhoneNumber(row[phoneColumn])
          const name = row[nameColumn] ? row[nameColumn].trim() : null
          // Ota CRM-kontaktin id Mika Special -datasta, jos saatavilla
          const crmId = Array.isArray(validationResult.data) && validationResult.data[rowIndex] && validationResult.data[rowIndex].id
            ? String(validationResult.data[rowIndex].id)
            : (row.id ? String(row.id) : null)

          // Lisää vain jos on sekä selkeä nimi että puhelinnumero
          if (name && phoneNumber && name.trim() !== '' && phoneNumber.trim() !== '' && phoneNumber.startsWith('+358')) {
            // Ota sähköposti sarakkeesta, validoi ja fallbackaa jos otsikkoa ei löytynyt
            const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i
            let emailValue = null
            if (emailColumn) {
              const raw = row[emailColumn]
              if (raw && emailRegex.test(String(raw).trim())) {
                emailValue = String(raw).trim().toLowerCase().substring(0, 120)
              }
            } else {
              // Fallback: etsi mikä tahansa sähköpostin näköinen arvo riviltä
              for (const key of Object.keys(row)) {
                const val = row[key]
                if (val && emailRegex.test(String(val).trim())) {
                  emailValue = String(val).trim().toLowerCase().substring(0, 120)
                  break
                }
              }
            }
            // Hae valitun äänen id
            const selectedVoiceObj = getVoiceOptions().find(v => v.value === selectedVoice)
            const voiceId = selectedVoiceObj?.id
            
            callLogs.push({
              user_id: publicUserId,
              customer_name: name.trim().substring(0, 100), // Rajaa 100 merkkiin (tietokannan rajoitus)
              phone_number: phoneNumber.trim().substring(0, 20), // Rajaa 20 merkkiin
              email: emailValue,
              call_type: callType.substring(0, 50), // Rajaa 50 merkkiin
              call_type_id: call_type_id,
              voice_id: voiceId, // Lisätty voice_id
              call_date: new Date().toISOString(),
              call_status: 'pending',
              campaign_id: `mass-call-${Date.now()}`.substring(0, 100), // Rajaa 100 merkkiin
              summary: `Mass-call: ${script.trim().substring(0, 100)}...`,
              crm_id: crmId || null
            })
          } else {
            errorCount++
          }
        }

        if (callLogs.length === 0) {
          throw new Error('Kelvollisia rivejä ei löytynyt. Varmista että riveillä on sekä nimi että kelvollinen suomalainen puhelinnumero.')
        }

        // Lisää kaikki call_logs tauluun
        const { data: insertedLogs, error: insertError } = await supabase
          .from('call_logs')
          .insert(callLogs)
          .select()

        if (insertError) {
          throw new Error('Virhe call_logs kirjoittamisessa: ' + insertError.message)
        }

        successCount = insertedLogs.length

        setPolling(true)
        alert(`✅ Mass-call käynnistetty onnistuneesti!\n\nAloitettu: ${successCount} puhelua\nOhitettu (puuttuu nimi/kelvollinen puhelinnumero): ${errorCount} riviä`)
      }
      
    } catch (e) {
      const errorMessage = e.message || 'Soittojen käynnistys epäonnistui'
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage))
    } finally {
      setStarting(false)
    }
  }

  const handleSingleCall = async () => {
    setCalling(true)
    setSingleCallError('')
    try {
      // Normalisoi puhelinnumero
      const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber)
      
      if (!normalizedPhoneNumber || !normalizedPhoneNumber.startsWith('+358')) {
        setSingleCallError('Kelvollinen suomalainen puhelinnumero vaaditaan')
        setCalling(false)
        return
      }
      
      // Etsi valitun puhelun tyypin call_type_id
      const selectedCallType = callTypes.find(type => type.value === callType)
      const call_type_id = selectedCallType?.id
      
      if (!call_type_id) {
        setSingleCallError('Puhelun tyypin tunniste ei löytynyt')
        setCalling(false)
        return
      }
      
      // Hae valitun äänen id
      const selectedVoiceObj = getVoiceOptions().find(v => v.value === selectedVoice)
      const voiceId = selectedVoiceObj?.id
      

      
      const response = await axios.post('/api/single-call', {
        phoneNumber: normalizedPhoneNumber,
        name,
        callType,
        callTypeId: call_type_id,
        script,
        voiceId: voiceId,
        userId: user?.id
      })
      
      const result = response.data
      
      if (result.success) {
        alert(`✅ ${result.message}`)
        setPhoneNumber('')
        setName('')
      } else {
        const errorMsg = result.error || 'Puhelun käynnistys epäonnistui'
        setSingleCallError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
      }
    } catch (e) {
      console.error('Single call error:', e)
      const errorMessage = e.response?.data?.error || 'Yksittäisen puhelun aloitus epäonnistui'
      setSingleCallError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage))
    } finally {
      setCalling(false)
    }
  }

  const handleSaveInboundSettings = async () => {
    setError('')
    try {
      const inboundVoiceObj = getVoiceOptions().find(v => v.value === inboundVoice)
      const inboundVoiceId = inboundVoiceObj?.id
      
      // Hae käyttäjän tiedot (vapi_inbound_assistant_id)
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('contact_email, contact_person, company_name, vapi_inbound_assistant_id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userProfile) {
        setError('Käyttäjää ei löytynyt')
        return
      }

      // Käytä uutta API endpointia webhook-integraatiolla
      const response = await fetch('/api/save-inbound-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voiceId: inboundVoiceId,
          script: inboundScript,
          welcomeMessage: inboundWelcomeMessage,
          userId: user.id, // auth_user_id
          userEmail: userProfile.contact_email,
          userName: userProfile.contact_person,
          companyName: userProfile.company_name,
          vapiInboundAssistantId: userProfile.vapi_inbound_assistant_id,
          inboundSettingsId: inboundSettingsId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Tarkista onko kyseessä N8N workflow virhe
        if (result.error && result.error.includes('N8N workflow ei ole aktiivinen')) {
          alert('⚠️ Inbound-asetukset tallennettu! N8N workflow ei ole vielä aktiivinen, mutta data on lähetetty.')
        } else {
          throw new Error(result.error || 'Inbound-asetusten tallennus epäonnistui')
        }
      } else {
        alert('✅ Inbound-asetukset tallennettu onnistuneesti!')
      }
    } catch (e) {
      console.error('Inbound settings error:', e)
      setError('Inbound-asetusten tallennus epäonnistui: ' + (e.message || e))
    }
  }

  // Puhelun tyyppien hallinta - N8N-integraatio
  const handleSaveCallType = async () => {
    try {
      if (editingCallType) {
        // Päivitä olemassa oleva puhelutyyppi Supabase-tietokannassa
        const fields = {
          name: editingCallType.name || editingCallType.callType,
          identity: editingCallType.identity || '',
          style: editingCallType.style || '',
          guidelines: editingCallType.guidelines || '',
          goals: editingCallType.goals || '',
          intro: editingCallType.intro || '',
          questions: editingCallType.questions || '',
          outro: editingCallType.outro || '',
          notes: editingCallType.notes || '',
          version: editingCallType.version || 'v1.0',
          status: editingCallType.status || 'Active',
          summary: editingCallType.summary || '',
          success_assessment: editingCallType.success_assessment || '',
          first_sms: editingCallType.first_sms || '' // Uusi kenttä
        }

        const { error } = await supabase.from('call_types').update(fields).eq('id', editingCallType.id)

        if (!error) {
          alert('Puhelun tyyppi päivitetty!')
          fetchCallTypes() // Päivitä lista
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
      alert('Puhelun tyypin tallennus epäonnistui: ' + (error.message || error))
    }
  }

  const [deletingCallTypes, setDeletingCallTypes] = useState(new Set())

  const handleDeleteCallType = async (recordId) => {
    if (!confirm('Haluatko varmasti poistaa tämän puhelun tyypin?')) {
      return
    }

    // Estetään useita poistoja samalle tyypille
    if (deletingCallTypes.has(recordId)) {
      return
    }

    setDeletingCallTypes(prev => new Set(prev).add(recordId))

    try {
      const { error } = await supabase.from('call_types').delete().eq('id', recordId)
      if (!error) {
        // Käytä toast-viestiä alertin sijaan
        setSuccessMessage('Puhelun tyyppi poistettu onnistuneesti!')
        setTimeout(() => setSuccessMessage(''), 3000)
        fetchCallTypes()
      } else {
        throw new Error('Poisto epäonnistui')
      }
    } catch (error) {
      console.error('Puhelun tyypin poisto epäonnistui:', error)
      setErrorMessage('Puhelun tyypin poisto epäonnistui: ' + (error.message || error))
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setDeletingCallTypes(prev => {
        const newSet = new Set(prev)
        newSet.delete(recordId)
        return newSet
      })
    }
  }

  // Päivitä skripti kun puhelutyyppi muuttuu
  const updateScriptFromCallType = (selectedCallType) => {
    const selectedType = callTypes.find(type => type.value === selectedCallType)
    if (selectedType) {
      // Käytä intro-kenttää skriptinä, koska se on puhelun aloitus
      if (selectedType.intro) {
        setScript(selectedType.intro)
      } else {
        setScript('')
      }
    }
  }

  // Hae puhelun tyypit komponentin latauksen yhteydessä
  const fetchCallTypes = async () => {
    setLoadingCallTypes(true)
    try {
      if (!user?.id) {
        setCallTypes([])
        return
      }
      
      // Hae ensin users.id käyttäen auth_user_id:tä
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userProfile) {
        setCallTypes([])
        return
      }
      
      // Hae call_types käyttäen users.id:tä
      const { data, error } = await supabase
        .from('call_types')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const formattedCallTypes = data.map(record => ({
        value: record.name,
        label: record.name,
        id: record.id,
        ...record
      }))
      setCallTypes(formattedCallTypes)
    } catch (e) {
      console.error('Error fetching call types:', e)
      setCallTypes([])
    } finally {
      setLoadingCallTypes(false)
    }
  }

  // Lisätään uusi useEffect, joka varmistaa että callType on aina valittuna
  useEffect(() => {
    if (callTypes.length > 0) {
      const exists = callTypes.some(type => type.value === callType)
      if (!callType || !exists) {
        setCallType(callTypes[0].value)
        updateScriptFromCallType(callTypes[0].value)
      }
    }
  }, [callTypes])

  // Lisää uusi useEffect, joka varmistaa että callType on aina valittuna
  useEffect(() => {
    fetchCallTypes()
    fetchInboundSettings()
    // eslint-disable-next-line
  }, [user])

  // Lisää uusi useEffect, joka varmistaa että callType on aina valittuna
  useEffect(() => {
    if (callTypes.length > 0) {
      const exists = callTypes.some(type => type.value === callType)
      if (!callType || !exists) {
        setCallType(callTypes[0].value)
        updateScriptFromCallType(callTypes[0].value)
      }
    }
  }, [callTypes])

  // Hae inbound-asetukset Supabaseesta
  const fetchInboundSettings = async () => {
    try {
      if (!user?.id || inboundSettingsLoaded) {
        return
      }
      
      // Hae ensin users.id käyttäen auth_user_id:tä
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userProfile) {
        return
      }

      // Hae inbound-asetukset
      const { data: inboundData, error: inboundError } = await supabase
        .from('inbound_call_types')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('is_active', true)
        .single()

      if (inboundError && inboundError.code !== 'PGRST116') {
        console.error('Error fetching inbound settings:', inboundError)
        return
      }

      if (inboundData) {
        // Aseta inbound-asetukset
        setInboundSettingsId(inboundData.id)
        if (inboundData.voice_id) {
          // Etsi äänen nimi voice_id:n perusteella
          const voiceOption = getVoiceOptions().find(v => v.id === inboundData.voice_id)
          if (voiceOption) {
            setInboundVoice(voiceOption.value)
          }
        }
        if (inboundData.script) {
          setInboundScript(inboundData.script)
        }
        if (inboundData.welcome_message) {
          setInboundWelcomeMessage(inboundData.welcome_message)
        }
      }
      setInboundSettingsLoaded(true)
    } catch (e) {
      console.error('Error fetching inbound settings:', e)
      setInboundSettingsLoaded(true)
    }
  }

  const handleAddCallType = async () => {
    setAddTypeLoading(true)
    setAddTypeError('')
    setAddTypeSuccess('')
    try {
      if (!user?.id) {
        setAddTypeError('Käyttäjän tunniste puuttuu!')
        setAddTypeLoading(false)
        return
      }
      
      // Hae ensin users.id käyttäen auth_user_id:tä
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !userProfile) {
        setAddTypeError('Käyttäjää ei löytynyt!')
        setAddTypeLoading(false)
        return
      }



      const insertData = {
        user_id: userProfile.id,
        name: newCallType.callType,
        identity: newCallType.identity || '',
        style: newCallType.style || '',
        guidelines: newCallType.guidelines || '',
        goals: newCallType.goals || '',
        intro: newCallType.intro || '',
        questions: newCallType.questions || '',
        outro: newCallType.outro || '',
        notes: newCallType.notes || '',
        version: newCallType.version || 'v1.0',
        status: newCallType.status || 'Active',
        summary: newCallType.summary || '',
        success_assessment: newCallType.success_assessment || '',
        first_sms: newCallType.first_sms || '' // Uusi kenttä
      }
      const { error } = await supabase.from('call_types').insert([insertData])
      if (error) throw error
      setAddTypeSuccess('Puhelutyyppi lisätty!')
      setNewCallType({ callType: '', label: '', description: '', identity: '', style: '', guidelines: '', goals: '', intro: '', questions: '', outro: '', notes: '', version: '', status: 'Active' })
      fetchCallTypes() // Päivitä lista
    } catch (e) {
      setAddTypeError('Lisäys epäonnistui: ' + (e.message || e))
    } finally {
      setAddTypeLoading(false)
    }
  }

  const closeModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setEditingCallType(null)
    setNewCallType({ 
      callType: '', 
      label: '', 
      description: '', 
      identity: '', 
      style: '', 
      guidelines: '', 
      goals: '', 
      intro: '', 
      questions: '', 
      outro: '', 
      notes: '', 
      version: '', 
      status: 'Active', 
      summary: '', 
      success_assessment: '',
      first_sms: '' // Uusi kenttä
    })
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
  const fetchCallLogs = async (page = currentPage) => {
    try {
      setLoadingCallLogs(true)
      setCallLogsError('')

      if (!user?.id) {
        setCallLogsError('Käyttäjän tunniste puuttuu!')
        return
      }

      // Hae ensin users.id käyttäen auth_user_id:tä
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userProfile) {
        setCallLogsError('Käyttäjää ei löytynyt!')
        return
      }

      let query = supabase
        .from('call_logs')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })

      // Lisää suodattimet
      if (searchTerm) {
        query = query.or(`customer_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }
      if (statusFilter) {
          if (statusFilter === 'success') {
            query = query.eq('call_status', 'done').eq('answered', true)
          } else if (statusFilter === 'failed') {
            query = query.eq('call_status', 'done').eq('answered', false)
          } else if (statusFilter === 'pending') {
            query = query.eq('call_status', 'pending')
          } else if (statusFilter === 'in_progress') {
            query = query.eq('call_status', 'in progress')
          }
      }
      if (callTypeFilter) {
        query = query.eq('call_type', callTypeFilter)
      }
      if (dateFrom) {
          query = query.gte('call_date', dateFrom)
      }
      if (dateTo) {
          query = query.lte('call_date', dateTo)
      }

      const { data: logs, error } = await query

      if (error) {
        throw new Error('Puhelulokin haku epäonnistui: ' + error.message)
      }

      setCallLogs(logs || [])
      setCurrentPage(page)
      setTotalCount(logs?.length || 0)
      
      // Poistettu tilastojen laskenta fetchCallLogs-funktiosta
    } catch (error) {
      console.error('Puhelulokin haku epäonnistui:', error)
      setCallLogsError('Puhelulokin haku epäonnistui: ' + (error.message || error))
    } finally {
      setLoadingCallLogs(false)
    }
  }

    useEffect(() => {
      if (user?.id && activeTab === 'logs') {
      fetchCallLogs()
      }
  }, [user, activeTab]) // Suoritetaan kun user tai activeTab muuttuu

  // Hae viestiloki
  const fetchMessageLogs = async () => {
    try {
      setLoadingMessageLogs(true)
      setMessageLogsError('')

      if (!user?.id) {
        setMessageLogsError('Käyttäjän tunniste puuttuu!')
        return
      }

      // Hae ensin users.id käyttäen auth_user_id:tä
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userProfile) {
        setMessageLogsError('Käyttäjää ei löytynyt!')
        return
      }

      const { data: logs, error } = await supabase
        .from('message_logs')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Viestilokin haku epäonnistui: ' + error.message)
      }

      setMessageLogs(logs || [])
    } catch (error) {
      console.error('Viestilokin haku epäonnistui:', error)
      setMessageLogsError('Viestilokin haku epäonnistui: ' + (error.message || error))
    } finally {
      setLoadingMessageLogs(false)
    }
  }

  useEffect(() => {
    if (user?.id && activeTab === 'messages') {
      fetchMessageLogs()
    }
  }, [user, activeTab])

  // Hae yksityiskohtaiset tiedot puhelusta
  const fetchLogDetail = async (log) => {
    try {
      setLoadingLogDetail(true)
      setSelectedLog(log)
      setShowLogDetail(true)
      
      // Käytä log-objektia suoraan, koska se sisältää kaikki tiedot
      
    } catch (error) {
      console.error('Yksityiskohtien haku epäonnistui:', error)
    } finally {
      setLoadingLogDetail(false)
    }
      }

  // ESC-näppäimen kuuntelija modaalin sulkemiseen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showLogDetail) {
        setShowLogDetail(false)
      }
    }

    if (showLogDetail) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showLogDetail])

  // Modaalin sulkeminen taustan klikkauksesta
  const handleModalBackgroundClick = (event) => {
    if (event.target === event.currentTarget) {
      setShowLogDetail(false)
    }
  }

  // Päivitä pending-puhelun tyyppi
  const handleUpdateCallType = async (log, newType) => {
    try {
      if (!log?.id) return
      setUpdatingLogIds(prev => ({ ...prev, [log.id]: true }))
      const selectedType = callTypes.find(t => t.name === newType || t.value === newType)
      const call_type_id = selectedType?.id || null
      const { error } = await supabase
        .from('call_logs')
        .update({ call_type: newType, call_type_id })
        .eq('id', log.id)
        .eq('call_status', 'pending')
      if (error) throw error
      await fetchCallLogs(currentPage)
    } catch (e) {
      alert('Puhelun tyypin vaihto epäonnistui: ' + (e.message || e))
    } finally {
      setUpdatingLogIds(prev => ({ ...prev, [log.id]: false }))
    }
  }

  // Peruuta pending-puhelu (poista rivi)
  const handleCancelCall = async (log) => {
    try {
      if (!log?.id) return
      if (!confirm('Peruutetaanko tämä puhelu?')) return
      setUpdatingLogIds(prev => ({ ...prev, [log.id]: true }))
      const { error } = await supabase
        .from('call_logs')
        .delete()
        .eq('id', log.id)
        .eq('call_status', 'pending')
      if (error) throw error
      await fetchCallLogs(currentPage)
    } catch (e) {
      alert('Puhelun peruutus epäonnistui: ' + (e.message || e))
    } finally {
      setUpdatingLogIds(prev => ({ ...prev, [log.id]: false }))
    }
  }

  // Export puheluloki CSV-muodossa
  const exportCallLogs = async () => {
    try {
      if (!user?.id) {
        alert('Käyttäjän tunniste puuttuu!')
        return
      }

      // Hae ensin users.id käyttäen auth_user_id:tä
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !userProfile) {
        alert('Käyttäjää ei löytynyt!')
        return
      }

      // Hae filtteröidyt call_logs käyttäjälle (samat filtterit kuin listassa)
      let exportQuery = supabase
        .from('call_logs')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })

      // Lisää suodattimet
      if (searchTerm) {
        exportQuery = exportQuery.or(`customer_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }
      if (statusFilter) {
        if (statusFilter === 'success') {
          exportQuery = exportQuery.eq('call_status', 'done').eq('answered', true)
        } else if (statusFilter === 'failed') {
          exportQuery = exportQuery.eq('call_status', 'done').eq('answered', false)
        } else if (statusFilter === 'pending') {
          exportQuery = exportQuery.eq('call_status', 'pending')
        } else if (statusFilter === 'in_progress') {
          exportQuery = exportQuery.eq('call_status', 'in progress')
        }
      }
      if (callTypeFilter) {
        exportQuery = exportQuery.eq('call_type', callTypeFilter)
      }
      if (dateFrom) {
        exportQuery = exportQuery.gte('call_date', dateFrom)
      }
      if (dateTo) {
        exportQuery = exportQuery.lte('call_date', dateTo)
      }

      const { data: logs, error } = await exportQuery

      if (error) {
        throw new Error('Puhelulokin haku epäonnistui: ' + error.message)
      }

      if (!logs || logs.length === 0) {
        alert('Ei puheluja exportattavaksi!')
        return
      }

      // Luo CSV sisältö
      const headers = [
        'Nimi',
        'Puhelinnumero',
        'Sähköposti',
        'Puhelun tyyppi',
        'Päivämäärä',
        'Vastattu',
        'Yhteydenotto',
        'Suunta',
        'Kesto',
        'Tila',
        'Yhteenveto',
        'Puhelun tulos',
        'Kampanja ID',
        'VAPI Call ID'
      ]

      const csvContent = [
        headers.join(','),
        ...logs.map(log => [
          `"${log.customer_name || ''}"`,
          `"${log.phone_number || ''}"`,
          `"${log.email || ''}"`,
          `"${log.call_type || ''}"`,
          `"${log.call_date ? new Date(log.call_date).toLocaleDateString('fi-FI') + ' ' + (log.call_time ? log.call_time : new Date(log.call_date).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })) : ''}"`,
          log.answered ? 'Kyllä' : 'Ei',
          log.wants_contact === true ? 'Otetaan yhteyttä' : 
          log.wants_contact === false ? 'Ei oteta yhteyttä' : 'Ei määritelty',
          log.direction === 'outbound' ? 'Lähtenyt' : 'Vastaanotettu',
          `"${log.duration ? formatDuration(log.duration) : ''}"`,
          (log.call_date && log.call_time) ? 'Ajastettu' : 
          (log.call_status === 'done' && log.call_outcome === 'cancelled') ? 'Peruttu' :
          log.call_status === 'done' && log.answered ? 'Onnistui' : 
          log.call_status === 'done' && !log.answered ? 'Epäonnistui' :
          log.call_status === 'pending' ? 'Odottaa' : 
          log.call_status === 'in progress' ? 'Käynnissä' : 
          'Tuntematon',
          `"${log.summary || ''}"`,
          `"${log.call_outcome || ''}"`,
          `"${log.campaign_id || ''}"`,
          `"${log.vapi_call_id || ''}"`
        ].join(','))
      ].join('\n')

      // Luo ja lataa CSV-tiedosto
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `puheluloki_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Export epäonnistui:', error)
      alert('Export epäonnistui: ' + error.message)
    }
  }

  // Filtteröinti ja haku
  const handleSearch = () => {
    setCurrentPage(1) // Palaa ensimmäiselle sivulle
    fetchCallLogs(1)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    fetchCallLogs(newPage)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setCallTypeFilter('')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
    fetchCallLogs(1)
  }

  // Polling-logiikka poistettu - ei tarvita

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

  // Ei erillistä auto-resizea; käytetään lohkoa, jossa maxHeight ja sisäinen scroll

  // Responsiivinen apu
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1200;
  let gridCols = '1fr';
  if (isTablet) gridCols = '1fr 1fr';
  if (!isMobile && !isTablet) gridCols = '1fr 1fr 1fr';

  // Tilastojen laskenta poistettu - käytetään callLogs dataa suoraan

  // Päivitetään voiceOptions dynaamisesti
  const getVoiceOptions = () => {
    let options = [...voiceOptions]
    if (userVoiceId && !options.some(v => v.id === userVoiceId)) {
      options = [
        { value: userVoiceId, label: userVoiceLabel + ' (oma)', id: userVoiceId },
        ...options
      ]
    }
    return options
  }

  // Mika Special - lomakehakufunktiot
  const fetchMikaContacts = async () => {
    setLoadingMikaContacts(true)
    setMikaContactsError('')
    
    try {
      const response = await fetch('/api/mika-special-contacts')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch contacts')
      }
      setMikaContacts(result.data || [])
      
    } catch (error) {
      console.error('Frontend: Error fetching Mika Special contacts:', error)
      setMikaContactsError(error.message)
    } finally {
      setLoadingMikaContacts(false)
    }
  }

  const handleMikaSearch = async () => {
    // Tarkista että vähintään yksi hakukenttä on täytetty
    if (!mikaSearchName.trim() && !mikaSearchTitle.trim() && !mikaSearchOrganization.trim()) {
      setMikaSearchResults([])
      return
    }
    
    setMikaSearchLoading(true)
    
    try {

      
      // Lähetä webhook-kutsu N8N:ään hakusanoilla
      const response = await fetch('/api/mika-special-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search_contacts',
          name: mikaSearchName.trim(),
          title: mikaSearchTitle.trim(),
          organization: mikaSearchOrganization.trim(),
          timestamp: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        throw new Error('Search request failed')
      }
      
      const result = await response.json()
      
      setMikaSearchResults(result.data || [])
      
    } catch (error) {
      console.error('Frontend: Error searching Mika contacts:', error)
      setMikaSearchResults([])
    } finally {
      setMikaSearchLoading(false)
    }
  }

  const handleMikaMassCall = async (contact) => {
    try {
      // Muodosta Google Sheets URL kontaktidatasta
      const contactData = {
        id: contact.id || null,
        name: contact.name,
        phone: contact.phones && contact.phones[0] ? contact.phones[0] : '',
        email: contact.primary_email || (contact.emails && contact.emails[0]) || '',
        company: contact.organization?.name || '',
        title: contact.custom_fields && contact.custom_fields[0] ? contact.custom_fields[0] : '',
        address: contact.organization?.address || ''
      }
      
      // Muodosta Google Sheets -yhteensopiva data-rakenne
      const columns = ['name', 'phone', 'email', 'company', 'title', 'address']
      const rows = [[
        contactData.name,
        contactData.phone,
        contactData.email,
        contactData.company,
        contactData.title,
        contactData.address
      ]]
      
      // Aseta kontaktidata mass-calls -kenttiin
      setSheetUrl('') // Tyhjennä Google Sheets URL
      setValidationResult({
        phoneCount: 1,
        success: true,
        columns: columns,
        rows: rows,
        data: [contactData]
      })
      
      // Siirry mass-calls -välilehdelle
      setActiveTab('calls')
      
      // Näytä ilmoitus
      alert(`Kontakti "${contact.name}" lisätty mass-calls -palikkaan! Siirry "Puhelut" -välilehdelle aloittaaksesi soitot.`)
      
    } catch (error) {
      console.error('Frontend: Error starting mass calls:', error)
      alert('Virhe mass-calls -palikan alustamisessa')
    }
  }

  const handleMikaSingleCall = async (contact) => {
    
    
    try {
      // Aseta kontaktidata yksittäiseen soittoon
      setPhoneNumber(contact.phones && contact.phones[0] ? contact.phones[0] : '')
      setName(contact.name || '')
      
      // Siirry mass-calls -välilehdelle
      setActiveTab('calls')
      
      // Näytä ilmoitus
      alert(`Kontakti "${contact.name}" lisätty yksittäiseen soittoon! Siirry "Puhelut" -välilehdelle aloittaaksesi soiton.`)
      
    } catch (error) {
      console.error('Frontend: Error starting single call:', error)
      alert('Virhe yksittäisen soiton alustamisessa')
    }
  }

  const handleMikaMassCallAll = async () => {
    // Tämä funktio ei enää tarvita, koska se on siirretty MikaSpecialTab-komponenttiin
  }

  // Lisää useita Mika Special -valittuja kontakteja mass-calls -palikkaan
  const handleMikaMassCallSelected = (selectedContacts) => {
    try {
      const columns = ['name', 'phone', 'email', 'company', 'title', 'address']
      const rows = selectedContacts.map(c => [
        c.name || '',
        c.phone || '',
        c.email || '',
        c.company || '',
        c.title || '',
        c.address || ''
      ])

      // Korvaa nykyinen mass-calls data
      setSheetUrl('')
      setValidationResult({
        phoneCount: rows.length,
        success: true,
        columns,
        rows,
        data: selectedContacts
      })

      // Siirry mass-calls -välilehdelle
      setActiveTab('calls')
    } catch (error) {
      console.error('Virhe valittujen kontaktien lisäämisessä mass-calls -palikkaan:', error)
      alert('Virhe valittujen kontaktien lisäämisessä mass-calls -palikkaan')
    }
  }

  // Hae kontakteja kun Mika Special -välilehti avataan
  useEffect(() => {
    if (activeTab === 'mika' && mikaContacts.length === 0) {
      fetchMikaContacts()
    }
  }, [activeTab])

  // Alusta massCallCallType kun callTypes ladataan
  useEffect(() => {
    if (callTypes.length > 0 && !massCallCallType) {
      setMassCallCallType(callTypes[0].value)
    }
  }, [callTypes, massCallCallType])

  // Massapuhelumodaalin funktiot
  const handleMassCallValidate = async () => {
    setMassCallValidating(true)
    setMassCallError('')
    setMassCallValidationResult(null)
    try {
      const user_id = user?.id

      const res = await fetch('/api/validate-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sheetUrl: massCallSheetUrl, user_id })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMassCallValidationResult(data)
        setMassCallStep(2) // Siirry seuraavalle sivulle
      } else {
        setMassCallError(data.error || 'Validointi epäonnistui')
      }
    } catch (e) {
      console.error('❌ Mass call validate-sheet virhe:', e)
      const errorMessage = e.response?.data?.error || 'Validointi epäonnistui'
      setMassCallError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage))
    } finally {
      setMassCallValidating(false)
    }
  }

  const handleMassCallStart = async () => {
    setMassCallStarting(true)
    setMassCallError('')
    try {
      // Käytä backendin APIa massapuhelujen luontiin (ei suoria Supabase-kutsuja frontendista)
      if (!massCallSheetUrl) throw new Error('Google Sheets URL puuttuu')
      if (!massCallCallType) throw new Error('Puhelun tyyppi puuttuu')

      const selectedVoiceObj = getVoiceOptions().find(v => v.value === massCallSelectedVoice)
      const session = await supabase.auth.getSession()
      const token = session?.data?.session?.access_token
      const res = await fetch('/api/mass-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          sheetUrl: massCallSheetUrl,
          callType: massCallCallType,
          voice: massCallSelectedVoice,
          voice_id: selectedVoiceObj?.id,
          user_id: user?.id,
          sms_first: massCallSmsFirst === true
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Massapuhelujen aloitus epäonnistui')
      }

      alert(`✅ Massapuhelut käynnistetty!\n\nLisätty: ${data.startedCalls ?? data.totalCalls ?? ''} puhelua`)
      setShowMassCallModal(false)
      setMassCallStep(1)
      setMassCallSheetUrl('')
      setMassCallValidationResult(null)
      setMassCallCallType('')
      setMassCallSelectedVoice('rascal-nainen-1')
      fetchCallLogs()
      return
      // Käytä normaalia mass-call API:a Google Sheets -datalle
      const user_id = user?.id

      // Hae ensin public.users.id käyttäen auth_user_id:tä
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user_id)
        .single()

      if (userError || !userData) {
        throw new Error('Käyttäjää ei löytynyt')
      }

      const publicUserId = userData.id

      // Hae call_type_id call_types taulusta
      const { data: callTypeData, error: callTypeError } = await supabase
        .from('call_types')
        .select('id')
        .eq('name', massCallCallType)
        .eq('user_id', publicUserId)
        .single()

      if (callTypeError || !callTypeData) {
        throw new Error('Puhelun tyyppiä ei löytynyt')
      }

      const call_type_id = callTypeData.id

      // Käytä massCallValidationResult.rows dataa ja lisää jokainen suoraan Supabaseen
      if (!massCallValidationResult || !massCallValidationResult.rows) {
        throw new Error('Validointi pitää suorittaa ensin')
      }

      const callLogs = []
      let successCount = 0
      let errorCount = 0

      // Etsi sarakkeiden otsikot ensin
      let nameColumn = null
      let phoneColumn = null
      let emailColumn = null
      
      // Etsi nimisarakkeen otsikko
      for (const columnName of massCallValidationResult.columns || []) {
        if (columnName.toLowerCase().includes('name') || 
            columnName.toLowerCase().includes('nimi') ||
            columnName.toLowerCase().includes('etunimi') ||
            columnName.toLowerCase().includes('sukunimi')) {
          nameColumn = columnName
          break
        }
      }
      
      // Etsi puhelinnumerosarakkeen otsikko
      for (const columnName of massCallValidationResult.columns || []) {
        if (columnName.toLowerCase().includes('phone') || 
            columnName.toLowerCase().includes('puhelin') || 
            columnName.toLowerCase().includes('numero') ||
            columnName.toLowerCase().includes('tel')) {
          phoneColumn = columnName
          break
        }
      }

      // Etsi sähköpostisarakkeen otsikko (tiukempi tunnistus)
      for (const columnName of massCallValidationResult.columns || []) {
        const lower = String(columnName).toLowerCase().trim()
        if (
          lower === 'email' ||
          lower === 'e-mail' ||
          lower.includes('email') ||
          lower.includes('sähköposti') ||
          lower.includes('sahkoposti')
        ) {
          emailColumn = columnName
          break
        }
      }
      
      if (!nameColumn || !phoneColumn) {
        throw new Error('Vaadittuja sarakkeita ei löytynyt. Tarvitaan sekä nimisarakke että puhelinnumerosarakke.')
      }

      for (const [rowIndex, row] of (massCallValidationResult.rows || []).entries()) {
        // Hae arvot sarakkeiden otsikoiden perusteella
        const phoneNumber = normalizePhoneNumber(row[phoneColumn])
        const name = row[nameColumn] ? row[nameColumn].trim() : null

        // Lisää vain jos on sekä selkeä nimi että puhelinnumero
        if (name && phoneNumber && name.trim() !== '' && phoneNumber.trim() !== '' && phoneNumber.startsWith('+358')) {
          // Ota sähköposti sarakkeesta, validoi ja fallbackaa jos otsikkoa ei löytynyt
          const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i
          let emailValue = null
          if (emailColumn) {
            const raw = row[emailColumn]
            if (raw && emailRegex.test(String(raw).trim())) {
              emailValue = String(raw).trim().toLowerCase().substring(0, 120)
            }
          } else {
            // Fallback: etsi mikä tahansa sähköpostin näköinen arvo riviltä
            for (const key of Object.keys(row)) {
              const val = row[key]
              if (val && emailRegex.test(String(val).trim())) {
                emailValue = String(val).trim().toLowerCase().substring(0, 120)
                break
              }
            }
          }
          // Hae valitun äänen id
          const selectedVoiceObj = getVoiceOptions().find(v => v.value === massCallSelectedVoice)
          const voiceId = selectedVoiceObj?.id
          
          callLogs.push({
            user_id: publicUserId,
            call_type_id: call_type_id,
            customer_name: name,
            phone_number: phoneNumber,
            email: emailValue,
            voice_id: voiceId,
            call_status: 'pending',
            call_date: new Date().toISOString().split('T')[0],
            call_time: new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
            answered: false,
            duration: null,
                          summary: `Mass-call: ${massCallCallType}`,  // Käytä summary saraketta notes sijaan
            created_at: new Date().toISOString(),
            sms_first: massCallSmsFirst === true
          })
        }
      }

      if (callLogs.length === 0) {
        throw new Error('Ei kelvollisia puhelinnumeroita löytynyt')
      }

      // Lisää kaikki call_logs Supabaseen
      const { error: insertError } = await supabase
        .from('call_logs')
        .insert(callLogs)

      if (insertError) {
        throw new Error('Puhelulokien lisäys epäonnistui: ' + insertError.message)
      }

      successCount = callLogs.length
      
      // Näytä onnistumisviesti ja sulje modaali
      alert(`✅ Massapuhelut käynnistetty onnistuneesti!\n\nAloitettu: ${successCount} puhelua`)
      setShowMassCallModal(false)
      setMassCallStep(1)
      setMassCallSheetUrl('')
      setMassCallValidationResult(null)
      setMassCallCallType('')
      setMassCallSelectedVoice('rascal-nainen-1')
      
      // Päivitä puheluloki
      fetchCallLogs()
      
    } catch (error) {
      console.error('Mass call start error:', error)
      setMassCallError(error.message)
    } finally {
      setMassCallStarting(false)
    }
  }

  const handleMassCallSchedule = async () => {
    setMassCallScheduling(true)
    setMassCallError('')
    try {
      // Käytä backendin APIa ja välitä ajastus
      if (!massCallSheetUrl) throw new Error('Google Sheets URL puuttuu')
      if (!massCallCallType) throw new Error('Puhelun tyyppi puuttuu')
      if (!massCallScheduledDate || !massCallScheduledTime) throw new Error('Ajastuksen päivä ja aika vaaditaan')

      const selectedVoiceObj2 = getVoiceOptions().find(v => v.value === massCallSelectedVoice)
      const session2 = await supabase.auth.getSession()
      const token2 = session2?.data?.session?.access_token
      const res = await fetch('/api/mass-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token2 ? { Authorization: `Bearer ${token2}` } : {}) },
        body: JSON.stringify({
          sheetUrl: massCallSheetUrl,
          callType: massCallCallType,
          voice: massCallSelectedVoice,
          voice_id: selectedVoiceObj2?.id,
          user_id: user?.id,
          scheduledDate: massCallScheduledDate,
          scheduledTime: massCallScheduledTime,
          sms_first: massCallSmsFirst === true
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Ajastuksen tallennus epäonnistui')
      }

      alert(`✅ Puhelut ajastettu!\n\nPäivä: ${massCallScheduledDate} klo ${massCallScheduledTime}\nYhteensä: ${data.startedCalls ?? data.totalCalls ?? ''} puhelua`)
      setShowMassCallModal(false)
      setMassCallStep(1)
      setMassCallSheetUrl('')
      setMassCallValidationResult(null)
      setMassCallCallType('')
      setMassCallSelectedVoice('rascal-nainen-1')
      setMassCallScheduledDate('')
      setMassCallScheduledTime('')
      fetchCallLogs()
      return
      // Tallenna ajastetut puhelut call_logs tauluun
      const user_id = user?.id

      // Hae ensin public.users.id käyttäen auth_user_id:tä
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user_id)
        .single()

      if (userError || !userData) {
        throw new Error('Käyttäjää ei löytynyt')
      }

      const publicUserId = userData.id

      // Hae call_type_id call_types taulusta
      const { data: callTypeData, error: callTypeError } = await supabase
        .from('call_types')
        .select('id')
        .eq('name', massCallCallType)
        .eq('user_id', publicUserId)
        .single()

      if (callTypeError || !callTypeData) {
        throw new Error('Puhelun tyyppiä ei löytynyt')
      }

      const call_type_id = callTypeData.id

      // Käytä massCallValidationResult.rows dataa ja lisää jokainen suoraan Supabaseen
      if (!massCallValidationResult || !massCallValidationResult.rows) {
        throw new Error('Validointi pitää suorittaa ensin')
      }

      const scheduledCallLogs = []
      let successCount = 0

      // Etsi sarakkeiden otsikot ensin
      let nameColumn = null
      let phoneColumn = null
      let emailColumn = null
      
      // Etsi nimisarakkeen otsikko
      for (const columnName of massCallValidationResult.columns || []) {
        if (columnName.toLowerCase().includes('name') || 
            columnName.toLowerCase().includes('nimi') ||
            columnName.toLowerCase().includes('etunimi') ||
            columnName.toLowerCase().includes('sukunimi')) {
          nameColumn = columnName
          break
        }
      }
      
      // Etsi puhelinnumerosarakkeen otsikko
      for (const columnName of massCallValidationResult.columns || []) {
        if (columnName.toLowerCase().includes('phone') || 
            columnName.toLowerCase().includes('puhelin') || 
            columnName.toLowerCase().includes('numero') ||
            columnName.toLowerCase().includes('tel')) {
          phoneColumn = columnName
          break
        }
      }

      // Etsi sähköpostisarakkeen otsikko (tiukempi tunnistus)
      for (const columnName of massCallValidationResult.columns || []) {
        const lower = String(columnName).toLowerCase().trim()
        if (
          lower === 'email' ||
          lower === 'e-mail' ||
          lower.includes('email') ||
          lower.includes('sähköposti') ||
          lower.includes('sahkoposti')
        ) {
          emailColumn = columnName
          break
        }
      }
      
      if (!nameColumn || !phoneColumn) {
        throw new Error('Vaadittuja sarakkeita ei löytynyt. Tarvitaan sekä nimisarakke että puhelinnumerosarakke.')
      }

      for (const [rowIndex, row] of (massCallValidationResult.rows || []).entries()) {
        // Hae arvot sarakkeiden otsikoiden perusteella
        const phoneNumber = normalizePhoneNumber(row[phoneColumn])
        const name = row[nameColumn] ? row[nameColumn].trim() : null

        // Lisää vain jos on sekä selkeä nimi että puhelinnumero
        if (name && phoneNumber && name.trim() !== '' && phoneNumber.trim() !== '' && phoneNumber.startsWith('+358')) {
          // Ota sähköposti sarakkeesta, validoi ja fallbackaa jos otsikkoa ei löytynyt
          const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i
          let emailValue = null
          if (emailColumn) {
            const raw = row[emailColumn]
            if (raw && emailRegex.test(String(raw).trim())) {
              emailValue = String(raw).trim().toLowerCase().substring(0, 120)
            }
          } else {
            // Fallback: etsi mikä tahansa sähköpostin näköinen arvo riviltä
            for (const key of Object.keys(row)) {
              const val = row[key]
              if (val && emailRegex.test(String(val).trim())) {
                emailValue = String(val).trim().toLowerCase().substring(0, 120)
                break
              }
            }
          }
          // Hae valitun äänen id
          const selectedVoiceObj = getVoiceOptions().find(v => v.value === massCallSelectedVoice)
          const voiceId = selectedVoiceObj?.id
          
          scheduledCallLogs.push({
            user_id: publicUserId,
            call_type_id: call_type_id,
            customer_name: name,
            phone_number: phoneNumber,
            email: emailValue,
            voice_id: voiceId,
            call_status: 'pending',
            call_date: massCallScheduledDate,        // AJASTETTU päivämäärä
            call_time: massCallScheduledTime,        // AJASTETTU kellonaika
            answered: false,
            duration: null,
            summary: `Scheduled mass-call: ${massCallCallType}`,  // Käytä summary saraketta notes sijaan
            created_at: new Date().toISOString()
          })
        }
      }

      if (scheduledCallLogs.length === 0) {
        throw new Error('Ei kelvollisia puhelinnumeroita löytynyt')
      }

      // Lisää kaikki ajastetut puhelut call_logs tauluun
      const { error: insertError } = await supabase
        .from('call_logs')
        .insert(scheduledCallLogs)

      if (insertError) {
        throw new Error('Ajastettujen puhelujen lisäys epäonnistui: ' + insertError.message)
      }

      successCount = scheduledCallLogs.length
      
      // Näytä onnistumisviesti ja sulje modaali
      alert(`✅ Puhelut ajastettu onnistuneesti!\n\nAjastettu: ${massCallScheduledDate} klo ${massCallScheduledTime}\n\nYhteensä: ${successCount} puhelua`)
      setShowMassCallModal(false)
      setMassCallStep(1)
      setMassCallSheetUrl('')
      setMassCallValidationResult(null)
      setMassCallCallType('')
      setMassCallSelectedVoice('rascal-nainen-1')
      setMassCallScheduledDate('')
      setMassCallScheduledTime('')
      
      // Päivitä puheluloki
      fetchCallLogs()
      
    } catch (error) {
      console.error('Mass call schedule error:', error)
      setMassCallError(error.message)
    } finally {
      setMassCallScheduling(false)
    }
  }

  const resetMassCallModal = () => {
    setShowMassCallModal(false)
    setMassCallStep(1)
    setMassCallSheetUrl('')
    setMassCallValidationResult(null)
    setMassCallError('')
    setMassCallCallType(callTypes.length > 0 ? callTypes[0].value : '')
    setMassCallSelectedVoice('rascal-nainen-1')
    setMassCallScheduledDate('')
    setMassCallScheduledTime('')
  }

  return (
    <>
      <PageMeta 
        title="Puhelut - Rascal AI"
        description="Automatisoi puhelut ja seuraa puhelulokeja Rascal AI:ssä. Älykäs puhelinmarkkinointi ja asiakaspalvelu."
        image="/hero.png"
      />
      <div className="callpanel-container">
    <div className="callpanel-wrapper" style={{ width: '100%', maxWidth: 'none' }}>
      <div className="callpanel-root" style={{ width: '100%', maxWidth: 'none' }}>
        {/* Tabs (3 per rivi) */}
        <div className="callpanel-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'contents' }}>
            <Button onClick={() => setActiveTab('calls')} variant={activeTab === 'calls' ? 'primary' : 'secondary'}>📞 Puhelut</Button>
            <Button onClick={() => setActiveTab('logs')} variant={activeTab === 'logs' ? 'primary' : 'secondary'}>📊 Puheluloki</Button>
            <Button onClick={() => setActiveTab('messages')} variant={activeTab === 'messages' ? 'primary' : 'secondary'}>💬 Viestiloki</Button>
          </div>
          <div style={{ display: 'contents' }}>
            <Button onClick={() => setActiveTab('textmessages')} variant={activeTab === 'textmessages' ? 'primary' : 'secondary'}>📱 Tekstiviestit</Button>
            <Button onClick={() => setActiveTab('manage')} variant={activeTab === 'manage' ? 'primary' : 'secondary'}>⚙️ Hallinta</Button>
            {isMika ? (
              <Button onClick={() => setActiveTab('mika')} variant={activeTab === 'mika' ? 'primary' : 'secondary'}>🎯 Mika Special</Button>
            ) : (
              <span />
            )}
          </div>
        </div>
        
        {/* Sisältö */}
        {activeTab === 'calls' && (
          <div className="callpanel-grid" style={{ width: '100%', maxWidth: 'none' }}>
            {/* Aloita puhelut -kortti - näkyy kaikille */}
            {(
              <div className="card">
              <h2 className="section-title">Aloita massapuhelut</h2>
              <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 15 }}>
                Aloita massapuhelut Google Sheets -datalle tai ajasta ne myöhemmäksi.
              </p>
                  <Button
                onClick={() => setShowMassCallModal(true)}
                  variant="primary"
                style={{ width: '100%', padding: '16px 24px', fontSize: 16, fontWeight: 600 }}
                >
                🚀 Aloita massapuhelut
                </Button>
            </div>
            )}
            
            {/* Mika Special - VIP-kortti poistettu pyynnöstä */}
            
            {/* Tee puhelu -kortti: nappi avaa modaalin */}
            <div className="card">
              <h2 className="section-title">Soita yksittäinen puhelu</h2>
              <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 15 }}>
                Valitse puhelun tyyppi ja tiedot modaalissa.
              </p>
              <Button
                onClick={() => { setShowSingleCallModal(true); setSingleCallStep(1) }}
                variant="primary"
                style={{ width: '100%', padding: '16px 24px', fontSize: 16, fontWeight: 600 }}
              >
                📞 Soita yksittäinen puhelu
              </Button>
            </div>
            {/* Toiminnot -kortti */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Asetukset</h2>
                {callType && script.trim() && selectedVoice && (
                  <div style={{ background: '#e6fbe8', color: '#1a7f37', padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>✅ Valmis</div>
                )}
              </div>
              <label className="label">Puhelun tyyppi</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <select value={callType} onChange={e => { setCallType(e.target.value); updateScriptFromCallType(e.target.value); }} disabled={loadingCallTypes} className="select">
                  {loadingCallTypes ? <option>Ladataan puhelun tyyppejä...</option> : callTypes.length === 0 ? <option>Ei puhelun tyyppejä saatavilla</option> : callTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
                <Button
                  variant="secondary"
                  onClick={() => setActiveTab('manage')}
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
                >
                  ➕ Lisää uusi
                </Button>
              </div>
              <label className="label">Ääni</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="select">
                  {getVoiceOptions().map(voice => <option key={voice.value} value={voice.value}>{voice.label}</option>)}
                </select>
                <Button 
                  variant="secondary"
                  onClick={() => playVoiceSample(selectedVoice)}
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
                >
                  {isPlaying ? '⏹️ Pysäytä' : '🔊 Testaa ääni'}
                </Button>
              </div>
              <label className="label">Skripti</label>
              <div className="textarea" style={{ minHeight: 90, background: '#f9fafb', color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: 200 }}>
                {script ? script : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Valitse puhelun tyyppi nähdäksesi skriptin</span>}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Skripti päivittyy automaattisesti valitun puhelutyyppin mukaan</div>
            </div>
            {/* Inbound-asetukset -kortti */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 className="section-title">Inbound-asetukset</h2>
                <Button
                  variant="secondary"
                  onClick={() => setShowInboundModal(true)}
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
                >
                  📝 Muokkaa isossa ikkunassa
                </Button>
              </div>
              <label className="label">Ääni</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <select value={inboundVoice} onChange={e => setInboundVoice(e.target.value)} className="select">
                  {getVoiceOptions().map(voice => <option key={voice.value} value={voice.value}>{voice.label}</option>)}
                </select>
                <Button 
                  variant="secondary"
                  onClick={() => playVoiceSample(inboundVoice)}
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
                >
                  🔊 Testaa
                </Button>
              </div>
              <label className="label">Aloitusviesti</label>
              <textarea value={inboundWelcomeMessage} onChange={e => setInboundWelcomeMessage(e.target.value)} placeholder="Kirjoita aloitusviesti..." rows={3} className="textarea" />
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>Ensimmäinen viesti joka lähetetään asiakkaalle</div>
              
              <label className="label">Inbound-skripti</label>
              <textarea value={inboundScript} onChange={e => setInboundScript(e.target.value)} placeholder="Kirjoita inbound-puhelujen skripti..." rows={5} className="textarea" />
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>Tervehdys ja ohjeistus asiakkaille jotka soittavat sinulle</div>
              <Button
                onClick={handleSaveInboundSettings}
                variant="primary"
              >
                💾 Tallenna asetukset
              </Button>
            </div>
          </div>
        )}
          
        {activeTab === 'logs' && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            padding: 32,
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                📊 Puheluloki
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  type="button"
                  onClick={exportCallLogs}
                  variant="secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: 14,
                    background: '#10b981',
                    color: '#fff'
                  }}
                >
                  📥 Export CSV
                </Button>
                <Button
                  type="button"
                  onClick={() => fetchCallLogs()}
                  disabled={loadingCallLogs}
                  variant="secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: 14,
                    background: loadingCallLogs ? '#9ca3af' : '#3b82f6',
                    color: '#fff'
                  }}
                >
                  {loadingCallLogs ? '🔄 Päivitetään...' : '🔄 Päivitä'}
                </Button>
              </div>
            </div>
            
            {/* Filtterit */}
            <div style={{ 
              background: '#f8fafc', 
              padding: 24, 
              borderRadius: 12, 
              border: '1px solid #e2e8f0',
              marginBottom: 32
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#374151' }}>
                🔍 Filtterit ja haku
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                    Hae nimeä, numeroa tai sähköpostia
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Matti Meikäläinen, +358... tai matt@example.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                    Tila
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  >
                    <option value="">Kaikki</option>
                    <option value="success">Onnistuneet</option>
                    <option value="failed">Epäonnistuneet</option>
                    <option value="pending">Odottaa</option>
                        <option value="in_progress">Käynnissä</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                    Puhelun tyyppi
                  </label>
                  <select
                    value={callTypeFilter}
                    onChange={(e) => setCallTypeFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  >
                    <option value="">Kaikki</option>
                    {callTypes.map(type => (
                          <option key={type.id} value={type.name}>
                            {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                    Päivämäärä alkaen
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                    Päivämäärä asti
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  onClick={handleSearch}
                  disabled={loadingCallLogs}
                  style={{ fontSize: 14, fontWeight: 500, marginRight: 8 }}
                >
                  🔍 Hae
                </Button>
                <Button
                  onClick={clearFilters}
                  style={{ fontSize: 14, fontWeight: 500 }}
                  variant="secondary"
                >
                  🗑️ Tyhjennä filtterit
                </Button>
              </div>
            </div>
            
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
                    {callLogs.filter(log => log.call_status === 'done' && log.answered).length}
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
                    {callLogs.filter(log => log.call_status === 'done' && !log.answered).length}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>Epäonnistuneet</div>
              </div>
              
              <div style={{ 
                background: '#f8fafc', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e2e8f0' 
              }}>
                                    <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
                    {callLogs.filter(log => log.call_status === 'pending').length}
                </div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>Odottaa</div>
              </div>

              <div style={{ 
                background: '#f8fafc', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e2e8f0' 
              }}>
                                    <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6', marginBottom: 8 }}>
                    {callLogs.filter(log => log.call_status === 'in progress').length}
                  </div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>Käynnissä</div>
                  </div>
                  
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: 24, 
                    borderRadius: 12, 
                    border: '1px solid #e2e8f0' 
                  }}>
                                    <div style={{ fontSize: 32, fontWeight: 700, color: '#6366f1', marginBottom: 8 }}>
                    {callLogs.length}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>Yhteensä</div>
              </div>
              
              {/* Outbound/Inbound tilastot */}
              <div style={{ 
                background: '#f8fafc', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e2e8f0' 
              }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>
                  {callLogs.filter(log => log.direction === 'outbound').length}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>Lähteneet puhelut</div>
              </div>
              
              <div style={{ 
                background: '#f8fafc', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e2e8f0' 
              }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>
                  {callLogs.filter(log => log.direction === 'inbound').length}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>Vastaanotetut puhelut</div>
              </div>
              
              {/* Hinta-tilastot */}
              <div style={{ 
                background: '#f8fafc', 
                padding: 24, 
                borderRadius: 12, 
                border: '1px solid #e2e8f0' 
              }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#059669', marginBottom: 8 }}>
                  €{callLogs.reduce((total, log) => {
                    const price = parseFloat(log.price) || 0
                    return total + price
                  }, 0).toFixed(2)}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280' }}>Kokonaishinta</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#374151' }}>
                  Puheluhistoria
                </h3>
                {totalCount > 0 && (
                  <div style={{ fontSize: 14, color: '#6b7280' }}>
                    Yhteensä {totalCount} puhelua
                  </div>
                )}
              </div>
              

              
              {loadingCallLogs ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                  Ladataan puhelulokia...
                </div>
              ) : callLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                  Ei puheluja löytynyt valituilla filttereillä
                </div>
              ) : (
                <div style={{ overflowX: 'auto', marginBottom: 24 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', color: '#374151' }}>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Nimi</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Puhelinnumero</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Sähköposti</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Yhteenveto</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Puhelun tyyppi</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Päivämäärä</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Vastattu</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Yhteydenotto</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Suunta</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Kesto</th>
                        <th style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>Tila</th>
                        <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Toiminnot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {callLogs.map((log, index) => (
                        <tr
                              key={log.id || index}
                          onClick={() => fetchLogDetail(log)}
                          style={{
                            background: '#fff',
                            cursor: 'pointer',
                            borderBottom: '1px solid #e5e7eb',
                            transition: 'background 0.15s',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseOut={e => e.currentTarget.style.background = '#fff'}
                        >
                              <td style={{ padding: '8px', fontWeight: 500 }}>{log.customer_name || 'Tuntematon nimi'}</td>
                              <td style={{ padding: '8px' }}>{log.phone_number || '-'}</td>
                              <td style={{ padding: '8px' }}>{log.email || '-'}</td>
                              <td style={{ padding: '8px', color: '#6b7280', fontSize: 13 }}>
                                {log.summary ? (log.summary.length > 50 ? log.summary.substring(0, 50) + '...' : log.summary) : '-'}
                              </td>
                              <td style={{ padding: '8px' }}>{log.call_type || '-'}</td>
                              <td style={{ padding: '8px' }}>
                                {log.call_date ? (
                                  new Date(log.call_date).toLocaleDateString('fi-FI') + ' ' + (log.call_time ? log.call_time : new Date(log.call_date).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }))
                                ) : '-'}
                              </td>
                              <td style={{ padding: '8px' }}>{log.answered ? 'Kyllä' : 'Ei'}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                                {log.wants_contact === true ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                                    background: '#dcfce7',
                                    color: '#166534',
                                    minWidth: 80
                                  }}>
                                    ✅ Otetaan yhteyttä
                                  </span>
                                ) : log.wants_contact === false ? (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '3px 10px',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    minWidth: 80
                                  }}>
                                    ❌ Ei oteta yhteyttä
                                  </span>
                                ) : (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '3px 10px',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: '#f3f4f6',
                                    color: '#6b7280',
                                    minWidth: 80
                                  }}>
                                    ⚪ Ei määritelty
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '3px 10px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: log.direction === 'outbound' ? '#dbeafe' : '#fef3c7',
                                  color: log.direction === 'outbound' ? '#1d4ed8' : '#92400e',
                                  minWidth: 80
                                }}>
                                  {log.direction === 'outbound' ? '📤 Lähtenyt' : '📥 Vastaanotettu'}
                                </span>
                              </td>
                              <td style={{ padding: '8px' }}>
                                {log.duration ? formatDuration(log.duration) : '-'}
                              </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                                  background: (log.call_date && log.call_time) ? '#e0f2fe' :
                                            (log.call_status === 'done' && log.call_outcome === 'cancelled') ? '#fee2e2' :
                                            log.call_status === 'done' && log.answered ? '#dcfce7' : 
                                            log.call_status === 'pending' ? '#f3f4f6' : 
                                            log.call_status === 'in progress' ? '#dbeafe' : '#fef2f2',
                                  color: (log.call_date && log.call_time) ? '#0369a1' :
                                         (log.call_status === 'done' && log.call_outcome === 'cancelled') ? '#b91c1c' :
                                         log.call_status === 'done' && log.answered ? '#166534' : 
                                         log.call_status === 'pending' ? '#6b7280' : 
                                         log.call_status === 'in progress' ? '#1d4ed8' : '#dc2626',
                              minWidth: 60
                            }}>
                                  {(log.call_date && log.call_time) ? 'Ajastettu' : 
                                   (log.call_status === 'done' && log.call_outcome === 'cancelled') ? 'Peruttu' :
                                   log.call_status === 'done' && log.answered ? 'Onnistui' : 
                                   log.call_status === 'done' && !log.answered ? 'Epäonnistui' :
                                   log.call_status === 'pending' ? 'Odottaa' : 
                                   log.call_status === 'in progress' ? 'Käynnissä' : 'Tuntematon'}
                            </span>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                            {log.call_status === 'pending' ? (
                              <div style={{ display: 'inline-flex', gap: 8 }}>
                                <select
                                  value={log.call_type || ''}
                                  onChange={(e) => handleUpdateCallType(log, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  disabled={!!updatingLogIds[log.id]}
                                  style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }}
                                >
                                  <option value="">Vaihda tyyppi...</option>
                                  {callTypes.map(type => (
                                    <option key={type.id} value={type.name}>{type.name}</option>
                                  ))}
                                </select>
                                <Button
                                  variant="secondary"
                                  onClick={(e) => { e.stopPropagation(); handleCancelCall(log) }}
                                  disabled={!!updatingLogIds[log.id]}
                                  style={{ padding: '4px 10px', fontSize: 12, background: '#ef4444', color: '#fff' }}
                                >
                                  Peruuta
                                </Button>
                              </div>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'manage' && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            padding: 32,
            width: '100%'
          }}>
            {/* Toast-viestit */}
            {successMessage && (
              <div style={{
                background: '#dcfce7',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                color: '#166534',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>✅ {successMessage}</span>
                <button
                  onClick={() => setSuccessMessage('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#166534',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: 0
                  }}
                >
                  ×
                </button>
              </div>
            )}
            
            {errorMessage && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                color: '#dc2626',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>❌ {errorMessage}</span>
                <button
                  onClick={() => setErrorMessage('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: 0
                  }}
                >
                  ×
                </button>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                ⚙️ Puhelun tyyppien hallinta
              </h2>
              <Button
                type="button"
                onClick={openAddModal}
                variant="primary"
                style={{
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                ➕ Lisää uusi tyyppi
              </Button>
            </div>
            
            <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: 14 }}>
                  Hallitse puhelun tyyppejä Supabase-tietokannassa. Vain Active-status olevat tyypit näkyvät puheluissa.
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
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: 8, 
                      alignItems: 'center', 
                      fontSize: 12, 
                      color: '#6b7280',
                      marginBottom: 8
                    }}>
                      <span>Järjestä:</span>
                      <button
                        onClick={() => setCallTypes([...callTypes].sort((a, b) => a.status === 'Active' ? -1 : b.status === 'Active' ? 1 : 0))}
                        style={{
                          background: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          cursor: 'pointer',
                          color: '#374151'
                        }}
                      >
                        🔄 Status
                      </button>
                      <button
                        onClick={() => setCallTypes([...callTypes].sort((a, b) => a.label.localeCompare(b.label)))}
                        style={{
                          background: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          cursor: 'pointer',
                          color: '#374151'
                        }}
                      >
                        🔤 Nimi
                      </button>
                    </div>
                  </div>
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
                          <span style={{ 
                            marginLeft: 12, 
                            padding: '4px 8px', 
                            borderRadius: 12, 
                            fontSize: 10, 
                            fontWeight: 600, 
                            background: type.status === 'Active' ? '#dcfce7' : type.status === 'Draft' ? '#fef3c7' : '#f3f4f6',
                            color: type.status === 'Active' ? '#166534' : type.status === 'Draft' ? '#92400e' : '#6b7280',
                            border: type.status === 'Active' ? '1px solid #bbf7d0' : type.status === 'Draft' ? '1px solid #fed7aa' : '1px solid #e5e7eb'
                          }}>
                            {type.status === 'Active' ? '✅ Aktiivinen' : type.status === 'Draft' ? '📝 Luonnos' : '❓ Tuntematon'}
                          </span>
                        </div>
                        {type.description && (
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            {type.description}
                          </div>
                        )}
                      </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCallType(type.id)
                              }}
                              disabled={deletingCallTypes.has(type.id)}
                              variant="secondary"
                              style={{
                                background: deletingCallTypes.has(type.id) ? '#9ca3af' : '#ef4444',
                                color: '#fff',
                                padding: '4px 8px',
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: deletingCallTypes.has(type.id) ? 'not-allowed' : 'pointer'
                              }}
                              title={deletingCallTypes.has(type.id) ? 'Poistetaan...' : 'Poista puhelun tyyppi'}
                            >
                              {deletingCallTypes.has(type.id) ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              ) : (
                                '🗑️'
                              )}
                            </Button>
                      <div style={{ color: '#6b7280', fontSize: 14 }}>
                        ✏️
                            </div>
                      </div>
                    </div>
                  ))}
                </div>
                  </>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'messages' && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            padding: 32,
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                💬 Viestiloki
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  type="button"
                  onClick={() => fetchMessageLogs()}
                  disabled={loadingMessageLogs}
                  variant="secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: 14,
                    background: loadingMessageLogs ? '#9ca3af' : '#3b82f6',
                    color: '#fff'
                  }}
                >
                  {loadingMessageLogs ? '🔄 Päivitetään...' : '🔄 Päivitä'}
                </Button>
              </div>
            </div>
            
            {messageLogsError && (
              <div style={{ 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                borderRadius: 8, 
                padding: 16, 
                marginBottom: 24, 
                color: '#dc2626' 
              }}>
                {messageLogsError}
              </div>
            )}
            
            {/* Viestiloki lista */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#374151' }}>
                  Viestihistoria
                </h3>
                {messageLogs.length > 0 && (
                  <div style={{ fontSize: 14, color: '#6b7280' }}>
                    Näytetään {messageLogs.length} viestiä
                  </div>
                )}
              </div>
              
              {loadingMessageLogs ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                  Ladataan viestilokia...
                </div>
              ) : messageLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                  Ei viestejä löytynyt
                </div>
              ) : (
                <div style={{ overflowX: 'auto', marginBottom: 24 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', color: '#374151' }}>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Puhelinnumero</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Tyyppi</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Suunta</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Tila</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>AI-teksti</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Asiakkaan vastaus</th>
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Päivämäärä</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messageLogs.map((log, index) => (
                        <tr
                          key={log.id || index}
                          style={{
                            background: '#fff',
                            borderBottom: '1px solid #e5e7eb',
                            transition: 'background 0.15s',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseOut={e => e.currentTarget.style.background = '#fff'}
                        >
                          <td style={{ padding: '8px', fontWeight: 500 }}>{log.phone_number || '-'}</td>
                          <td style={{ padding: '8px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 500,
                              background: log.message_type === 'sms' ? '#dbeafe' : 
                                        log.message_type === 'whatsapp' ? '#dcfce7' : 
                                        log.message_type === 'email' ? '#fef3c7' : '#f3f4f6',
                              color: log.message_type === 'sms' ? '#1d4ed8' : 
                                     log.message_type === 'whatsapp' ? '#166534' : 
                                     log.message_type === 'email' ? '#92400e' : '#6b7280'
                            }}>
                              {log.message_type === 'sms' ? '📱 SMS' : 
                               log.message_type === 'whatsapp' ? '💬 WhatsApp' : 
                               log.message_type === 'email' ? '📧 Email' : log.message_type}
                            </span>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 500,
                              background: log.direction === 'outbound' ? '#dbeafe' : '#fef3c7',
                              color: log.direction === 'outbound' ? '#1d4ed8' : '#92400e'
                            }}>
                              {log.direction === 'outbound' ? '📤 Lähetetty' : '📥 Vastaanotettu'}
                            </span>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              background: log.status === 'sent' ? '#dcfce7' : 
                                        log.status === 'delivered' ? '#dbeafe' : 
                                        log.status === 'read' ? '#fef3c7' : 
                                        log.status === 'failed' ? '#fef2f2' : '#f3f4f6',
                              color: log.status === 'sent' ? '#166534' : 
                                     log.status === 'delivered' ? '#1d4ed8' : 
                                     log.status === 'read' ? '#92400e' : 
                                     log.status === 'failed' ? '#dc2626' : '#6b7280',
                              minWidth: 60
                            }}>
                              {log.status === 'sent' ? 'Lähetetty' : 
                               log.status === 'delivered' ? 'Toimitettu' : 
                               log.status === 'read' ? 'Luettu' : 
                               log.status === 'failed' ? 'Epäonnistui' : 
                               log.status === 'pending' ? 'Odottaa' : log.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px', color: '#6b7280', fontSize: 13 }}>
                            {log.ai_text ? (log.ai_text.length > 50 ? log.ai_text.substring(0, 50) + '...' : log.ai_text) : '-'}
                          </td>
                          <td style={{ padding: '8px', color: '#6b7280', fontSize: 13 }}>
                            {log.customer_text ? (log.customer_text.length > 50 ? log.customer_text.substring(0, 50) + '...' : log.customer_text) : '-'}
                          </td>
                          <td style={{ padding: '8px' }}>
                            {log.created_at ? new Date(log.created_at).toLocaleDateString('fi-FI') + ' ' + new Date(log.created_at).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'textmessages' && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            padding: 32,
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                📱 Tekstiviestit
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  type="button"
                  onClick={() => fetchCallTypes()}
                  disabled={loadingCallTypes}
                  variant="secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: 14,
                    background: loadingCallTypes ? '#9ca3af' : '#3b82f6',
                    color: '#fff'
                  }}
                >
                  {loadingCallTypes ? '🔄 Päivitetään...' : '🔄 Päivitä'}
                </Button>
              </div>
            </div>
            
            {/* Tekstiviestit lista */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#374151' }}>
                  Ensimmäinen tekstiviesti
                </h3>
                {callTypes.length > 0 && (
                  <div style={{ fontSize: 14, color: '#6b7280' }}>
                    Näytetään {callTypes.length} puhelun tyyppiä
                  </div>
                )}
              </div>
              
              {loadingCallTypes ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                  Ladataan puhelun tyyppejä...
                </div>
              ) : callTypes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                  Ei puhelun tyyppejä löytynyt
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {callTypes.map((type, index) => (
                    <div
                      key={type.id || index}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 20,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
                            {type.label || type.name || type.callType || 'Nimeämätön tyyppi'}
                          </h4>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ 
                              padding: '4px 8px', 
                              borderRadius: 12, 
                              fontSize: 10, 
                              fontWeight: 600, 
                              background: type.status === 'Active' ? '#dcfce7' : type.status === 'Draft' ? '#fef3c7' : '#f3f4f6',
                              color: type.status === 'Active' ? '#166534' : type.status === 'Draft' ? '#92400e' : '#6b7280',
                              border: type.status === 'Active' ? '1px solid #bbf7d0' : type.status === 'Draft' ? '1px solid #fed7aa' : '1px solid #e5e7eb'
                            }}>
                              {type.status === 'Active' ? '✅ Aktiivinen' : type.status === 'Draft' ? '📝 Luonnos' : '❓ Tuntematon'}
                            </span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>
                              Tunniste: <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 4 }}>{type.value || type.callType}</code>
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setEditingCallType(type)
                            setShowEditModal(true)
                          }}
                          variant="secondary"
                          style={{
                            background: '#3b82f6',
                            color: '#fff',
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 500
                          }}
                        >
                          ✏️ Muokkaa
                        </Button>
                      </div>
                      
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14, color: '#374151' }}>
                          Viesti
                        </label>
                        <textarea
                          value={type.first_sms || ''}
                          onChange={e => {
                            const value = e.target.value
                            // Rajoita 160 merkkiin
                            if (value.length <= 160) {
                              const updatedType = { ...type, first_sms: value }
                              setEditingCallType(updatedType)
                              // Päivitä myös callTypes array
                              const updatedCallTypes = callTypes.map(t => t.id === type.id ? updatedType : t)
                              setCallTypes(updatedCallTypes)
                            }
                          }}
                          placeholder="SMS-viesti joka lähetetään asiakkaalle ennen puhelua... (max 160 merkkiä)"
                          rows={4}
                          maxLength={160}
                          style={{ 
                            width: '100%', 
                            padding: '12px', 
                            border: '1px solid #d1d5db', 
                            borderRadius: 8, 
                            fontSize: 14, 
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                        />
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginTop: 4,
                          fontSize: 12 
                        }}>
                          <span style={{ color: '#6b7280' }}>
                            {type.first_sms ? `${type.first_sms.length}/160 merkkiä` : '0/160 merkkiä'}
                          </span>
                          {type.first_sms && type.first_sms.length > 140 && (
                            <span style={{ color: '#f59e0b' }}>
                              ⚠️ Pitkä viesti ({type.first_sms.length > 150 ? '2 viestiä' : '1 viesti'})
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {type.first_sms ? (
                            <span style={{ color: '#059669' }}>
                              ✅ SMS-viesti määritelty
                            </span>
                          ) : (
                            <span style={{ color: '#dc2626' }}>
                              ❌ SMS-viestiä ei ole määritelty
                            </span>
                          )}
                        </div>
                        <Button
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('call_types')
                                .update({ first_sms: type.first_sms })
                                .eq('id', type.id)
                              
                              if (error) throw error
                              
                              setSuccessMessage('SMS-viesti tallennettu onnistuneesti!')
                              setTimeout(() => setSuccessMessage(''), 3000)
                            } catch (error) {
                              console.error('SMS-viestin tallennus epäonnistui:', error)
                              setErrorMessage('SMS-viestin tallennus epäonnistui: ' + (error.message || error))
                              setTimeout(() => setErrorMessage(''), 5000)
                            }
                          }}
                          disabled={!type.first_sms || type.first_sms.trim() === ''}
                          variant="primary"
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 500,
                            opacity: (!type.first_sms || type.first_sms.trim() === '') ? 0.5 : 1
                          }}
                        >
                          💾 Tallenna
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'mika' && (
          <MikaSpecialTab
            user={user}
            callTypes={callTypes}
            selectedVoice={selectedVoice}
            mikaSearchResults={mikaSearchResults}
            mikaSearchName={mikaSearchName}
            setMikaSearchName={setMikaSearchName}
            mikaSearchTitle={mikaSearchTitle}
            setMikaSearchTitle={setMikaSearchTitle}
            mikaSearchOrganization={mikaSearchOrganization}
            setMikaSearchOrganization={setMikaSearchOrganization}
            mikaSearchLoading={mikaSearchLoading}
            loadingMikaContacts={loadingMikaContacts}
            mikaContactsError={mikaContactsError}
            handleMikaSearch={handleMikaSearch}
            handleMikaMassCall={handleMikaMassCall}
            handleMikaSingleCall={handleMikaSingleCall}
            handleMikaMassCallAll={handleMikaMassCallAll}
            handleMikaMassCallSelected={handleMikaMassCallSelected}
          />
        )}
          </div>
      </div>
      
      {/* Yksityiskohtainen näkymä modal ja Modaalit - kaikki samassa fragmentissa */}
      <>
        {showLogDetail && selectedLog && createPortal(
            <div 
              onClick={handleModalBackgroundClick}
              className="modal-overlay modal-overlay--dark"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="modal-container"
              >
              <div className="modal-header">
                <h2 className="modal-title" style={{ fontSize: 20 }}>
                  📞 Puhelun yksityiskohdat
                </h2>
                <Button
                  onClick={() => setShowLogDetail(false)}
                  variant="secondary"
                  className="modal-close-btn"
                >
                  ✕
                </Button>
              </div>
              {loadingLogDetail ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
                  Ladataan yksityiskohtia...
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#374151' }}>
                      Perustiedot
                    </h3>
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div>
                            <strong>Nimi:</strong> {selectedLog.customer_name || 'Ei nimeä'}
                      </div>
                      <div>
                            <strong>Puhelinnumero:</strong> {selectedLog.phone_number || 'Ei numeroa'}
                          </div>
                          <div>
                            <strong>Sähköposti:</strong> {selectedLog.email || 'Ei sähköpostia'}
                          </div>
                          <div>
                            <strong>Puhelun tyyppi:</strong> {selectedLog.call_type || '-'}
                          </div>
                          <div>
                            <strong>Päivämäärä:</strong> {selectedLog.call_date ? new Date(selectedLog.call_date).toLocaleDateString('fi-FI') + ' ' + new Date(selectedLog.call_date).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </div>
                          <div>
                            <strong>Vastattu:</strong> {selectedLog.answered ? 'Kyllä' : 'Ei'}
                          </div>
                          <div>
                            <strong>Kesto:</strong> {selectedLog.duration || '-'}
                      </div>
                      <div>
                        <strong>Tila:</strong> 
                        <span style={{ 
                          marginLeft: 8,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                              background: selectedLog.call_status === 'done' && selectedLog.answered ? '#dcfce7' : 
                                        selectedLog.call_status === 'pending' ? '#f3f4f6' : 
                                        selectedLog.call_status === 'in progress' ? '#dbeafe' : '#fef2f2',
                              color: selectedLog.call_status === 'done' && selectedLog.answered ? '#166534' : 
                                     selectedLog.call_status === 'pending' ? '#6b7280' : 
                                     selectedLog.call_status === 'in progress' ? '#1d4ed8' : '#dc2626'
                        }}>
                              {selectedLog.call_status === 'done' && selectedLog.answered ? 'Onnistui' : 
                               selectedLog.call_status === 'done' && !selectedLog.answered ? 'Epäonnistui' :
                               selectedLog.call_status === 'pending' ? 'Odottaa' : 
                               selectedLog.call_status === 'in progress' ? 'Käynnissä' : 'Tuntematon'}
                        </span>
                      </div>
                          {selectedLog.campaign_id && (
                            <div>
                              <strong>Kampanja ID:</strong> {selectedLog.campaign_id}
                    </div>
                          )}
                          {selectedLog.vapi_call_id && (
                            <div>
                              <strong>VAPI Call ID:</strong> {selectedLog.vapi_call_id}
                  </div>
                          )}
                        </div>
                    </div>
                    {/* Yhteenveto */}
                    {selectedLog.summary && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#374151' }}>
                          Yhteenveto
                      </h3>
                        <div
                          style={{
                            width: '100%',
                            background: '#f8fafc',
                            padding: 16,
                            borderRadius: 8,
                            fontSize: 14,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            overflowY: 'auto',
                            maxHeight: '30vh',
                            border: '1px solid #e2e8f0',
                            boxSizing: 'border-box'
                          }}
                        >
                          {selectedLog.summary}
                        </div>
                    </div>
                    )}
                    {/* Transkripti */}
                    {selectedLog.transcript && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#374151' }}>
                          Transkripti
                      </h3>
                        <div style={{ 
                          background: '#f8fafc', 
                          padding: 16, 
                          borderRadius: 8, 
                          fontSize: 14,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          maxHeight: 300,
                          overflowY: 'auto'
                        }}>
                          {selectedLog.transcript}
                        </div>
                    </div>
                    )}
                </div>
              )}
              </div>
            </div>,
            document.body
        )}
        
        <AddCallTypeModal
          showModal={showAddModal}
          onClose={async () => {
            // Tallennetaan automaattisesti kun suljetaan
            await handleAddCallType()
            closeModals()
          }}
          newCallType={newCallType}
          setNewCallType={setNewCallType}
          onAdd={handleAddCallType}
          loading={addTypeLoading}
          error={addTypeError}
          success={addTypeSuccess}
        />
        <EditCallTypeModal
          showModal={showEditModal}
          onClose={async () => {
            // Tallennetaan automaattisesti kun suljetaan
            await handleSaveCallType()
            closeModals()
          }}
          editingCallType={editingCallType}
          setEditingCallType={setEditingCallType}
          onSave={handleSaveCallType}
        />
        
        {/* Inbound-asetukset modaali */}
        {showInboundModal && createPortal(
          <div
            style={{
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
              padding: 20
            }}
            onClick={async (e) => {
              if (e.target === e.currentTarget) {
                // Tallennetaan automaattisesti kun klikkaa ulkopuolelta
                await handleSaveInboundSettings()
                setShowInboundModal(false)
              }
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 32,
                width: '100%',
                maxWidth: 800,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                  📞 Inbound-asetukset
                </h2>
                <Button
                  variant="secondary"
                  onClick={() => setShowInboundModal(false)}
                  style={{ width: 'auto', padding: '8px 16px' }}
                >
                  ✕ Sulje
                </Button>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label className="label">Ääni</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <select value={inboundVoice} onChange={e => setInboundVoice(e.target.value)} className="select" style={{ flex: 1 }}>
                    {getVoiceOptions().map(voice => <option key={voice.value} value={voice.value}>{voice.label}</option>)}
                  </select>
                  <Button 
                    variant="secondary"
                    onClick={() => playVoiceSample(inboundVoice)}
                    style={{ width: 'auto', padding: '8px 16px' }}
                  >
                    🔊 Testaa ääntä
                  </Button>
                </div>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label className="label">Aloitusviesti</label>
                <textarea 
                  value={inboundWelcomeMessage} 
                  onChange={e => setInboundWelcomeMessage(e.target.value)} 
                  placeholder="Kirjoita aloitusviesti..." 
                  rows={5} 
                  className="textarea"
                  style={{ 
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: 14,
                    lineHeight: 1.5
                  }}
                />
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                  Ensimmäinen viesti joka lähetetään asiakkaalle kun he soittavat sinulle.
                </div>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label className="label">Inbound-skripti</label>
                <textarea 
                  value={inboundScript} 
                  onChange={e => setInboundScript(e.target.value)} 
                  placeholder="Kirjoita inbound-puhelujen skripti..." 
                  rows={15} 
                  className="textarea"
                  style={{ 
                    width: '100%',
                    minHeight: 300,
                    fontFamily: 'monospace',
                    fontSize: 14,
                    lineHeight: 1.5
                  }}
                />
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                  Tervehdys ja ohjeistus asiakkaille jotka soittavat sinulle. Käytä *odota vastaus* merkintää kun haluat että AI odottaa asiakkaan vastausta.
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  onClick={() => setShowInboundModal(false)}
                >
                  Peruuta
                </Button>
                <Button
                  onClick={async () => {
                    await handleSaveInboundSettings()
                    setShowInboundModal(false)
                  }}
                  variant="primary"
                >
                  💾 Tallenna asetukset
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
        
        {/* Massapuhelumodaali */}
        {showMassCallModal && createPortal(
          <div 
            onClick={resetMassCallModal}
            className="modal-overlay modal-overlay--dark"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="modal-container"
              style={{ maxWidth: '600px' }}
            >
              <div className="modal-header">
                <h2 className="modal-title" style={{ fontSize: 22 }}>
                  🚀 Massapuhelut
                </h2>
                <Button
                  onClick={resetMassCallModal}
                  variant="secondary"
                  className="modal-close-btn"
                >
                  ✕
                </Button>
              </div>
              
              <div className="modal-body">
                {/* Vaihe 1: Google Sheets validointi */}
                {massCallStep === 1 && (
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>
                        📊 Vaihe 1: Google Sheets -data
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                        Syötä Google Sheets URL ja validoi data ennen jatkamista.
                      </p>
                    </div>
                    
                    <label className="label">Google Sheets URL</label>
                    <input 
                      type="url" 
                      value={massCallSheetUrl} 
                      onChange={e => setMassCallSheetUrl(e.target.value)} 
                      placeholder="https://docs.google.com/spreadsheets/d/..." 
                      className="input" 
                      style={{ width: '100%', marginBottom: 16 }}
                    />
                    
                    {massCallError && (
                      <div className="status-error" style={{ marginBottom: 16 }}>
                        {massCallError}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <Button
                        onClick={resetMassCallModal}
                        variant="secondary"
                      >
                        Peruuta
                      </Button>
                      <Button
                        onClick={handleMassCallValidate}
                        disabled={massCallValidating || !massCallSheetUrl}
                        variant="primary"
                      >
                        {massCallValidating ? 'Validoidaan...' : 'Validoi ja jatka'}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Vaihe 2: Puhelun tyyppi ja ääni */}
                {massCallStep === 2 && (
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>
                        ⚙️ Vaihe 2: Puhelun asetukset
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                        Valitse puhelun tyyppi ja ääni.
                      </p>

                      <div style={{ display: 'grid', gap: 16, marginTop: 8 }}>
                        <div>
                          <label className="label">Puhelun tyyppi</label>
                          <select 
                            value={massCallCallType} 
                            onChange={e => setMassCallCallType(e.target.value)} 
                            className="select"
                          >
                            {callTypes.map(type => (
                              <option key={type.id} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="label">Ääni</label>
                          <select 
                            value={massCallSelectedVoice} 
                            onChange={e => setMassCallSelectedVoice(e.target.value)} 
                            className="select"
                          >
                            {getVoiceOptions().map(voice => (
                              <option key={voice.value} value={voice.value}>{voice.label}</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <label style={{ fontWeight: 600 }}>Tekstari ensin</label>
                          <label className="switch">
                            <input type="checkbox" checked={massCallSmsFirst} onChange={e => setMassCallSmsFirst(e.target.checked)} />
                            <span className="slider round"></span>
                          </label>
                        </div>

                        {massCallSmsFirst && (
                          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Ensimmäinen SMS (vain luku)</div>
                            <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, color: '#374151' }}>
                              {(() => {
                                const t = callTypes.find(t => t.value === massCallCallType)
                                return t?.first_sms ? t.first_sms : 'Ei määritelty tälle puhelun tyypille'
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {massCallValidationResult && (
                        <div className="status-success" style={{ marginTop: 8, marginBottom: 16 }}>
                          <div style={{ fontWeight: 600 }}>✅ Validointi onnistui!</div>
                          <div>📈 <strong>Löydetty {massCallValidationResult.phoneCount} puhelinnumeroa</strong></div>
                          {massCallValidationResult.emailCount > 0 && (
                            <div>📧 <strong>Löydetty {massCallValidationResult.emailCount} sähköpostia</strong></div>
                          )}
                          {massCallValidationResult.totalRows > 0 && <div>📋 Yhteensä {massCallValidationResult.totalRows} riviä</div>}
                        </div>
                      )}
                    </div>
                    
                    
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                      <Button
                        onClick={() => setMassCallStep(1)}
                        variant="secondary"
                      >
                        ← Takaisin
                      </Button>
                      <Button
                        onClick={() => setMassCallStep(3)}
                        disabled={!massCallCallType || !massCallSelectedVoice}
                        variant="primary"
                      >
                        Jatka →
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Vaihe 3: Ajastus tai aloitus */}
                {massCallStep === 3 && (
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>
                        🎯 Vaihe 3: Aloita tai ajasta puhelut
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                        Valitse haluatko aloittaa puhelut heti vai ajastaa ne myöhemmäksi.
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                      <Button
                        onClick={handleMassCallStart}
                        disabled={massCallStarting}
                        variant="primary"
                        style={{ flex: 1, padding: '16px 24px', fontSize: 16, fontWeight: 600 }}
                      >
                        {massCallStarting ? 'Käynnistetään...' : '🚀 Aloita heti'}
                      </Button>
                    </div>
                    
                    <div style={{ 
                      borderTop: '1px solid #e5e7eb', 
                      paddingTop: 20, 
                      marginTop: 20 
                    }}>
                      <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
                        📅 Tai ajasta puhelut
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                        <div>
                          <label className="label">Päivämäärä</label>
                          <input 
                            type="date" 
                            value={massCallScheduledDate} 
                            onChange={e => setMassCallScheduledDate(e.target.value)}
                            className="input"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <label className="label">Kellonaika</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <select
                              className="select"
                              value={(massCallScheduledTime || '').split(':')[0] || ''}
                              onChange={e => {
                                const hour = String(e.target.value || '').padStart(2, '0')
                                const minute = (massCallScheduledTime || '').split(':')[1] || '00'
                                const mm = parseInt(minute, 10) >= 30 ? '30' : '00'
                                setMassCallScheduledTime(hour ? `${hour}:${mm}` : '')
                              }}
                              style={{ flex: 1 }}
                            >
                              <option value="">--</option>
                              {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(hh => (
                                <option key={hh} value={hh}>{hh}</option>
                              ))}
                            </select>
                            <select
                              className="select"
                              value={(massCallScheduledTime || '').split(':')[1] || ''}
                              onChange={e => {
                                const minute = e.target.value === '30' ? '30' : '00'
                                const hour = (massCallScheduledTime || '').split(':')[0] || ''
                                setMassCallScheduledTime(hour ? `${String(hour).padStart(2, '0')}:${minute}` : '')
                              }}
                              style={{ width: 100 }}
                            >
                              <option value="">--</option>
                              <option value="00">00</option>
                              <option value="30">30</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleMassCallSchedule}
                        disabled={massCallScheduling || !massCallScheduledDate || !massCallScheduledTime}
                        variant="secondary"
                        style={{ width: '100%', padding: '12px 24px' }}
                      >
                        {massCallScheduling ? 'Ajastetaan...' : '📅 Ajasta puhelut'}
                      </Button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', marginTop: 20 }}>
                      <Button
                        onClick={() => setMassCallStep(2)}
                        variant="secondary"
                      >
                        ← Takaisin
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Yksittäisen puhelun modaali */}
        {showSingleCallModal && createPortal(
          <div 
            onClick={() => { setShowSingleCallModal(false); setSingleCallStep(1) }}
            className="modal-overlay modal-overlay--dark"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="modal-container"
              style={{ maxWidth: '560px' }}
            >
              <div className="modal-header">
                <h2 className="modal-title" style={{ fontSize: 22 }}>
                  📞 Yksittäinen puhelu
                </h2>
                <Button
                  onClick={() => { setShowSingleCallModal(false); setSingleCallStep(1) }}
                  variant="secondary"
                  className="modal-close-btn"
                >
                  ✕
                </Button>
              </div>

              <div className="modal-body">
                {singleCallStep === 1 && (
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>⚙️ Vaihe 1: Puhelun asetukset</h3>
                    <label className="label">Puhelun tyyppi</label>
                    <select 
                      value={callType} 
                      onChange={e => { setCallType(e.target.value); updateScriptFromCallType(e.target.value) }} 
                      className="select"
                      style={{ width: '100%', marginBottom: 16 }}
                    >
                      <option value="">Valitse puhelun tyyppi...</option>
                      {callTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>

                    <label className="label">Ääni</label>
                    <select 
                      value={selectedVoice} 
                      onChange={e => setSelectedVoice(e.target.value)}
                      className="select"
                      style={{ width: '100%', marginBottom: 16 }}
                    >
                      {getVoiceOptions().map(voice => (
                        <option key={voice.value} value={voice.value}>{voice.label}</option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                      <Button onClick={() => { setShowSingleCallModal(false); setSingleCallStep(1) }} variant="secondary">Peruuta</Button>
                      <Button onClick={() => setSingleCallStep(2)} disabled={!callType || !selectedVoice} variant="primary">Jatka →</Button>
                    </div>
                  </div>
                )}

                {singleCallStep === 2 && (
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>👤 Vaihe 2: Asiakkaan tiedot</h3>
                    <label className="label">Nimi</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Matti Meikäläinen" className="input" />
                    <label className="label">Puhelinnumero</label>
                    <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="040 123 4567 tai +358401234567" className="input" />

                    <div style={{ color: '#6b7280', fontSize: 13, margin: '6px 0 12px' }}>
                      Skripti: {script ? <span style={{ color: '#111827' }}>{script.slice(0, 140)}{script.length > 140 ? '…' : ''}</span> : 'Valitse puhelun tyyppi niin skripti tulee näkyviin.'}
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                      <Button onClick={() => setSingleCallStep(1)} variant="secondary">← Takaisin</Button>
                      <Button onClick={handleSingleCall} disabled={calling || !name.trim() || !phoneNumber.trim() || !callType || !script.trim() || !selectedVoice} variant="primary">
                        {calling ? '📞 Soittaa…' : '📞 Soita'}
                      </Button>
                    </div>

                    {singleCallError && (
                      <div className="status-error" style={{ marginTop: 8 }}>{singleCallError}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    </div>
    </>
  )
}