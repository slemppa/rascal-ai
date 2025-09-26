import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import './ContentStrategyPage.css'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'
import '../components/ModalComponents.css'

// Mock-data oikealla rakenteella
const mockStrategy = [
  {
    id: 'recZLfAMUcAlUATis',
    createdTime: '2025-06-18T14:17:19.000Z',
    Month: 'Kesäkuu',
    Companies: ['recdcrZw3YHefUXHZ'],
    Strategy: `Rascal Company's content strategy should focus on delivering educational and actionable insights tailored to Finnish-speaking entrepreneurs and business owners, helping them overcome marketing challenges and improve customer acquisition. A blend of content formats such as blog posts, LinkedIn articles, practical video tutorials, and case studies should be implemented to demonstrate effectiveness and relatability. The tone should be direct, practical, and motivational, resonating with the target audience's entrepreneurial spirit. Suggested content themes include: 1) Step-by-step guides on digital ad creation and optimization, 2) Case studies showcasing successful marketing transformations, 3) Insights on overcoming common business growth barriers, 4) Updates on digital marketing trends for small businesses, 5) Spotlight features on Finnish entrepreneurs who have achieved results with Rascal's guidance, and 6) Engaging webinars focusing on practical marketing skills. Developing Q&A or myth-busting series about common marketing misconceptions and organizing interactive sessions with industry experts can further boost engagement.`
  }
]



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
  const [strategy, setStrategy] = useState([])
  const [icpSummary, setIcpSummary] = useState([])
  const [kpiData, setKpiData] = useState([])
  const [companySummary, setCompanySummary] = useState('')
  const [tov, setTov] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editingIcp, setEditingIcp] = useState(false)
  const [icpEditText, setIcpEditText] = useState('')
  const [editingKpi, setEditingKpi] = useState(false)
  const [kpiEditText, setKpiEditText] = useState('')
  const [editingCompanySummary, setEditingCompanySummary] = useState(false)
  const [companySummaryEditText, setCompanySummaryEditText] = useState('')
  const [editingTov, setEditingTov] = useState(false)
  const [tovEditText, setTovEditText] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const [companyId, setCompanyId] = useState(null)
  const textareaRef = React.useRef(null)
  const icpTextareaRef = React.useRef(null)
  const kpiTextareaRef = React.useRef(null)
  const companySummaryTextareaRef = React.useRef(null)
  const tovTextareaRef = React.useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
          setStrategy(data.strategies || [])
          setIcpSummary(data.icpSummary || [])
          setKpiData(data.kpi || [])
          setCompanySummary(data.summary || data.companySummary || '')
          setTov(data.tov || '')
        } else if (Array.isArray(data) && data.length > 0) {
          // Vanha rakenne (array)
          const firstItem = data[0]
          setStrategy(firstItem.strategyAndMonth || [])
          setIcpSummary(firstItem.icpSummary || [])
          setKpiData(firstItem.kpi || [])
          setCompanySummary(firstItem.summary || firstItem.companySummary || '')
          setTov(firstItem.tov || '')
        } else {
          setStrategy(mockStrategy)
          setIcpSummary([])
          setKpiData([])
          setCompanySummary('')
          setTov('')
        }
      } catch (e) {
        setStrategy(mockStrategy)
        setIcpSummary([])
        setKpiData([])
        setCompanySummary('')
        setTov('')
        setError('Ei saatu yhteyttä strategia-endpointiin, näytetään mock-data')
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

  const handleEdit = (item) => {
    setEditId(item.id)
    setEditText(item.strategy || item.Strategy)
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

  // Funktio kuukauden kirjoittamiseen isolla alkukirjaimella
  const formatMonth = (month) => {
    if (!month) return ''
    return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()
  }

  const getStrategyStatus = (month) => {
    if (!month) return 'old'
    
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() // 0-11
    const currentYear = currentDate.getFullYear()
    
    // Kuukausien nimet suomeksi
    const monthNames = [
      'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
      'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'
    ]
    
    // Etsi kuukauden indeksi
    const monthIndex = monthNames.findIndex(name => 
      month.toLowerCase().includes(name.toLowerCase())
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
      case 'current': return 'Current'
      case 'upcoming': return 'Upcoming'
      case 'old': return 'Old'
      default: return 'Old'
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
            {strategy.map(item => {
            const status = getStrategyStatus(item.month || item.Month)
            return (
            <div key={item.id} className="strategy-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#374151' }}>
                  {formatMonth(item.month || item.Month)}
                </div>
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
              </div>
              
              {editId === item.id ? (
                <div style={{ flex: 1 }}>
                  <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="strategy-textarea"
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
                    placeholder={t('strategy.strategyCard.placeholder')}
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
                      onClick={() => handleSave(item)}
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
                      onClick={handleCancel}
                    >
                      {t('strategy.buttons.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          )
        })}
          </div>
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


    </>
  )
} 