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
  const [loadingCallLogs, setLoadingCallLogs] = useState(false)
  const [callLogsError, setCallLogsError] = useState('')
  
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
        
        if (!nameColumn || !phoneColumn) {
          throw new Error('Vaadittuja sarakkeita ei löytynyt. Tarvitaan sekä nimisarakke että puhelinnumerosarakke.')
        }

        for (const row of validationResult.rows) {
          // Hae arvot sarakkeiden otsikoiden perusteella
          const phoneNumber = normalizePhoneNumber(row[phoneColumn])
          const name = row[nameColumn] ? row[nameColumn].trim() : null

          // Lisää vain jos on sekä selkeä nimi että puhelinnumero
          if (name && phoneNumber && name.trim() !== '' && phoneNumber.trim() !== '' && phoneNumber.startsWith('+358')) {
            // Hae valitun äänen id
            const selectedVoiceObj = getVoiceOptions().find(v => v.value === selectedVoice)
            const voiceId = selectedVoiceObj?.id
            
            callLogs.push({
              user_id: publicUserId,
              customer_name: name.trim().substring(0, 100), // Rajaa 100 merkkiin (tietokannan rajoitus)
              phone_number: phoneNumber.trim().substring(0, 20), // Rajaa 20 merkkiin
              call_type: callType.substring(0, 50), // Rajaa 50 merkkiin
              call_type_id: call_type_id,
              voice_id: voiceId, // Lisätty voice_id
              call_date: new Date().toISOString(),
              call_status: 'pending',
              campaign_id: `mass-call-${Date.now()}`.substring(0, 100), // Rajaa 100 merkkiin
              summary: `Mass-call: ${script.trim().substring(0, 100)}...`
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
          success_assessment: editingCallType.success_assessment || ''
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

  const handleDeleteCallType = async (recordId) => {
    if (!confirm('Haluatko varmasti poistaa tämän puhelun tyypin?')) {
      return
    }

    try {
      const { error } = await supabase.from('call_types').delete().eq('id', recordId)
      if (!error) {
        alert('Puhelun tyyppi poistettu!')
        fetchCallTypes()
      } else {
        throw new Error('Poisto epäonnistui')
      }
    } catch (error) {
      console.error('Puhelun tyypin poisto epäonnistui:', error)
      alert('Puhelun tyypin poisto epäonnistui')
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
        success_assessment: newCallType.success_assessment || ''
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
    setNewCallType({ callType: '', label: '', description: '', identity: '', style: '', guidelines: '', goals: '', intro: '', questions: '', outro: '', notes: '', version: '', status: 'Active', summary: '', success_assessment: '' })
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

      // Hae kaikki call_logs käyttäjälle
      const { data: logs, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('call_date', { ascending: false })

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
          `"${log.call_date ? new Date(log.call_date).toLocaleDateString('fi-FI') + ' ' + new Date(log.call_date).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }) : ''}"`,
          log.answered ? 'Kyllä' : 'Ei',
          `"${log.duration || ''}"`,
          log.call_status === 'done' && log.answered ? 'Onnistui' : 
          log.call_status === 'done' && !log.answered ? 'Epäonnistui' :
          log.call_status === 'pending' ? 'Odottaa' : 
          log.call_status === 'in progress' ? 'Käynnissä' : 'Tuntematon',
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

  // Hae kontakteja kun Mika Special -välilehti avataan
  useEffect(() => {
    if (activeTab === 'mika' && mikaContacts.length === 0) {
      fetchMikaContacts()
    }
  }, [activeTab])

  return (
    <>
      <PageMeta 
        title="Puhelut - Rascal AI"
        description="Automatisoi puhelut ja seuraa puhelulokeja Rascal AI:ssä. Älykäs puhelinmarkkinointi ja asiakaspalvelu."
        image="/hero.png"
      />
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
    <div className="callpanel-wrapper" style={{ width: '100%', maxWidth: 'none' }}>
      <div className="callpanel-root" style={{ width: '100%', maxWidth: 'none' }}>
        {/* Tabs */}
        <div className="callpanel-tabs">
          <Button 
            onClick={() => setActiveTab('calls')} 
            variant={activeTab === 'calls' ? 'primary' : 'secondary'}
          >
            📞 Puhelut
          </Button>
          <Button 
            onClick={() => setActiveTab('logs')} 
            variant={activeTab === 'logs' ? 'primary' : 'secondary'}
          >
            📊 Lokit
          </Button>
          <Button 
            onClick={() => setActiveTab('manage')} 
            variant={activeTab === 'manage' ? 'primary' : 'secondary'}
          >
            ⚙️ Hallinta
          </Button>
          {isMika && (
            <Button 
              onClick={() => setActiveTab('mika')} 
              variant={activeTab === 'mika' ? 'primary' : 'secondary'}
            >
              🎯 Mika Special
            </Button>
          )}
        </div>
        
        {/* Sisältö */}
        {activeTab === 'calls' && (
          <div className="callpanel-grid" style={{ width: '100%', maxWidth: 'none' }}>
            {/* Aloita puhelut -kortti - näkyy kaikille */}
            {(
              <div className="card">
              <h2 className="section-title">Aloita massapuhelut</h2>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="label">Google Sheets URL</label>
                  <Button
                    variant="secondary"
                    onClick={() => setActiveTab('manage')}
                    style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
                  >
                    ➕ Lisää puhelun tyyppi
                  </Button>
                </div>
                <input type="url" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className="input" />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Button
                  onClick={handleValidate}
                  disabled={validating || !sheetUrl}
                  variant="secondary"
                  style={{ flex: 1 }}
                >
                  {validating ? 'Validoidaan...' : 'Validoi'}
                </Button>
                <Button
                  onClick={handleStartCalls}
                  disabled={starting || !validationResult || !callType || !script.trim() || !selectedVoice}
                  variant="primary"
                  style={{ flex: 1 }}
                >
                  {starting ? 'Käynnistetään...' : 'Aloita soitot'}
                </Button>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>
                Käyttää Toiminnot-moduulin asetuksia (tyyppi, ääni, skripti)
              </div>
              {error && <div className="status-error">{error}</div>}
              {validationResult && (
                <div className="status-success">
                  <div style={{ fontWeight: 600 }}>✅ Validointi onnistui!</div>
                  <div>📈 <strong>Löydetty {validationResult.phoneCount} puhelinnumeroa</strong></div>
                  {validationResult.emailCount > 0 && (
                    <div>📧 <strong>Löydetty {validationResult.emailCount} sähköpostia</strong></div>
                  )}
                  {validationResult.totalRows > 0 && <div>📋 Yhteensä {validationResult.totalRows} riviä</div>}
                  {validationResult.phoneColumns && validationResult.phoneColumns.length > 0 && <div>📞 Puhelinnumerosarakkeet: {validationResult.phoneColumns.join(', ')}</div>}
                  {validationResult.emailColumns && validationResult.emailColumns.length > 0 && <div>📧 Sähköpostisarakkeet: {validationResult.emailColumns.join(', ')}</div>}
                  {validationResult.columns && validationResult.columns.length > 0 && <div>📝 Kaikki sarakkeet: {validationResult.columns.join(', ')}</div>}
                </div>
              )}
            </div>
            )}
            
            {/* Mika Special - Aloita puhelut -kortti */}
            {isMika && (
              <div className="card" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none'
              }}>
                <h2 className="section-title" style={{ color: 'white' }}>🚀 Mika Special - Puhelut</h2>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: 14, opacity: 0.9 }}>
                    Tervetuloa eksklusiiviseen puhelinmarkkinointi-ominaisuuteen! Sinulla on pääsy edistyneisiin toimintoihin.
                  </p>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    padding: 16, 
                    borderRadius: 8,
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>VIP Status:</span>
                      <strong>🎯 Aktiivinen</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Puhelut tänään:</span>
                      <strong>0/50</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Seuraava päivitys:</span>
                      <strong>24h</strong>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="secondary"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      flex: 1
                    }}
                  >
                    🔓 Aktivoi ominaisuudet
                  </Button>
                  <Button
                    variant="secondary"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      flex: 1
                    }}
                  >
                    📊 Näytä raportti
                  </Button>
                </div>
              </div>
            )}
            
            {/* Tee puhelu -kortti */}
            <div className="card">
              <h2 className="section-title">Soita yksittäinen puhelu</h2>
              <label className="label">Nimi</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Matti Meikäläinen" className="input" />
              <label className="label">Puhelinnumero</label>
              <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+358 40 123 4567" className="input" />
              <Button
                onClick={handleSingleCall}
                disabled={calling || !name.trim() || !phoneNumber.trim() || !callType || !script.trim() || !selectedVoice}
                variant="primary"
              >
                {calling ? '📞 Soittaa...' : '📞 Soita'}
              </Button>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                Käyttää Toiminnot-moduulin asetuksia (tyyppi, ääni, skripti)
              </div>
              {singleCallError && (
                <div className="status-error">
                  {singleCallError}
                </div>
              )}
            </div>
            {/* Toiminnot -kortti */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Toiminnot</h2>
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
                    Näytetään {((currentPage - 1) * 25) + 1}-{Math.min(currentPage * 25, totalCount)} / {totalCount} puhelua
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
                        <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>Kesto</th>
                        <th style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>Tila</th>
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
                                {log.call_date ? new Date(log.call_date).toLocaleDateString('fi-FI') + ' ' + new Date(log.call_date).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                              <td style={{ padding: '8px' }}>{log.answered ? 'Kyllä' : 'Ei'}</td>
                              <td style={{ padding: '8px' }}>{log.duration || '-'}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                                  background: log.call_status === 'done' && log.answered ? '#dcfce7' : 
                                            log.call_status === 'pending' ? '#f3f4f6' : 
                                            log.call_status === 'in progress' ? '#dbeafe' : '#fef2f2',
                                  color: log.call_status === 'done' && log.answered ? '#166534' : 
                                         log.call_status === 'pending' ? '#6b7280' : 
                                         log.call_status === 'in progress' ? '#1d4ed8' : '#dc2626',
                              minWidth: 60
                            }}>
                                  {log.call_status === 'done' && log.answered ? 'Onnistui' : 
                                   log.call_status === 'done' && !log.answered ? 'Epäonnistui' :
                                   log.call_status === 'pending' ? 'Odottaa' : 
                                   log.call_status === 'in progress' ? 'Käynnissä' : 'Tuntematon'}
                            </span>
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
                            padding: '2px 8px', 
                            borderRadius: 4, 
                            fontSize: 10, 
                            fontWeight: 500, 
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
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCallType(type.id)
                              }}
                              variant="secondary"
                              style={{
                                background: '#ef4444',
                                color: '#fff',
                                padding: '4px 8px',
                                fontSize: 12,
                                fontWeight: 500
                              }}
                              title="Poista puhelun tyyppi"
                            >
                              🗑️
                            </Button>
                      <div style={{ color: '#6b7280', fontSize: 14 }}>
                        ✏️
                            </div>
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
                        <div style={{ 
                          background: '#f8fafc', 
                          padding: 16, 
                          borderRadius: 8, 
                          fontSize: 14,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap'
                        }}>
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
            onClick={(e) => {
              if (e.target === e.currentTarget) {
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
        

      </>
    </div>
    </>
  )
}