import React, { useState, useEffect } from 'react'
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
    // Haetaan käyttäjän company_id Supabase:sta
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('Käyttäjä ei ole kirjautunut')
    }

    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (userError || !userRecord?.company_id) {
      throw new Error('Company ID ei löytynyt')
    }

    const companyId = userRecord.company_id
    console.log('Company ID haettu:', companyId)

    // Kutsu API endpointia company_id:llä
    const url = `/api/strategy?companyId=${companyId}`
    console.log('Haetaan strategiaa URL:sta:', url)
    
  const res = await fetch(url)
    console.log('Strategy API response status:', res.status)
  if (!res.ok) throw new Error('Strategian haku epäonnistui')
    const data = await res.json()
    console.log('Strategy API response data:', data)
    return data
  } catch (error) {
    console.error('Error in getStrategy:', error)
    throw error
  }
}

export default function ContentStrategyPage() {
  const [strategy, setStrategy] = useState([])
  const [icpSummary, setIcpSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editingIcp, setEditingIcp] = useState(false)
  const [icpEditText, setIcpEditText] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const [companyId, setCompanyId] = useState(null)
  const textareaRef = React.useRef(null)
  const icpTextareaRef = React.useRef(null)

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
        
        // Käsittele uusi data-rakenne
        if (data && typeof data === 'object' && data.strategies) {
          setStrategy(data.strategies)
          setIcpSummary(data.icpSummary || [])
        } else if (Array.isArray(data)) {
          // Vanha rakenne (array)
          setStrategy(data)
          setIcpSummary([])
        } else {
          setStrategy(mockStrategy)
          setIcpSummary([])
        }
      } catch (e) {
        setStrategy(mockStrategy)
        setIcpSummary([])
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
      // Haetaan company_id jos se puuttuu
      let currentCompanyId = companyId
      if (!currentCompanyId) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('company_id')
            .eq('auth_user_id', session.user.id)
            .single()
          
          if (userRecord?.company_id) {
            currentCompanyId = userRecord.company_id
            setCompanyId(userRecord.company_id)
          }
        }
      }
      
      const updated = { 
        ...item, 
        strategy: editText, 
        Strategy: editText, // Säilytetään myös vanha kenttä yhteensopivuuden vuoksi
        updateType: 'strategyUpdate',
        company_id: currentCompanyId
      }
      await axios.post('/api/update-post', updated)
      setStrategy(strategy.map(s => s.id === item.id ? updated : s))
      setEditId(null)
    } catch (e) {
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
      
      // Haetaan company_id jos se puuttuu
      let currentCompanyId = companyId
      if (!currentCompanyId) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('company_id')
            .eq('auth_user_id', session.user.id)
            .single()
          
          if (userRecord?.company_id) {
            currentCompanyId = userRecord.company_id
            setCompanyId(userRecord.company_id)
          }
        }
      }
      
      // Lähetä ICP päivitys N8N:ään
      await axios.post('/api/update-post', {
        updateType: 'icpUpdate',
        icpSummary: newIcpSummary,
        company_id: currentCompanyId
      })
      
      setIcpSummary(newIcpSummary)
      setEditingIcp(false)
      setIcpEditText('')
    } catch (e) {
      alert('ICP:n tallennus epäonnistui')
    }
  }

  const handleCancelIcp = () => {
    setEditingIcp(false)
    setIcpEditText('')
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
        <p>Ladataan sisältöstrategiaa...</p>
      </div>
    )
  }

  return (
    <>
      <div className="strategy-container">
        <div className="strategy-header">
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1f2937', margin: 0 }}>Sisältöstrategia</h2>
        </div>
        
        <div className="strategy-bentogrid">
          {/* ICP Summary - normaali kortti */}
          {icpSummary && icpSummary.length > 0 && (
            <div className="strategy-card">
              <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>👥 Ihanneasiakas</div>
              
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
                    placeholder="Kirjoita ICP-kuvaukset tähän (yksi per rivi)..."
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
                      Tallenna
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
                      Peruuta
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
                      onClick={handleEditIcp}
                    >
                      Muokkaa ICP
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* Strategiakortit */}
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
                    placeholder="Kirjoita strategia tähän..."
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
                      Tallenna
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
                      Peruuta
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
                      {new Date(item.created_at || item.createdTime).toLocaleDateString('fi-FI')}
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
                      Muokkaa
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        </div>

        {/* Tyhjä tila jos ei strategioita */}
        {strategy.length === 0 && (
          <div className="strategy-card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>Ei strategioita vielä</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>Aloita luomalla ensimmäinen sisältöstrategia</p>
          </div>
        )}

        {/* ICP Summary jos ei ole vielä olemassa */}
        {(!icpSummary || icpSummary.length === 0) && (
          <div className="strategy-card">
            <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>👥 Ihanneasiakas</div>
            <div style={{ flex: 1, textAlign: 'center', padding: 24 }}>
              <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>Ei ICP-kuvausta vielä</p>
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
                onClick={handleEditIcp}
              >
                Luo ICP
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