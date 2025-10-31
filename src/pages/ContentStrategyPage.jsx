import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import './ContentStrategyPage.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useStrategyStatus } from '../contexts/StrategyStatusContext'
import Button from '../components/Button'
import '../components/ModalComponents.css'

const STRATEGY_URL = import.meta.env.N8N_GET_STRATEGY_URL || 'https://samikiias.app.n8n.cloud/webhook/strategy-89777321'

const getStrategy = async () => {
  try {
    // Haetaan käyttäjän company_id ja user_id Supabase:sta
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('Käyttäjä ei ole kirjautunut')
    }

    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('company_id, id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (userError || !userRecord?.company_id) {
      throw new Error('Company ID ei löytynyt')
    }

    const companyId = userRecord.company_id
    const userId = userRecord.id

    // Kutsu API endpointia company_id:llä ja user_id:llä
    const url = `/api/strategy?companyId=${companyId}&userId=${userId}`
    
    // Hae käyttäjän token
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession?.access_token) {
      throw new Error('Käyttäjä ei ole kirjautunut')
    }
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${currentSession.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    if (!res.ok) throw new Error('Strategian haku epäonnistui')
    const data = await res.json()
    return data
  } catch (error) {
    console.error('Error in getStrategy:', error)
    throw error
  }
}

