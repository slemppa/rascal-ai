import React, { useEffect, useState } from 'react'
import axios from 'axios'
import PageHeader from '../components/PageHeader'

// Mock-data oikealla rakenteella
const mockStrategy = [
  {
    id: 'recZLfAMUcAlUATis',
    createdTime: '2025-06-18T14:17:19.000Z',
    Month: 'Kesäkuu',
    Companies: ['recdcrZw3YHefUXHZ'],
    Strategy: `Rascal Company's content strategy should focus on delivering educational and actionable insights tailored to Finnish-speaking entrepreneurs and business owners, helping them overcome marketing challenges and improve customer acquisition. A blend of content formats such as blog posts, LinkedIn articles, practical video tutorials, and case studies should be implemented to demonstrate effectiveness and relatability. The tone should be direct, practical, and motivational, resonating with the target audience's entrepreneurial spirit. Suggested content themes include: 1) Step-by-step guides on digital ad creation and optimization, 2) Case studies showcasing successful marketing transformations, 3) Insights on overcoming common business growth barriers, 4) Updates on digital marketing trends for small businesses, 5) Spotlight features on Finnish entrepreneurs who have achieved results with Rascal's guidance, and 6) Engaging webinars focusing on practical marketing skills. Developing Q&A or myth-busting series about common marketing misconceptions and organizing interactive sessions with industry experts can further boost engagement.`,
    ICP: {
      demographics: {
        age: '30-50',
        location: 'Suomi',
        language: 'Suomi',
        education: 'Korkeakoulututkinto tai vastaava'
      },
      business: {
        companySize: '5-50 työntekijää',
        industry: 'Teknologia, palvelut, kauppa',
        revenue: '500k - 5M €/vuosi',
        stage: 'Kasvuvaiheessa oleva yritys'
      },
      painPoints: [
        'Rajoitettu markkinointibudjetti',
        'Kilpailu digitaalisessa markkinoinnissa',
        'Asiakkaiden löytäminen ja säilyttäminen',
        'ROI:n mittaaminen markkinointitoimista'
      ],
      goals: [
        'Kasvattaa digitaalista läsnäoloa',
        'Parantaa asiakkaiden hankintaa',
        'Optimoida markkinointibudjettia',
        'Rakentaa brändiä'
      ],
      behavior: {
        channels: ['LinkedIn', 'Google', 'Suosittelut'],
        content: 'Käytännölliset oppaat ja case studyt',
        decision: 'Todisteet ja tulokset ovat tärkeitä'
      }
    }
  }
]

const STRATEGY_URL = import.meta.env.N8N_GET_STRATEGY_URL || 'https://samikiias.app.n8n.cloud/webhook/strategy-89777321'

const getStrategy = async (companyId) => {
  const url = companyId ? `/api/strategy?companyId=${companyId}` : '/api/strategy'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Strategian haku epäonnistui')
  return await res.json()
}

