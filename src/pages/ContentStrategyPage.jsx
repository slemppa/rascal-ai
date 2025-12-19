import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './ContentStrategyPage.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getUserOrgId } from '../lib/getUserOrgId'
import { useStrategyStatus } from '../contexts/StrategyStatusContext'
import Button from '../components/Button'
import '../components/ModalComponents.css'

const STRATEGY_URL = import.meta.env.N8N_GET_STRATEGY_URL || 'https://samikiias.app.n8n.cloud/webhook/strategy-89777321'

const getStrategy = async () => {
  try {
    // Haetaan käyttäjän tiedot
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('Käyttäjä ei ole kirjautunut')
    }

    // Hae organisaation ID (public.users.id)
    const orgId = await getUserOrgId(session.user.id)
    if (!orgId) {
      throw new Error('Organisaation ID ei löytynyt')
    }

    // Hae organisaation tiedot (company_id)
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', orgId)
      .single()

    if (userError || !userRecord?.company_id) {
      throw new Error('Company ID ei löytynyt')
    }

    const companyId = userRecord.company_id
    const userId = orgId // Käytetään organisaation ID:tä

    // Kutsu API endpointia company_id:llä ja user_id:llä (organisaation ID)
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
  const navigate = useNavigate()
  const { user, organization } = useAuth()
  const { refreshUserStatus } = useStrategyStatus()
  const [orgId, setOrgId] = useState(null)
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
  const [viewingCompanySummary, setViewingCompanySummary] = useState(false)
  const [viewingIcp, setViewingIcp] = useState(false)
  const [viewingKpi, setViewingKpi] = useState(false)
  const [viewingTov, setViewingTov] = useState(false)
  const [editingCompanySummaryModal, setEditingCompanySummaryModal] = useState(false)
  const [editingIcpModal, setEditingIcpModal] = useState(false)
  const [editingKpiModal, setEditingKpiModal] = useState(false)
  const [editingTovModal, setEditingTovModal] = useState(false)
  const [analyzingTov, setAnalyzingTov] = useState(false)
  const [tovSocialUrlModal, setTovSocialUrlModal] = useState(false)
  const [tovSocialUrl, setTovSocialUrl] = useState('')
  const [tovSocialUrlError, setTovSocialUrlError] = useState('')

  const [companyId, setCompanyId] = useState(null)
  const textareaRef = React.useRef(null)
  const icpTextareaRef = React.useRef(null)
  const kpiTextareaRef = React.useRef(null)
  const companySummaryTextareaRef = React.useRef(null)
  const tovTextareaRef = React.useRef(null)

  // Aseta orgId kun käyttäjä on kirjautunut
  useEffect(() => {
    const setOrgIdFromUser = async () => {
      if (user?.id) {
        const userId = await getUserOrgId(user.id)
        if (userId) {
          setOrgId(userId)
        }
      } else if (organization?.id) {
        // Fallback: käytä organization.id:ta jos se on saatavilla
        setOrgId(organization.id)
      }
    }
    setOrgIdFromUser()
  }, [user?.id, organization?.id])

  const fetchGeneratedCount = async (strategyId) => {
    try {
      setGeneratedCountLoading(true)

      // Hae organisaation ID
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const orgId = await getUserOrgId(session.user.id)
      if (!orgId) return

      // Laske generoidut sisällöt tälle strategialle
      const { count, error: cntErr } = await supabase
        .from('content')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', orgId) // Käytetään organisaation ID:tä
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
          // Hae organisaation ID
          const orgId = await getUserOrgId(session.user.id)
          if (orgId) {
            const { data: userRecord } = await supabase
              .from('users')
              .select('company_id')
              .eq('id', orgId)
              .single()
            
            if (userRecord?.company_id) {
              setCompanyId(userRecord.company_id)
            }
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
    if (orgId) {
      fetchStrategy()
    }
  }, [orgId])

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
      if (event.key === 'Escape') {
        if (editId) {
          handleCancel()
        } else if (editingCompanySummaryModal) {
          setEditingCompanySummaryModal(false)
          setCompanySummaryEditText(companySummary)
        } else if (editingIcpModal) {
          setEditingIcpModal(false)
          setIcpEditText(icpSummary.join('\n'))
        } else if (editingKpiModal) {
          setEditingKpiModal(false)
          setKpiEditText(kpiData.join('\n'))
        } else if (editingTovModal) {
          setEditingTovModal(false)
          setTovEditText(tov)
          navigate('/strategy')
        } else if (viewingCompanySummary) {
          setViewingCompanySummary(false)
        } else if (viewingIcp) {
          setViewingIcp(false)
        } else if (viewingKpi) {
          setViewingKpi(false)
        } else if (viewingTov) {
          setViewingTov(false)
        }
      }
    }

    if (editId || editingCompanySummaryModal || editingIcpModal || editingKpiModal || editingTovModal || viewingCompanySummary || viewingIcp || viewingKpi || viewingTov) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editId, editingCompanySummaryModal, editingIcpModal, editingKpiModal, editingTovModal, viewingCompanySummary, viewingIcp, viewingKpi, viewingTov, companySummary, icpSummary, kpiData, tov])

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

      if (!orgId) {
        throw new Error('Organisaation ID puuttuu')
      }

      const response = await axios.post('/api/strategy/approve', {
        strategy_id: item.id,
        month: item.month,
        company_id: companyId,
        user_id: orgId // Käytetään organisaation ID:tä
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-api-key': import.meta.env.N8N_SECRET_KEY || 'fallback-key',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status !== 200 || !response.data?.success) {
        throw new Error(response.data?.error || 'API-vastaus epäonnistui')
      }
      
      console.log('✅ Strategy approval sent successfully:', response.data)

      // Päivitä myös organisaation status "Approved":ksi
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          status: 'Approved',
          strategy_approved_at: new Date().toISOString()
        })
        .eq('id', orgId) // Käytetään organisaation ID:tä

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
      const errorMessage = e.response?.data?.error || e.response?.data?.details || e.message || 'Tuntematon virhe'
      console.error('Error details:', {
        status: e.response?.status,
        data: e.response?.data,
        message: e.message
      })
      alert('Tallennus ja hyväksyntä epäonnistui: ' + errorMessage)
    }
  }

  const handleApproveStrategy = async (item) => {
    console.log('🎯 handleApproveStrategy kutsuttu strategialle:', item)
    try {
      // Lähetä ensin axios-kutsu API endpointin kautta
      console.log('🚀 Lähetetään strategian vahvistus API:n kautta...')
      if (!orgId) {
        throw new Error('Organisaation ID puuttuu')
      }

      console.log('Data:', {
        strategy_id: item.id,
        month: item.month,
        company_id: companyId,
        user_id: orgId // Käytetään organisaation ID:tä
      })

      // Hae access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Käyttäjä ei ole kirjautunut')
      }

      if (!orgId) {
        throw new Error('Organisaation ID puuttuu')
      }

      const response = await axios.post('/api/strategy/approve', {
        strategy_id: item.id,
        month: item.month,
        company_id: companyId,
        user_id: orgId // Käytetään organisaation ID:tä
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-api-key': import.meta.env.N8N_SECRET_KEY || 'fallback-key',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status !== 200 || !response.data?.success) {
        throw new Error(response.data?.error || 'API-vastaus epäonnistui')
      }
      
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

      // Päivitä myös organisaation status "Approved":ksi
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          status: 'Approved',
          strategy_approved_at: new Date().toISOString()
        })
        .eq('id', orgId) // Käytetään organisaation ID:tä

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
      const errorMessage = e.response?.data?.error || e.response?.data?.details || e.message || 'Tuntematon virhe'
      console.error('Error details:', {
        status: e.response?.status,
        data: e.response?.data,
        message: e.message
      })
      alert('Vahvistus epäonnistui: ' + errorMessage)
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
      
      if (!orgId) {
        alert('Organisaation ID puuttuu')
        return
      }
      
      // Päivitä ICP Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          icp_summary: newIcpSummary.join('\n'),
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId) // Käytetään organisaation ID:tä

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
      
      if (!orgId) {
        alert('Organisaation ID puuttuu')
        return
      }
      
      // Päivitä KPI Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          kpi: newKpiData.join('\n'),
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId) // Käytetään organisaation ID:tä

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
      if (!orgId) {
        alert('Organisaation ID puuttuu')
        return
      }
      
      // Päivitä Company Summary Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          company_summary: companySummaryEditText,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId) // Käytetään organisaation ID:tä

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
      if (!orgId) {
        alert('Organisaation ID puuttuu')
        return
      }
      
      // Päivitä TOV Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          tov: tovEditText,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId) // Käytetään organisaation ID:tä

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

  const validateSocialUrl = (url) => {
    if (!url || !url.trim()) {
      return { valid: false, error: '' }
    }

    const trimmedUrl = url.trim().toLowerCase()
    
    // Tarkista että URL on Instagram tai LinkedIn henkilöprofiili
    const instagramPattern = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/.+/
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/

    // Tarkista ensin onko URL ylipäätään validi URL
    try {
      new URL(trimmedUrl)
    } catch {
      return {
        valid: false,
        error: 'Syötä kelvollinen URL-osoite'
      }
    }

    if (instagramPattern.test(trimmedUrl)) {
      return { valid: true, error: '' }
    }
    
    if (linkedinPattern.test(trimmedUrl)) {
      return { valid: true, error: '' }
    }

    // Jos URL on LinkedIn mutta ei /in/ polku
    if (trimmedUrl.includes('linkedin.com')) {
      return {
        valid: false,
        error: 'LinkedIn URL:n täytyy olla henkilöprofiili (linkedin.com/in/...)'
      }
    }

    return { 
      valid: false, 
      error: 'URL:n täytyy olla Instagram-profiili (instagram.com/...) tai LinkedIn henkilöprofiili (linkedin.com/in/...)' 
    }
  }

  const handleSocialUrlChange = (url) => {
    setTovSocialUrl(url)
    const validation = validateSocialUrl(url)
    setTovSocialUrlError(validation.error)
  }

  const handleAnalyzeTovFromSocialMedia = async (socialUrl) => {
    try {
      setAnalyzingTov(true)
      
      if (!orgId) {
        alert('Organisaation ID puuttuu')
        setAnalyzingTov(false)
        return
      }

      const validation = validateSocialUrl(socialUrl)
      if (!validation.valid) {
        setTovSocialUrlError(validation.error || 'Sometilin URL on pakollinen')
        setAnalyzingTov(false)
        return
      }

      // Hae käyttäjän token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Käyttäjä ei ole kirjautunut')
        setAnalyzingTov(false)
        return
      }

      // Kutsu API endpointia some-scrapingille ja TOV-analyysille
      const response = await axios.post('/api/ai/analyze-tone', {
        user_id: orgId,
        social_url: socialUrl.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('TOV analyze response:', response.data)

      // Sulje molemmat modaalit vasta kun API-kutsu onnistui
      setTovSocialUrlModal(false)
      setEditingTovModal(false)
      setTovSocialUrl('')
      setTovSocialUrlError('')
      navigate('/strategy')

      if (response.data?.success) {
        if (response.data?.tov) {
          // N8N palautti TOV:n suoraan
          setTovEditText(response.data.tov)
          setToast({ visible: true, message: 'TOV-analyysi valmis! Tarkista ja tallenna tulos.' })
          setTimeout(() => setToast({ visible: false, message: '' }), 5000)
        } else {
          // N8N aloitti asynkronisen prosessin
          setToast({ visible: true, message: 'TOV-analyysi aloitettu. Analyysi valmistuu hetken kuluttua.' })
          setTimeout(() => setToast({ visible: false, message: '' }), 5000)
        }
      } else {
        alert('TOV-analyysi epäonnistui. Yritä myöhemmin uudelleen.')
      }
    } catch (error) {
      console.error('Error analyzing TOV from social media:', error)
      console.error('Error response:', error.response?.data)
      const errorMessage = error.response?.data?.error || error.response?.data?.details?.error || error.message
      alert('TOV-analyysi epäonnistui: ' + errorMessage)
      // Modaali pysyy auki jos virhe tapahtuu
    } finally {
      setAnalyzingTov(false)
    }
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
              <div style={{ flex: 1 }}>
                {companySummary && companySummary.length > 0 ? (
                  <>
                    <div 
                      className="strategy-text"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setViewingCompanySummary(true)}
                    >
                      {companySummary}
                    </div>
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
                            setEditingCompanySummaryModal(true)
                            setCompanySummaryEditText(companySummary)
                          }}
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
                        setEditingCompanySummaryModal(true)
                        setCompanySummaryEditText('')
                      }}
                    >
                      Luo yritysanalyysi
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Kohderyhmä-kortti */}
            <div className="strategy-card">
              <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>{t('strategy.icp.title')}</div>
              <div style={{ flex: 1 }}>
                {icpSummary && icpSummary.length > 0 ? (
                  <>
                    <div 
                      className="strategy-text"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setViewingIcp(true)}
                    >
                      {icpSummary.map((summary) => `- ${summary}`).join('\n')}
                    </div>
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
                            setEditingIcpModal(true)
                            setIcpEditText(icpSummary.join('\n'))
                          }}
                        >
                          {t('strategy.icp.edit')}
                        </button>
                      </div>
                  </>
                ) : (
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
                        setEditingIcpModal(true)
                        setIcpEditText('')
                      }}
                    >
                      {t('strategy.icp.create')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            

            {/* Tavoitteet-kortti */}
            <div className="strategy-card">
              <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>{t('strategy.kpi.title', 'Tavoitteet')}</div>
              <div style={{ flex: 1 }}>
                {kpiData && kpiData.length > 0 ? (
                  <>
                    <div 
                      className="strategy-text"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setViewingKpi(true)}
                    >
                      {kpiData.map((kpi) => `- ${kpi}`).join('\n')}
                    </div>
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
                              setEditingKpiModal(true)
                              setKpiEditText(kpiData.join('\n'))
                            }}
                          >
                            {t('strategy.kpi.edit')}
                          </button>
                        </div>
                  </>
                ) : (
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
                        setEditingKpiModal(true)
                        setKpiEditText('')
                      }}
                    >
                      {t('strategy.kpi.create')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* TOV-kortti */}
            <div className="strategy-card">
              <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>🎤 Äänenlaatu & TOV</div>
              <div style={{ flex: 1 }}>
                {tov && tov.length > 0 ? (
                  <>
                    <div 
                      className="strategy-text"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setViewingTov(true)}
                    >
                      {tov}
                    </div>
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
                            setEditingTovModal(true)
                            setTovEditText(tov)
                          }}
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
                        setEditingTovModal(true)
                        setTovEditText('')
                      }}
                    >
                      Luo TOV-kuvaus
                    </button>
                  </div>
                )}
              </div>
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
                // Backend järjestää created_at mukaan, mutta varmistetaan oikea järjestys
                // kuukauden nimen mukaan (englanniksi, kuten tietokannassa)
                const monthA = (a.month || a.Month || '').toLowerCase().trim()
                const monthB = (b.month || b.Month || '').toLowerCase().trim()
                
                // Kuukausien järjestys englanniksi (uusimmasta vanhimmaksi) - indeksi 0 = uusin
                const monthOrder = [
                  'december', 'november', 'october', 'september', 'august', 'july',
                  'june', 'may', 'april', 'march', 'february', 'january'
                ]
                
                // Etsi indeksi kuukauden nimen perusteella
                const findMonthIndex = (monthName) => {
                  if (!monthName) return -1
                  return monthOrder.findIndex(month => {
                    const monthLower = month.toLowerCase()
                    const nameLower = monthName.toLowerCase()
                    // Tarkka täsmäys
                    if (monthLower === nameLower) return true
                    // Sisältää-vertailu (jos kuukausi on esim. "november 2024")
                    if (nameLower.includes(monthLower) || monthLower.includes(nameLower)) return true
                    return false
                  })
                }
                
                const indexA = findMonthIndex(monthA)
                const indexB = findMonthIndex(monthB)
                
                // Jos kuukausi löytyi, käytä sitä (pienempi indeksi = uudempi kuukausi)
                // Koska monthOrder on jo uusimmasta vanhimpaan, pienempi indeksi tarkoittaa uudempaa
                if (indexA !== -1 && indexB !== -1) {
                  return indexA - indexB // Pienempi indeksi ensin = uusin ensin
                }
                
                // Jos toinen löytyi mutta toinen ei, löytynyt menee ensin
                if (indexA !== -1 && indexB === -1) return -1
                if (indexA === -1 && indexB !== -1) return 1
                
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
                      <div
                        className="strategy-text"
                      >
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

        {/* Yritysanalyysi-placeholder, Kohderyhmä ja Tavoitteet ovat nyt aina top-rivissä */}

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

      {/* Yritysanalyysi-näyttömodaali */}
      {viewingCompanySummary && (
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
              setViewingCompanySummary(false)
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
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#374151' 
              }}>
                Yritysanalyysi
              </h3>
              <button
                onClick={() => setViewingCompanySummary(false)}
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
            
            <div style={{
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#374151',
              whiteSpace: 'pre-line',
              marginBottom: '20px'
            }}>
              {companySummary}
            </div>
            
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
                onClick={() => {
                  setViewingCompanySummary(false)
                  setEditingCompanySummaryModal(true)
                  setCompanySummaryEditText(companySummary)
                }}
              >
                Muokkaa
              </button>
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
                onClick={() => setViewingCompanySummary(false)}
              >
                Sulje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kohderyhmä-näyttömodaali */}
      {viewingIcp && (
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
              setViewingIcp(false)
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
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#374151' 
              }}>
                {t('strategy.icp.title')}
              </h3>
              <button
                onClick={() => setViewingIcp(false)}
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
            
            <div style={{
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#374151',
              whiteSpace: 'pre-line',
              marginBottom: '20px'
            }}>
              {icpSummary.map((summary, index) => (
                <div key={index} style={{ marginBottom: '12px' }}>
                  <strong>- {summary}</strong>
                </div>
              ))}
            </div>
            
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
                onClick={() => {
                  setViewingIcp(false)
                  setEditingIcpModal(true)
                  setIcpEditText(icpSummary.join('\n'))
                }}
              >
                {t('strategy.icp.edit')}
              </button>
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
                onClick={() => setViewingIcp(false)}
              >
                Sulje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tavoitteet-näyttömodaali */}
      {viewingKpi && (
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
              setViewingKpi(false)
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
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#374151' 
              }}>
                {t('strategy.kpi.title', 'Tavoitteet')}
              </h3>
              <button
                onClick={() => setViewingKpi(false)}
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
            
            <div style={{
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#374151',
              whiteSpace: 'pre-line',
              marginBottom: '20px'
            }}>
              {kpiData.map((kpi, index) => (
                <div key={index} style={{ marginBottom: '12px' }}>
                  <strong>- {kpi}</strong>
                </div>
              ))}
            </div>
            
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
                onClick={() => {
                  setViewingKpi(false)
                  setEditingKpiModal(true)
                  setKpiEditText(kpiData.join('\n'))
                }}
              >
                {t('strategy.kpi.edit')}
              </button>
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
                onClick={() => setViewingKpi(false)}
              >
                Sulje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOV-näyttömodaali */}
      {viewingTov && (
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
              setViewingTov(false)
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
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#374151' 
              }}>
                🎤 Äänenlaatu & TOV
              </h3>
              <button
                onClick={() => setViewingTov(false)}
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
            
            <div style={{
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#374151',
              whiteSpace: 'pre-line',
              marginBottom: '20px'
            }}>
              {tov}
            </div>
            
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
                onClick={() => {
                  setViewingTov(false)
                  setEditingTovModal(true)
                  setTovEditText(tov)
                }}
              >
                Muokkaa
              </button>
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
                onClick={() => setViewingTov(false)}
              >
                Sulje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yritysanalyysi-muokkaustilamodaali */}
      {editingCompanySummaryModal && (
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
              setEditingCompanySummaryModal(false)
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
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#374151' 
              }}>
                Muokkaa yritysanalyysiä
              </h3>
              <button
                onClick={() => setEditingCompanySummaryModal(false)}
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
              ref={companySummaryTextareaRef}
              value={companySummaryEditText}
              onChange={e => setCompanySummaryEditText(e.target.value)}
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
              placeholder="Kirjoita yrityksen analyysi..."
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
                onClick={async () => {
                  await handleSaveCompanySummary()
                  setEditingCompanySummaryModal(false)
                }}
              >
                {t('strategy.buttons.save')}
              </button>
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
                onClick={() => {
                  setEditingCompanySummaryModal(false)
                  setCompanySummaryEditText(companySummary)
                }}
              >
                {t('strategy.buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kohderyhmä-muokkaustilamodaali */}
      {editingIcpModal && (
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
              setEditingIcpModal(false)
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
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#374151' 
              }}>
                {t('strategy.icp.title')}
              </h3>
              <button
                onClick={() => setEditingIcpModal(false)}
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
              ref={icpTextareaRef}
              value={icpEditText}
              onChange={e => setIcpEditText(e.target.value)}
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
              placeholder={t('strategy.icp.placeholder')}
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
                onClick={async () => {
                  await handleSaveIcp()
                  setEditingIcpModal(false)
                }}
              >
                {t('strategy.buttons.save')}
              </button>
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
                onClick={() => {
                  setEditingIcpModal(false)
                  setIcpEditText(icpSummary.join('\n'))
                }}
              >
                {t('strategy.buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tavoitteet-muokkaustilamodaali */}
      {editingKpiModal && (
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
              setEditingKpiModal(false)
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
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#374151' 
              }}>
                {t('strategy.kpi.title', 'Tavoitteet')}
              </h3>
              <button
                onClick={() => setEditingKpiModal(false)}
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
              ref={kpiTextareaRef}
              value={kpiEditText}
              onChange={e => setKpiEditText(e.target.value)}
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
              placeholder={t('strategy.kpi.placeholder')}
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
                onClick={async () => {
                  await handleSaveKpi()
                  setEditingKpiModal(false)
                }}
              >
                {t('strategy.buttons.save')}
              </button>
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
                onClick={() => {
                  setEditingKpiModal(false)
                  setKpiEditText(kpiData.join('\n'))
                }}
              >
                {t('strategy.buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOV-muokkaustilamodaali */}
      {editingTovModal && (
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
              setEditingTovModal(false)
              navigate('/strategy')
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
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#374151' 
              }}>
                🎤 Äänenlaatu & TOV
              </h3>
              <button
                onClick={() => {
                  setEditingTovModal(false)
                  navigate('/strategy')
                }}
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
            
            {/* Apu-nappi some-scrapingille ja TOV-analyysille */}
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setTovSocialUrlModal(true)}
                disabled={analyzingTov}
                style={{
                  background: analyzingTov ? '#9ca3af' : '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: analyzingTov ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  width: '100%'
                }}
                onMouseOver={(e) => {
                  if (!analyzingTov) {
                    e.target.style.background = '#d97706'
                  }
                }}
                onMouseOut={(e) => {
                  if (!analyzingTov) {
                    e.target.style.background = '#f59e0b'
                  }
                }}
              >
                {analyzingTov ? 'Analysoidaan somea...' : 'En ole varma, tarvitsen apua'}
              </button>
            </div>
            
            <textarea
              ref={tovTextareaRef}
              value={tovEditText}
              onChange={e => setTovEditText(e.target.value)}
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
              placeholder="Kuvaile yrityksen äänenlaatu ja TOV (Tone of Voice)..."
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
                onClick={async () => {
                  await handleSaveTov()
                  setEditingTovModal(false)
                  navigate('/strategy')
                }}
              >
                {t('strategy.buttons.save')}
              </button>
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
                onClick={() => {
                  setEditingTovModal(false)
                  setTovEditText(tov)
                  navigate('/strategy')
                }}
              >
                {t('strategy.buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sometilin URL -modaali TOV-analyysille */}
      {tovSocialUrlModal && (
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
            zIndex: 2001,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTovSocialUrlModal(false)
              setTovSocialUrl('')
              setTovSocialUrlError('')
            }
          }}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
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
              <h3 style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#374151' 
              }}>
                Syötä sometilin URL
              </h3>
              <button
                onClick={() => {
                  setTovSocialUrlModal(false)
                  setTovSocialUrl('')
                  setTovSocialUrlError('')
                }}
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
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Sometilin URL (Instagram tai LinkedIn henkilöprofiili)
              </label>
              <input
                type="url"
                value={tovSocialUrl}
                onChange={(e) => handleSocialUrlChange(e.target.value)}
                placeholder="https://instagram.com/example tai https://linkedin.com/in/henkilo"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${tovSocialUrlError ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tovSocialUrl.trim() && !tovSocialUrlError) {
                    const validation = validateSocialUrl(tovSocialUrl)
                    if (validation.valid) {
                      handleAnalyzeTovFromSocialMedia(tovSocialUrl)
                    }
                  }
                }}
                autoFocus
              />
              {tovSocialUrlError && (
                <p style={{
                  margin: '8px 0 0 0',
                  fontSize: '14px',
                  color: '#ef4444'
                }}>
                  {tovSocialUrlError}
                </p>
              )}
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end' 
            }}>
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
                onClick={() => {
                  setTovSocialUrlModal(false)
                  setTovSocialUrl('')
                  setTovSocialUrlError('')
                }}
              >
                Peruuta
              </button>
              <button 
                style={{
                  background: analyzingTov ? '#9ca3af' : '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: analyzingTov ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!analyzingTov) {
                    e.target.style.background = '#d97706'
                  }
                }}
                onMouseOut={(e) => {
                  if (!analyzingTov) {
                    e.target.style.background = '#f59e0b'
                  }
                }}
                disabled={analyzingTov || !tovSocialUrl.trim() || !!tovSocialUrlError}
                onClick={() => {
                  const validation = validateSocialUrl(tovSocialUrl)
                  if (validation.valid) {
                    handleAnalyzeTovFromSocialMedia(tovSocialUrl)
                  }
                }}
              >
                {analyzingTov ? 'Analysoidaan...' : 'Aloita analyysi'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}