export default function ContentStrategyPage() {
  const { t, i18n } = useTranslation('common')
  const { user } = useAuth()
  const { refreshUserStatus } = useStrategyStatus()
  const [strategy, setStrategy] = useState([])
  
  // Debug: log strategy changes
  useEffect(() => {
    console.log('Strategy state updated:', strategy)
  }, [strategy])
  const [icpSummary, setIcpSummary] = useState([])
  const [kpiData, setKpiData] = useState([])
  const [companySummary, setCompanySummary] = useState('')
  const [tov, setTov] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [generatedCount, setGeneratedCount] = useState(0)
  const [generatedCountLoading, setGeneratedCountLoading] = useState(false)
  const [editingIcp, setEditingIcp] = useState(false)
  const [icpEditText, setIcpEditText] = useState('')
  const [editingKpi, setEditingKpi] = useState(false)
  const [kpiEditText, setKpiEditText] = useState('')
  const [editingCompanySummary, setEditingCompanySummary] = useState(false)
  const [companySummaryEditText, setCompanySummaryEditText] = useState('')
  const [editingTov, setEditingTov] = useState(false)
  const [tovEditText, setTovEditText] = useState('')
  const [toast, setToast] = useState({ visible: false, message: '' })

  const [companyId, setCompanyId] = useState(null)
  const textareaRef = React.useRef(null)
  const icpTextareaRef = React.useRef(null)
  const kpiTextareaRef = React.useRef(null)
  const companySummaryTextareaRef = React.useRef(null)
  const tovTextareaRef = React.useRef(null)

  const fetchGeneratedCount = async (strategyId) => {
    try {
      setGeneratedCountLoading(true)

      // Hae käyttäjän public users.id auth_user_id:n perusteella
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data: userRecord, error: userErr } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single()
      if (userErr || !userRecord?.id) return

      // Laske generoidut sisällöt tälle strategialle
      const { count, error: cntErr } = await supabase
        .from('content')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userRecord.id)
        .eq('strategy_id', strategyId)
        .eq('is_generated', true)

      if (cntErr) {
        console.error('Error fetching generated count:', cntErr)
        setGeneratedCount(0)
      } else {
        setGeneratedCount(count || 0)
      }
    } catch (err) {
      console.error('fetchGeneratedCount error:', err)
      setGeneratedCount(0)
    } finally {
      setGeneratedCountLoading(false)
    }
  }


  useEffect(() => {
    const fetchStrategy = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Haetaan company_id ensin
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('company_id')
            .eq('auth_user_id', session.user.id)
            .single()
          
          if (userRecord?.company_id) {
            setCompanyId(userRecord.company_id)
          }
        }
        
        const data = await getStrategy()
        
        // Käsittele data-rakenne
        if (data && typeof data === 'object') {
          // Data tulee objektina: {strategies: [...], icpSummary: [...], kpi: [...], companySummary: ..., tov: ...}
          console.log('Strategy data (object):', data.strategies)
          setStrategy(data.strategies || [])
          setIcpSummary(data.icpSummary || [])
          setKpiData(data.kpi || [])
          setCompanySummary(data.summary || data.companySummary || '')
          setTov(data.tov || '')
        } else if (Array.isArray(data) && data.length > 0) {
          // Vanha rakenne (array)
          console.log('Strategy data (array):', data)
          const firstItem = data[0]
          setStrategy(firstItem.strategyAndMonth || [])
          setIcpSummary(firstItem.icpSummary || [])
          setKpiData(firstItem.kpi || [])
          setCompanySummary(firstItem.summary || firstItem.companySummary || '')
          setTov(firstItem.tov || '')
        } else {
          console.log('No strategy data available')
          setStrategy([])
          setIcpSummary([])
          setKpiData([])
          setCompanySummary('')
          setTov('')
        }
      } catch (e) {
        console.error('Error fetching strategy:', e)
        setStrategy([])
        setIcpSummary([])
        setKpiData([])
        setCompanySummary('')
        setTov('')
        setError('Strategian hakeminen epäonnistui. Tarkista verkkoyhteys ja yritä uudelleen.')
      } finally {
        setLoading(false)
      }
    }
    fetchStrategy()
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [editText, editId])

  useEffect(() => {
    if (icpTextareaRef.current) {
      icpTextareaRef.current.style.height = 'auto'
      icpTextareaRef.current.style.height = icpTextareaRef.current.scrollHeight + 'px'
    }
  }, [icpEditText, editingIcp])

  useEffect(() => {
    if (kpiTextareaRef.current) {
      kpiTextareaRef.current.style.height = 'auto'
      kpiTextareaRef.current.style.height = kpiTextareaRef.current.scrollHeight + 'px'
    }
  }, [kpiEditText, editingKpi])

  useEffect(() => {
    if (companySummaryTextareaRef.current) {
      companySummaryTextareaRef.current.style.height = 'auto'
      companySummaryTextareaRef.current.style.height = companySummaryTextareaRef.current.scrollHeight + 'px'
    }
  }, [companySummaryEditText, editingCompanySummary])

  useEffect(() => {
    if (tovTextareaRef.current) {
      tovTextareaRef.current.style.height = 'auto'
      tovTextareaRef.current.style.height = tovTextareaRef.current.scrollHeight + 'px'
    }
  }, [tovEditText, editingTov])

  // ESC-näppäimen tuki modaalin sulkemiseen
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && editId) {
        handleCancel()
      }
    }

    if (editId) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editId])

  const handleEdit = (item) => {
    setEditId(item.id)
    setEditText(item.strategy || item.Strategy)
    fetchGeneratedCount(item.id)
    // Säätää textarea:n korkeus seuraavassa renderissä
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
      }
    }, 0)
  }

  const handleSave = async (item) => {
    try {
      // Päivitä strategia Supabasessa
      const { data: updatedStrategy, error } = await supabase
        .from('content_strategy')
        .update({ 
          strategy: editText,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating strategy:', error)
        alert('Tallennus epäonnistui: ' + error.message)
        return
      }

      // Päivitä paikallinen state
      const updated = { 
        ...item, 
        strategy: editText, 
        Strategy: editText, // Säilytetään myös vanha kenttä yhteensopivuuden vuoksi
        updated_at: updatedStrategy.updated_at
      }
      setStrategy(strategy.map(s => s.id === item.id ? updated : s))
      setEditId(null)
    } catch (e) {
      console.error('Error in handleSave:', e)
      alert('Tallennus epäonnistui')
    }
  }

  const handleSaveAndApprove = async (item) => {
    try {
      // Päivitä strategia ja hyväksy se Supabasessa
      const { data: updatedStrategy, error } = await supabase
        .from('content_strategy')
        .update({ 
          strategy: editText,
          approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating and approving strategy:', error)
        alert('Tallennus ja hyväksyntä epäonnistui: ' + error.message)
        return
      }

      // Lähetä hyväksyntä API:n kautta
      console.log('🚀 Lähetetään strategian vahvistus API:n kautta...')
      
      // Hae access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Käyttäjä ei ole kirjautunut')
      }

      const response = await axios.post('/api/strategy-approve', {
        strategy_id: item.id,
        month: item.month,
        company_id: companyId,
        user_id: user?.id
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-api-key': import.meta.env.N8N_SECRET_KEY || 'fallback-key',
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Strategy approval sent successfully:', response.data)

      // Päivitä myös käyttäjän status "Approved":ksi
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          status: 'Approved',
          strategy_approved_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id)

      if (userError) {
        console.error('Error updating user status:', userError)
        // Ei keskeytetä prosessia tämän takia
      }

      // Päivitä paikallinen state
      const updated = { 
        ...item, 
        strategy: editText, 
        Strategy: editText, // Säilytetään myös vanha kenttä yhteensopivuuden vuoksi
        approved: true,
        updated_at: updatedStrategy.updated_at
      }
      setStrategy(strategy.map(s => s.id === item.id ? updated : s))
      setEditId(null)

      // Päivitä käyttäjän status kontekstissa
      refreshUserStatus()

      // Näytä toast-notifikaatio
      setToast({ visible: true, message: 'Strategia tallennettu ja hyväksytty onnistuneesti!' })
      setTimeout(() => setToast({ visible: false, message: '' }), 3000)

    } catch (e) {
      console.error('Error in handleSaveAndApprove:', e)
      alert('Tallennus ja hyväksyntä epäonnistui: ' + e.message)
    }
  }

  const handleApproveStrategy = async (item) => {
    console.log('🎯 handleApproveStrategy kutsuttu strategialle:', item)
    try {
      // Lähetä ensin axios-kutsu API endpointin kautta
      console.log('🚀 Lähetetään strategian vahvistus API:n kautta...')
      console.log('Data:', {
        strategy_id: item.id,
        month: item.month,
        company_id: companyId,
        user_id: user?.id
      })

      // Hae access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Käyttäjä ei ole kirjautunut')
      }

      const response = await axios.post('/api/strategy-approve', {
        strategy_id: item.id,
        month: item.month,
        company_id: companyId,
        user_id: user?.id
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-api-key': import.meta.env.N8N_SECRET_KEY || 'fallback-key',
          'Content-Type': 'application/json'
        }
      })
      
      console.log('✅ Strategy approval sent successfully:', response.data)

      // Sitten päivitä strategia approved: true Supabasessa
      const { data: updatedStrategy, error } = await supabase
        .from('content_strategy')
        .update({ 
          approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .select()
        .single()

      if (error) {
        console.error('Error approving strategy:', error)
        alert('Vahvistus epäonnistui: ' + error.message)
        return
      }

      // Päivitä myös käyttäjän status "Approved":ksi
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          status: 'Approved',
          strategy_approved_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id)

      if (userError) {
        console.error('Error updating user status:', userError)
        // Ei keskeytetä prosessia tämän takia
      }

      // Päivitä paikallinen state
      const updated = { 
        ...item, 
        approved: true,
        updated_at: updatedStrategy.updated_at
      }
      setStrategy(strategy.map(s => s.id === item.id ? updated : s))

      // Päivitä käyttäjän status kontekstissa
      refreshUserStatus()

      // Näytä toast-notifikaatio
      setToast({ visible: true, message: 'Strategia hyväksytty onnistuneesti!' })
      setTimeout(() => setToast({ visible: false, message: '' }), 3000)

    } catch (e) {
      console.error('Error in handleApproveStrategy:', e)
      alert('Vahvistus epäonnistui: ' + e.message)
    }
  }

  const handleCancel = () => {
    setEditId(null)
    setEditText('')
  }

  const handleEditIcp = () => {
    setEditingIcp(true)
    setIcpEditText(icpSummary.join('\n'))
    // Säätää textarea:n korkeus seuraavassa renderissä
    setTimeout(() => {
      if (icpTextareaRef.current) {
        icpTextareaRef.current.style.height = 'auto'
        icpTextareaRef.current.style.height = icpTextareaRef.current.scrollHeight + 'px'
      }
    }, 0)
  }

  const handleSaveIcp = async () => {
    try {
      const newIcpSummary = icpEditText.split('\n').filter(line => line.trim() !== '')
      
      // Haetaan käyttäjän user_id
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        alert('Käyttäjä ei ole kirjautunut')
        return
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!userRecord?.id) {
        alert('Käyttäjätiedot eivät löytyneet')
        return
      }
      
      // Päivitä ICP Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          icp_summary: newIcpSummary.join('\n'),
          updated_at: new Date().toISOString()
        })
        .eq('id', userRecord.id)

      if (error) {
        console.error('Error updating ICP:', error)
        alert('ICP:n tallennus epäonnistui: ' + error.message)
        return
      }
      
      setIcpSummary(newIcpSummary)
      setEditingIcp(false)
      setIcpEditText('')
    } catch (e) {
      console.error('Error in handleSaveIcp:', e)
      alert('ICP:n tallennus epäonnistui')
    }
  }

  const handleCancelIcp = () => {
    setEditingIcp(false)
    setIcpEditText('')
  }

  const handleSaveKpi = async () => {
    try {
      const newKpiData = kpiEditText.split('\n').filter(line => line.trim() !== '')
      
      // Haetaan käyttäjän user_id
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        alert('Käyttäjä ei ole kirjautunut')
        return
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!userRecord?.id) {
        alert('Käyttäjätiedot eivät löytyneet')
        return
      }
      
      // Päivitä KPI Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          kpi: newKpiData.join('\n'),
          updated_at: new Date().toISOString()
        })
        .eq('id', userRecord.id)

      if (error) {
        console.error('Error updating KPI:', error)
        alert('KPI:n tallennus epäonnistui: ' + error.message)
        return
      }
      
      setKpiData(newKpiData)
      setEditingKpi(false)
      setKpiEditText('')
    } catch (e) {
      console.error('Error in handleSaveKpi:', e)
      alert('KPI:n tallennus epäonnistui')
    }
  }

  const handleCancelKpi = () => {
    setEditingKpi(false)
    setKpiEditText('')
  }

  const handleEditCompanySummary = () => {
    setEditingCompanySummary(true)
    setCompanySummaryEditText(companySummary)
    // Säätää textarea:n korkeus seuraavassa renderissä
    setTimeout(() => {
      if (companySummaryTextareaRef.current) {
        companySummaryTextareaRef.current.style.height = 'auto'
        companySummaryTextareaRef.current.style.height = companySummaryTextareaRef.current.scrollHeight + 'px'
      }
    }, 0)
  }

  const handleSaveCompanySummary = async () => {
    try {
      // Haetaan käyttäjän user_id
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        alert('Käyttäjä ei ole kirjautunut')
        return
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!userRecord?.id) {
        alert('Käyttäjätiedot eivät löytyneet')
        return
      }
      
      // Päivitä Company Summary Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          company_summary: companySummaryEditText,
          updated_at: new Date().toISOString()
        })
        .eq('id', userRecord.id)

      if (error) {
        console.error('Error updating company summary:', error)
        alert('Yritysanalyysin tallennus epäonnistui: ' + error.message)
        return
      }
      
      setCompanySummary(companySummaryEditText)
      setEditingCompanySummary(false)
      setCompanySummaryEditText('')
    } catch (e) {
      console.error('Error in handleSaveCompanySummary:', e)
      alert('Yritysanalyysin tallennus epäonnistui')
    }
  }

  const handleCancelCompanySummary = () => {
    setEditingCompanySummary(false)
    setCompanySummaryEditText('')
  }

  const handleEditTov = () => {
    setEditingTov(true)
    setTovEditText(tov)
    // Säätää textarea:n korkeus seuraavassa renderissä
    setTimeout(() => {
      if (tovTextareaRef.current) {
        tovTextareaRef.current.style.height = 'auto'
        tovTextareaRef.current.style.height = tovTextareaRef.current.scrollHeight + 'px'
      }
    }, 0)
  }

  const handleSaveTov = async () => {
    try {
      // Haetaan käyttäjän user_id
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        alert('Käyttäjä ei ole kirjautunut')
        return
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!userRecord?.id) {
        alert('Käyttäjätiedot eivät löytyneet')
        return
      }
      
      // Päivitä TOV Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          tov: tovEditText,
          updated_at: new Date().toISOString()
        })
        .eq('id', userRecord.id)

      if (error) {
        console.error('Error updating TOV:', error)
        alert('TOV:n tallennus epäonnistui: ' + error.message)
        return
      }
      
      setTov(tovEditText)
      setEditingTov(false)
      setTovEditText('')
    } catch (e) {
      console.error('Error in handleSaveTov:', e)
      alert('TOV:n tallennus epäonnistui')
    }
  }

  const handleCancelTov = () => {
    setEditingTov(false)
    setTovEditText('')
  }

  // Funktio kuukauden käännökselle ja kirjoittamiseen isolla alkukirjaimella
  const translateMonth = (month) => {
    if (!month) return ''
    
    const monthTranslations = {
      'january': 'tammikuu',
      'february': 'helmikuu', 
      'march': 'maaliskuu',
      'april': 'huhtikuu',
      'may': 'toukokuu',
      'june': 'kesäkuu',
      'july': 'heinäkuu',
      'august': 'elokuu',
      'september': 'syyskuu',
      'october': 'lokakuu',
      'november': 'marraskuu',
      'december': 'joulukuu'
    }
    
    const lowerMonth = month.toLowerCase()
    const translatedMonth = monthTranslations[lowerMonth] || month
    
    return translatedMonth
  }

  const formatMonth = (month) => {
    if (!month) return ''
    
    // Käännä kuukausi jos kieli on suomi
    const translatedMonth = i18n.language === 'fi' ? translateMonth(month) : month
    
    return translatedMonth.charAt(0).toUpperCase() + translatedMonth.slice(1).toLowerCase()
  }

  const getStrategyStatus = (month) => {
    if (!month) return 'old'
    
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() // 0-11
    const currentYear = currentDate.getFullYear()
    
    // Käännä kuukausi suomeksi vertailua varten
    const translatedMonth = translateMonth(month)
    
    // Kuukausien nimet suomeksi
    const monthNames = [
      'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
      'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'
    ]
    
    // Etsi kuukauden indeksi käännetyllä nimellä
    const monthIndex = monthNames.findIndex(name => 
      translatedMonth.toLowerCase().includes(name.toLowerCase())
    )
    
    if (monthIndex === -1) return 'old'
    
    // Jos kuukausi on tämä kuukausi
    if (monthIndex === currentMonth) return 'current'
    
    // Jos kuukausi on tulevaisuudessa (tämä vuosi)
    if (monthIndex > currentMonth) return 'upcoming'
    
    // Jos kuukausi on menneisyydessä
    return 'old'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': return '#22c55e' // Vihreä
      case 'upcoming': return '#3b82f6' // Sininen
      case 'old': return '#6b7280' // Harmaa
      default: return '#6b7280'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'current': return i18n.language === 'fi' ? 'Nykyinen' : 'Current'
      case 'upcoming': return i18n.language === 'fi' ? 'Tuleva' : 'Upcoming'
      case 'old': return i18n.language === 'fi' ? 'Vanha' : 'Old'
      default: return i18n.language === 'fi' ? 'Vanha' : 'Old'
    }
  }



  if (loading) {
    return (
      <div className="strategy-loading">
        <div className="loading-spinner"></div>
        <p>{t('strategy.loading')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="strategy-container">
        <div className="strategy-header">
          <h2>{t('strategy.header')}</h2>
        </div>
        
        <div className="strategy-bentogrid">
          {/* Yritysanalyysi, Kohderyhmä, Tavoitteet ja TOV - ylemmät kortit */}
          <div className="strategy-top-row">
            {/* Yritysanalyysi-kortti */}
            <div className="strategy-card">
              <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>Yritysanalyysi</div>
              {editingCompanySummary ? (
                <div style={{ flex: 1 }}>
                  <textarea
                    ref={companySummaryTextareaRef}
                    value={companySummaryEditText}
                    onChange={e => setCompanySummaryEditText(e.target.value)}
                    className="company-summary-textarea"
                    style={{
                      width: '100%',
                      minHeight: 120,
                      padding: 12,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      lineHeight: 1.6,
                      fontFamily: 'inherit',
                      background: '#f9fafb',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Kirjoita yrityksen analyysi..."
                  />
                  <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
                    <button 
                      style={{
                        background: '#22c55e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={handleSaveCompanySummary}
                    >
                      {t('strategy.buttons.save')}
                    </button>
                    <button 
                      style={{
                        background: '#6b7280',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={handleCancelCompanySummary}
                    >
                      {t('strategy.buttons.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  {companySummary && companySummary.length > 0 ? (
                    <>
                      <p style={{ margin: 0, color: '#374151', lineHeight: 1.6, fontSize: 14, whiteSpace: 'pre-line' }}>
                        {companySummary}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                        <button 
                          style={{
                            background: '#22c55e',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 16px',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onClick={handleEditCompanySummary}
                        >
                          Muokkaa
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ flex: 1, textAlign: 'center', padding: 24 }}>
                      <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>Yritysanalyysi puuttuu. Lisää yrityksen kuvaus aloittaaksesi.</p>
                      <button 
                        style={{
                          background: '#22c55e',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setEditingCompanySummary(true)
                          setCompanySummaryEditText('')
                        }}
                      >
                        Luo yritysanalyysi
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Kohderyhmä-kortti */}
            {icpSummary && icpSummary.length > 0 && (
              <div className="strategy-card">
                <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>{t('strategy.icp.title')}</div>
              
              {editingIcp ? (
                <div style={{ flex: 1 }}>
                  <textarea
                    ref={icpTextareaRef}
                    value={icpEditText}
                    onChange={e => setIcpEditText(e.target.value)}
                    className="icp-textarea"
                    style={{
                      width: '100%',
                      minHeight: 120,
                      padding: 12,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      lineHeight: 1.6,
                      fontFamily: 'inherit',
                      background: '#f9fafb',
                      boxSizing: 'border-box'
                    }}
                    placeholder={t('strategy.icp.placeholder')}
                  />
                  <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
                    <button 
                      style={{
                        background: '#22c55e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={handleSaveIcp}
                    >
                      {t('strategy.buttons.save')}
                    </button>
                    <button 
                      style={{
                        background: '#6b7280',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={handleCancelIcp}
                    >
                      {t('strategy.buttons.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  {icpSummary.map((summary, index) => (
                    <div key={index} style={{ 
                      marginBottom: 12 
                    }}>
                      <p style={{ margin: 0, color: '#374151', lineHeight: 1.6, fontSize: 14 }}>{summary}</p>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button 
                      style={{
                        background: '#22c55e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                                              onClick={() => {
                          setEditingIcp(true)
                          setIcpEditText(icpSummary.join('\n'))
                        }}
                    >
                      {t('strategy.icp.edit')}
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

            

            {/* Tavoitteet-kortti */}
            {kpiData && kpiData.length > 0 && (
              <div className="strategy-card">
                <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>{t('strategy.kpi.title')}</div>
                
                {editingKpi ? (
                  <div style={{ flex: 1 }}>
                    <textarea
                      ref={kpiTextareaRef}
                      value={kpiEditText}
                      onChange={e => setKpiEditText(e.target.value)}
                      className="kpi-textarea"
                      style={{
                        width: '100%',
                        minHeight: 120,
                        padding: 12,
                        border: '2px solid #e5e7eb',
                        borderRadius: 8,
                        fontSize: 14,
                        lineHeight: 1.6,
                        fontFamily: 'inherit',
                        background: '#f9fafb',
                        boxSizing: 'border-box'
                      }}
                      placeholder={t('strategy.kpi.placeholder')}
                    />
                    <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
                      <button 
                        style={{
                          background: '#22c55e',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onClick={handleSaveKpi}
                      >
                        {t('strategy.buttons.save')}
                      </button>
                      <button 
                        style={{
                          background: '#6b7280',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onClick={handleCancelKpi}
                      >
                        {t('strategy.buttons.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1 }}>
                    {kpiData.map((kpi, index) => (
                      <div key={index} style={{ 
                        marginBottom: 12 
                      }}>
                        <p style={{ margin: 0, color: '#374151', lineHeight: 1.6, fontSize: 14 }}>{kpi}</p>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                      <button 
                        style={{
                          background: '#22c55e',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setEditingKpi(true)
                          setKpiEditText(kpiData.join('\n'))
                        }}
                      >
                        {t('strategy.kpi.edit')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TOV-kortti */}
            <div className="strategy-card">
              <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>🎤 Äänenlaatu & TOV</div>
              
              {editingTov ? (
                <div style={{ flex: 1 }}>
                  <textarea
                    ref={tovTextareaRef}
                    value={tovEditText}
                    onChange={e => setTovEditText(e.target.value)}
                    className="tov-textarea"
                    style={{
                      width: '100%',
                      minHeight: 120,
                      padding: 12,
                      border: '2px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      lineHeight: 1.6,
                      fontFamily: 'inherit',
                      background: '#f9fafb',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Kuvaile yrityksen äänenlaatu ja TOV (Tone of Voice)..."
                  />
                  <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
                    <button 
                      style={{
                        background: '#22c55e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={handleSaveTov}
                    >
                      {t('strategy.buttons.save')}
                    </button>
                    <button 
                      style={{
                        background: '#6b7280',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={handleCancelTov}
                    >
                      {t('strategy.buttons.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  {tov && tov.length > 0 ? (
                    <>
                      <p style={{ margin: 0, color: '#374151', lineHeight: 1.6, fontSize: 14, whiteSpace: 'pre-line' }}>
                        {tov}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                        <button 
                          style={{
                            background: '#22c55e',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 16px',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onClick={handleEditTov}
                        >
                          Muokkaa
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ flex: 1, textAlign: 'center', padding: 24 }}>
                      <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>Äänenlaatu ja TOV puuttuu. Lisää yrityksen äänenlaatu aloittaaksesi.</p>
                      <button 
                        style={{
                          background: '#22c55e',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setEditingTov(true)
                          setTovEditText('')
                        }}
                      >
                        Luo TOV-kuvaus
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sisältöstrategiat - otsikko */}
          <div className="strategy-section-header">
            <h3>{t('strategy.list.title')}</h3>
          </div>

          {/* Strategiakortit */}
          <div className="strategy-grid">
            {console.log('Rendering strategies:', strategy.length, strategy)}
            {Array.isArray(strategy) && strategy.length > 0 ? strategy
              .sort((a, b) => {
                // Järjestä uusimmasta vanhimmaksi
                const dateA = new Date(a.created_at || a.createdTime || 0)
                const dateB = new Date(b.created_at || b.createdTime || 0)
                const timeA = dateA.getTime()
                const timeB = dateB.getTime()

                // Päivämäärä ensin: uusin ensin, puuttuva päivämäärä tulkitaan vanhimmaksi
                if (timeA && timeB) return timeB - timeA
                if (timeA && !timeB) return -1
                if (!timeA && timeB) return 1
                
                // Muuten järjestä kuukauden mukaan (uusimmasta vanhimmaksi)
                const monthA = a.month || a.Month || ''
                const monthB = b.month || b.Month || ''
                
                console.log('Sorting by month:', { monthA, monthB })
                
                // Käännä kuukaudet suomeksi vertailua varten
                const translatedMonthA = translateMonth(monthA)
                const translatedMonthB = translateMonth(monthB)
                
                // Kuukausien järjestys (uusimmasta vanhimmaksi)
                const monthOrder = [
                  'joulukuu', 'marraskuu', 'lokakuu', 'syyskuu', 'elokuu', 'heinäkuu',
                  'kesäkuu', 'toukokuu', 'huhtikuu', 'maaliskuu', 'helmikuu', 'tammikuu'
                ]
                
                const indexA = monthOrder.findIndex(month => 
                  translatedMonthA.toLowerCase().includes(month.toLowerCase()) || 
                  month.toLowerCase().includes(translatedMonthA.toLowerCase())
                )
                const indexB = monthOrder.findIndex(month => 
                  translatedMonthB.toLowerCase().includes(month.toLowerCase()) || 
                  month.toLowerCase().includes(translatedMonthB.toLowerCase())
                )
                
                console.log('Month indices:', { indexA, indexB, monthA, monthB, translatedMonthA, translatedMonthB })
                
                // Jos kuukausi löytyi, käytä sitä, muuten säilytä järjestys
                if (indexA !== -1 && indexB !== -1) {
                  return indexA - indexB
                }
                
                return 0
              })
              .map(item => {
                const status = getStrategyStatus(item.month || item.Month)
                return (
                  <div key={item.id} className="strategy-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 18, color: '#374151' }}>
                        {formatMonth(item.month || item.Month)}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{
                          background: getStatusColor(status),
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {getStatusText(status)}
                        </div>
                        <div style={{
                          background: item.approved ? '#22c55e' : '#f59e0b',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {item.approved ? (i18n.language === 'fi' ? 'Hyväksytty' : 'Approved') : (i18n.language === 'fi' ? 'Odottaa' : 'Pending')}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: 15, 
                        lineHeight: 1.6, 
                        color: '#374151', 
                        whiteSpace: 'pre-line',
                        marginBottom: 16
                      }}>
                        {item.strategy || item.Strategy}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>
                          {new Date(item.created_at || item.createdTime).toLocaleDateString(i18n.language === 'fi' ? 'fi-FI' : 'en-US')}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!item.approved && (
                            <button 
                              style={{
                                background: '#f59e0b',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 16px',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              onClick={() => handleApproveStrategy(item)}
                            >
                              {i18n.language === 'fi' ? 'Hyväksy strategia' : 'Approve strategy'}
                            </button>
                          )}
                          <button 
                            style={{
                              background: '#22c55e',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '8px 16px',
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            onClick={() => handleEdit(item)}
                          >
                            {t('strategy.buttons.edit')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }) : null}
          </div>

        {/* Tyhjä tila jos ei strategioita */}
        {strategy.length === 0 && (
          <div className="strategy-card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>{t('strategy.empty.title')}</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>{t('strategy.empty.description')}</p>
          </div>
        )}

        {/* Kohderyhmä jos ei ole vielä olemassa */}
        {(!icpSummary || icpSummary.length === 0) && (
          <div className="strategy-card">
            <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>👥 {t('strategy.icp.title')}</div>
            <div style={{ flex: 1, textAlign: 'center', padding: 24 }}>
              <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>{t('strategy.icp.empty')}</p>
              <button 
                style={{
                  background: '#22c55e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setEditingIcp(true)
                  setIcpEditText('')
                }}
              >
                {t('strategy.icp.create')}
              </button>
            </div>
          </div>
        )}

        {/* Yritysanalyysi-placeholder poistettu, koska kortti on aina top-rivissä */}

        {/* Tavoitteet jos ei ole vielä olemassa */}
        {(!kpiData || kpiData.length === 0) && (
          <div className="strategy-card">
            <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>🎯 {t('strategy.kpi.title')}</div>
            <div style={{ flex: 1, textAlign: 'center', padding: 24 }}>
              <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>{t('strategy.kpi.empty')}</p>
              <button 
                style={{
                  background: '#22c55e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setEditingKpi(true)
                  setKpiEditText('')
                }}
              >
                {t('strategy.kpi.create')}
              </button>
            </div>
          </div>
        )}

        {/* TOV jos ei ole vielä olemassa */}
        {(!tov || tov.length === 0) && (
          <div className="strategy-card">
            <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>🎤 Äänenlaatu & TOV</div>
            <div style={{ flex: 1, textAlign: 'center', padding: 24 }}>
              <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>Äänenlaatu ja TOV puuttuu. Lisää yrityksen äänenlaatu aloittaaksesi.</p>
              <button 
                style={{
                  background: '#22c55e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setEditingTov(true)
                  setTovEditText('')
                }}
              >
                Luo TOV-kuvaus
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: 8, 
            padding: 16, 
            marginTop: 16 
          }}>
            <p style={{ margin: 0, color: '#dc2626' }}>{error}</p>
          </div>
        )}
      </div>
      
      {/* Toast notifikaatio */}
      {toast.visible && (
        <div 
          className="toast-notice" 
          role="status" 
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            background: '#111827',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            zIndex: 1100,
            fontWeight: 600
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Editointimodaali */}
      {editId && (
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
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancel()
            }
          }}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: '#374151' 
                }}>
                  {i18n.language === 'fi' ? 'Muokkaa strategiaa' : 'Edit strategy'}
                </h3>
                <span style={{ fontSize: 13, color: '#6b7280' }}>
                  {generatedCountLoading 
                    ? (i18n.language === 'fi' ? 'Ladataan...' : 'Loading...') 
                    : `${generatedCount} ${i18n.language === 'fi' ? 'generoitua sisältöä' : 'generated contents'}`}
                </span>
              </div>
              <button
                onClick={handleCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                lineHeight: '1.6',
                fontFamily: 'inherit',
                background: '#f9fafb',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
              placeholder={t('strategy.strategyCard.placeholder')}
            />
            
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '20px', 
              justifyContent: 'flex-end' 
            }}>
              <button 
                style={{
                  background: '#22c55e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#16a34a'}
                onMouseOut={(e) => e.target.style.background = '#22c55e'}
                onClick={() => handleSave(strategy.find(s => s.id === editId))}
              >
                {t('strategy.buttons.save')}
              </button>
              {!strategy.find(s => s.id === editId)?.approved && (
                <button 
                  style={{
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#d97706'}
                  onMouseOut={(e) => e.target.style.background = '#f59e0b'}
                  onClick={() => handleSaveAndApprove(strategy.find(s => s.id === editId))}
                >
                  {i18n.language === 'fi' ? 'Tallenna ja hyväksy' : 'Save and approve'}
                </button>
              )}
              <button 
                style={{
                  background: '#6b7280',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#4b5563'}
                onMouseOut={(e) => e.target.style.background = '#6b7280'}
                onClick={handleCancel}
              >
                {t('strategy.buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}