export default function ContentStrategyPage() {
  const [strategy, setStrategy] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editText, setEditText] = useState('')
  const [editType, setEditType] = useState('strategy') // 'strategy' tai 'icp'
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [icpFormData, setIcpFormData] = useState({
    demographics: {
      age: '',
      location: '',
      language: '',
      education: ''
    },
    business: {
      companySize: '',
      industry: '',
      revenue: '',
      stage: ''
    },
    painPoints: [''],
    goals: [''],
    behavior: {
      channels: '',
      content: '',
      decision: ''
    }
  })
  const textareaRef = React.useRef(null)

  useEffect(() => {
    const fetchStrategy = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Hae companyId localStoragesta
        let companyId = null
        try {
          const userRaw = JSON.parse(localStorage.getItem('user') || 'null')
          companyId = userRaw?.companyId || userRaw?.user?.companyId || null
        } catch (e) {
          console.warn('Could not parse user from localStorage:', e)
        }
        
        const data = await getStrategy(companyId)
        setStrategy(Array.isArray(data) ? data : mockStrategy)
      } catch (e) {
        setStrategy(mockStrategy)
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
  }, [editText])

  // ESC-näppäimellä modaalin sulkeminen
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        setShowModal(false)
        setEditingItem(null)
        setEditText('')
        setIcpFormData({
          demographics: { age: '', location: '', language: '', education: '' },
          business: { companySize: '', industry: '', revenue: '', stage: '' },
          painPoints: [''],
          goals: [''],
          behavior: { channels: '', content: '', decision: '' }
        })
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [])

  const handleIcpFieldChange = (section, field, value) => {
    setIcpFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleIcpArrayChange = (field, index, value) => {
    setIcpFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addIcpArrayItem = (field) => {
    setIcpFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeIcpArrayItem = (field, index) => {
    setIcpFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleEdit = (item, type = 'strategy') => {
    setEditingItem(item)
    setEditType(type)
    if (type === 'strategy') {
      setEditText(item.Strategy)
    } else if (type === 'icp') {
      // Täytetään lomake olemassa olevilla tiedoilla
      if (item.ICP) {
        setIcpFormData({
          demographics: {
            age: item.ICP.demographics?.age || '',
            location: item.ICP.demographics?.location || '',
            language: item.ICP.demographics?.language || '',
            education: item.ICP.demographics?.education || ''
          },
          business: {
            companySize: item.ICP.business?.companySize || '',
            industry: item.ICP.business?.industry || '',
            revenue: item.ICP.business?.revenue || '',
            stage: item.ICP.business?.stage || ''
          },
          painPoints: item.ICP.painPoints?.length > 0 ? [...item.ICP.painPoints] : [''],
          goals: item.ICP.goals?.length > 0 ? [...item.ICP.goals] : [''],
          behavior: {
            channels: item.ICP.behavior?.channels?.join(', ') || '',
            content: item.ICP.behavior?.content || '',
            decision: item.ICP.behavior?.decision || ''
          }
        })
      }
    }
    setShowModal(true)
  }

  const handleSave = async (item) => {
    try {
      if (!item.recordId) {
        alert('Record ID puuttuu - ei voi päivittää')
        return
      }

      let updateData
      let updateType

      if (editType === 'strategy') {
        updateData = editText
        updateType = 'strategy'
      } else if (editType === 'icp') {
        // Muunnetaan lomaketiedot JSON-muotoon
        const icpData = {
          demographics: icpFormData.demographics,
          business: icpFormData.business,
          painPoints: icpFormData.painPoints.filter(point => point.trim() !== ''),
          goals: icpFormData.goals.filter(goal => goal.trim() !== ''),
          behavior: {
            ...icpFormData.behavior,
            channels: icpFormData.behavior.channels.split(',').map(channel => channel.trim()).filter(channel => channel !== '')
          }
        }
        updateData = icpData
        updateType = 'icp'
      } else {
        alert('Virheellinen päivitystyyppi')
        return
      }

      // Päivitä Airtableen
      const response = await axios.post('/api/airtable-update', {
        recordId: item.recordId,
        type: updateType,
        data: updateData
      })

      if (response.data.success) {
        // Päivitä paikallinen tila
        let updated = { ...item }
        if (editType === 'strategy') {
          updated = { ...item, Strategy: editText }
        } else if (editType === 'icp') {
          const icpData = {
            demographics: icpFormData.demographics,
            business: icpFormData.business,
            painPoints: icpFormData.painPoints.filter(point => point.trim() !== ''),
            goals: icpFormData.goals.filter(goal => goal.trim() !== ''),
            behavior: {
              ...icpFormData.behavior,
              channels: icpFormData.behavior.channels.split(',').map(channel => channel.trim()).filter(channel => channel !== '')
            }
          }
          updated = { ...item, ICP: icpData }
        }
        
        setStrategy(strategy.map(s => s.id === item.id ? updated : s))
        setShowModal(false)
        setEditingItem(null)
        setEditText('')
        alert('Päivitys onnistui!')
      } else {
        alert('Päivitys epäonnistui: ' + response.data.error)
      }
    } catch (e) {
      console.error('Päivitysvirhe:', e)
      alert('Päivitys epäonnistui: ' + (e.response?.data?.error || e.message))
    }
  }

  if (loading) return <p>Ladataan...</p>

  return (
    <>
      <PageHeader title="Sisältöstrategia" />
      <div style={{maxWidth: 1400, padding: '0 8px'}}>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginTop: '32px',
          padding: '0 8px',
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
            gap: '16px'
          }
        }}>
          {strategy.map(item => (
            <div key={item.id} style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              border: '1px solid #e1e8ed',
              padding: 24,
              width: '100%',
              position: 'relative',
              height: 'fit-content'
            }}>
              <div style={{fontWeight: 700, fontSize: 20, marginBottom: 16}}>
                {item.ICP && !item.Strategy ? 'Ihanne asiakas' : `${item.Month.charAt(0).toUpperCase() + item.Month.slice(1)} strategia`}
              </div>
              
              {/* Strategia-osio - näytetään vain jos on strategia */}
              {item.Strategy && (
                <div style={{marginBottom: 24}}>
                  <div style={{marginBottom: 12, whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.6}}>{item.Strategy}</div>
                  <button onClick={() => handleEdit(item, 'strategy')} style={{background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Muokkaa strategiaa</button>
                </div>
              )}

                            {/* ICP-osio - näytetään vain jos on ICP */}
              {item.ICP && (
                <div>
                  {item.ICP ? (
                    <div style={{fontSize: 14, lineHeight: 1.6}}>
                      <div style={{marginBottom: 16}}>
                        <strong>Demografia:</strong>
                        <div style={{marginLeft: 16, marginTop: 4}}>
                          <div>• Ikä: {item.ICP.demographics?.age}</div>
                          <div>• Sijainti: {item.ICP.demographics?.location}</div>
                          <div>• Kieli: {item.ICP.demographics?.language}</div>
                          <div>• Koulutus: {item.ICP.demographics?.education}</div>
                        </div>
                      </div>
                      
                      <div style={{marginBottom: 16}}>
                        <strong>Yritys:</strong>
                        <div style={{marginLeft: 16, marginTop: 4}}>
                          <div>• Koko: {item.ICP.business?.companySize}</div>
                          <div>• Toimiala: {item.ICP.business?.industry}</div>
                          <div>• Liikevaihto: {item.ICP.business?.revenue}</div>
                          <div>• Vaihe: {item.ICP.business?.stage}</div>
                        </div>
                      </div>
                      
                      <div style={{marginBottom: 16}}>
                        <strong>Haasteet:</strong>
                        <div style={{marginLeft: 16, marginTop: 4}}>
                          {item.ICP.painPoints?.map((point, index) => (
                            <div key={index}>• {point}</div>
                          ))}
                        </div>
                      </div>
                      
                      <div style={{marginBottom: 16}}>
                        <strong>Tavoitteet:</strong>
                        <div style={{marginLeft: 16, marginTop: 4}}>
                          {item.ICP.goals?.map((goal, index) => (
                            <div key={index}>• {goal}</div>
                          ))}
                        </div>
                      </div>
                      
                      <div style={{marginBottom: 16}}>
                        <strong>Käyttäytyminen:</strong>
                        <div style={{marginLeft: 16, marginTop: 4}}>
                          <div>• Kanavat: {item.ICP.behavior?.channels?.join(', ')}</div>
                          <div>• Sisältö: {item.ICP.behavior?.content}</div>
                          <div>• Päätöksenteko: {item.ICP.behavior?.decision}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{color: '#6b7280', fontStyle: 'italic'}}>ICP-tietoja ei ole vielä määritelty</div>
                  )}
                  <button onClick={() => handleEdit(item, 'icp')} style={{background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>Muokkaa ICP:tä</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Muokkausmodaali */}
      {showModal && editingItem && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => {
            setShowModal(false)
            setEditingItem(null)
            setEditText('')
            setIcpFormData({
              demographics: { age: '', location: '', language: '', education: '' },
              business: { companySize: '', industry: '', revenue: '', stage: '' },
              painPoints: [''],
              goals: [''],
              behavior: { channels: '', content: '', decision: '' }
            })
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 24,
              maxWidth: '80%',
              maxHeight: '80%',
              width: '600px',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: 16
            }}>
              <h3 style={{margin: 0, fontSize: 18, fontWeight: 600}}>
                Muokkaa {editType === 'strategy' ? 'strategiaa' : 'ICP:tä'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingItem(null)
                  setEditText('')
                  setIcpFormData({
                    demographics: { age: '', location: '', language: '', education: '' },
                    business: { companySize: '', industry: '', revenue: '', stage: '' },
                    painPoints: [''],
                    goals: [''],
                    behavior: { channels: '', content: '', decision: '' }
                  })
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{marginBottom: 20}}>
              {editType === 'strategy' ? (
                <textarea
                  ref={textareaRef}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 200,
                    resize: 'vertical',
                    fontSize: 14,
                    lineHeight: 1.5,
                    borderRadius: 8,
                    border: '1.5px solid #e1e8ed',
                    background: '#f7fafc',
                    padding: '12px 14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Syötä strategia..."
                />
              ) : (
                <div style={{maxHeight: 400, overflow: 'auto'}}>
                  {/* Demografia */}
                  <div style={{marginBottom: 24}}>
                    <h4 style={{margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: '#374151'}}>Demografia</h4>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                      <input
                        type="text"
                        placeholder="Ikä (esim. 30-50)"
                        value={icpFormData.demographics.age}
                        onChange={e => handleIcpFieldChange('demographics', 'age', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Sijainti (esim. Suomi)"
                        value={icpFormData.demographics.location}
                        onChange={e => handleIcpFieldChange('demographics', 'location', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Kieli (esim. Suomi)"
                        value={icpFormData.demographics.language}
                        onChange={e => handleIcpFieldChange('demographics', 'language', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Koulutus (esim. Korkeakoulututkinto)"
                        value={icpFormData.demographics.education}
                        onChange={e => handleIcpFieldChange('demographics', 'education', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                    </div>
                  </div>

                  {/* Yritys */}
                  <div style={{marginBottom: 24}}>
                    <h4 style={{margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: '#374151'}}>Yritys</h4>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                      <input
                        type="text"
                        placeholder="Yrityksen koko (esim. 5-50 työntekijää)"
                        value={icpFormData.business.companySize}
                        onChange={e => handleIcpFieldChange('business', 'companySize', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Toimiala (esim. Teknologia, palvelut)"
                        value={icpFormData.business.industry}
                        onChange={e => handleIcpFieldChange('business', 'industry', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Liikevaihto (esim. 500k - 5M €/vuosi)"
                        value={icpFormData.business.revenue}
                        onChange={e => handleIcpFieldChange('business', 'revenue', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Vaihe (esim. Kasvuvaiheessa)"
                        value={icpFormData.business.stage}
                        onChange={e => handleIcpFieldChange('business', 'stage', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                    </div>
                  </div>

                  {/* Haasteet */}
                  <div style={{marginBottom: 24}}>
                    <h4 style={{margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: '#374151'}}>Haasteet</h4>
                    {icpFormData.painPoints.map((point, index) => (
                      <div key={index} style={{display: 'flex', gap: 8, marginBottom: 8}}>
                        <input
                          type="text"
                          placeholder="Haaste (esim. Rajoitettu markkinointibudjetti)"
                          value={point}
                          onChange={e => handleIcpArrayChange('painPoints', index, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: 14
                          }}
                        />
                        {icpFormData.painPoints.length > 1 && (
                          <button
                            onClick={() => removeIcpArrayItem('painPoints', index)}
                            style={{
                              padding: '8px 12px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer'
                            }}
                          >
                            Poista
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addIcpArrayItem('painPoints')}
                      style={{
                        padding: '8px 16px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      + Lisää haaste
                    </button>
                  </div>

                  {/* Tavoitteet */}
                  <div style={{marginBottom: 24}}>
                    <h4 style={{margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: '#374151'}}>Tavoitteet</h4>
                    {icpFormData.goals.map((goal, index) => (
                      <div key={index} style={{display: 'flex', gap: 8, marginBottom: 8}}>
                        <input
                          type="text"
                          placeholder="Tavoite (esim. Kasvattaa digitaalista läsnäoloa)"
                          value={goal}
                          onChange={e => handleIcpArrayChange('goals', index, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: 14
                          }}
                        />
                        {icpFormData.goals.length > 1 && (
                          <button
                            onClick={() => removeIcpArrayItem('goals', index)}
                            style={{
                              padding: '8px 12px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer'
                            }}
                          >
                            Poista
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addIcpArrayItem('goals')}
                      style={{
                        padding: '8px 16px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      + Lisää tavoite
                    </button>
                  </div>

                  {/* Käyttäytyminen */}
                  <div style={{marginBottom: 24}}>
                    <h4 style={{margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: '#374151'}}>Käyttäytyminen</h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                      <input
                        type="text"
                        placeholder="Kanavat (esim. LinkedIn, Google, Suosittelut)"
                        value={icpFormData.behavior.channels}
                        onChange={e => handleIcpFieldChange('behavior', 'channels', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Sisältö (esim. Käytännölliset oppaat ja case studyt)"
                        value={icpFormData.behavior.content}
                        onChange={e => handleIcpFieldChange('behavior', 'content', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Päätöksenteko (esim. Todisteet ja tulokset ovat tärkeitä)"
                        value={icpFormData.behavior.decision}
                        onChange={e => handleIcpFieldChange('behavior', 'decision', e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 14
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12
            }}>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setEditingItem(null)
                  setEditText('')
                  setIcpFormData({
                    demographics: { age: '', location: '', language: '', education: '' },
                    business: { companySize: '', industry: '', revenue: '', stage: '' },
                    painPoints: [''],
                    goals: [''],
                    behavior: { channels: '', content: '', decision: '' }
                  })
                }}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
                }}
              >
                Peruuta
              </button>
              <button 
                onClick={() => handleSave(editingItem)}
                style={{
                  background: 'var(--brand-green)',
                  color: 'var(--brand-black)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
                }}
              >
                Tallenna
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 