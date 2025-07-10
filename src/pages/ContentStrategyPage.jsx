import React, { useEffect, useState } from 'react'
import axios from 'axios'
import PageHeader from '../components/PageHeader'
import './ContentStrategyPage.css'

// Mock-data uudessa webhook-formaatissa
const mockStrategy = [
  {
    ICP: {
      summary: 'Sinulla ei ole vielä ICP:tä.'
    },
    strategies: [
      {
        text: 'Sinulla ei ole vielä strategiaa.',
        month: 'Kuukausi',
        id: 'recZLfAMUcAlUATis'
      }
    ]
  }
]

const STRATEGY_URL = import.meta.env.N8N_GET_STRATEGY_URL || 'https://samikiias.app.n8n.cloud/webhook/strategy-89777321'

const getStrategy = async (companyId) => {
  const url = companyId ? `/api/strategy?companyId=${companyId}` : '/api/strategy'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Strategian haku epäonnistui')
  return await res.json()
}

function icpToText(data) {
  const demographics = `Ikä: ${data.demographics.age}, Sijainti: ${data.demographics.location}, Kieli: ${data.demographics.language}, Koulutus: ${data.demographics.education}`;
  const business = `Yrityksen koko: ${data.business.companySize}, Toimiala: ${data.business.industry}, Liikevaihto: ${data.business.revenue}, Vaihe: ${data.business.stage}`;
  const painPoints = data.painPoints.filter(Boolean).join(', ');
  const goals = data.goals.filter(Boolean).join(', ');
  const behavior = `Kanavat: ${Array.isArray(data.behavior.channels) ? data.behavior.channels.join(', ') : data.behavior.channels}, Sisältö: ${data.behavior.content}, Päätöksenteko: ${data.behavior.decision}`;
  
  return `Demografia: ${demographics}. Yritys: ${business}. Haasteet: ${painPoints}. Tavoitteet: ${goals}. Käyttäytyminen: ${behavior}`;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getMonthOrder(month) {
  const monthOrder = {
    'tammikuu': 1, 'helmikuu': 2, 'maaliskuu': 3, 'huhtikuu': 4,
    'toukokuu': 5, 'kesäkuu': 6, 'heinäkuu': 7, 'elokuu': 8,
    'syyskuu': 9, 'lokakuu': 10, 'marraskuu': 11, 'joulukuu': 12
  }
  return monthOrder[month?.toLowerCase()] || 0
}

const MONTHS = [
  'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu',
  'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'
]

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
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMonth, setNewMonth] = useState('Tammikuu')
  const [newStrategy, setNewStrategy] = useState('')
  const [adding, setAdding] = useState(false)

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
        
        // --- MUUNNOS UUSI -> VANHA FORMAATTI ---
        let processedData = mockStrategy
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0]
          // ICP
          const icpData = item.icpSummary && item.icpSummary.length > 0
            ? { summary: item.icpSummary[0] }
            : null
          // Strategiat
          const strategies = Array.isArray(item.strategyAndMonth)
            ? item.strategyAndMonth.map((s, idx) => ({
                text: s.Strategy,
                month: s.Month,
                id: `${s.Month}_${idx}`
              }))
            : []
          processedData = [{
            ICP: icpData,
            strategies: strategies
          }]
        }
        // --- MUUNNOS LOPPUU ---
        
        setStrategy(processedData)
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
        // Muunnetaan lomaketiedot tekstiksi
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
        updateData = icpToText(icpData)
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
          // Hae uusimmat tiedot webhookista
          await fetchStrategy()
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

  const handleAddStrategy = async () => {
    setAdding(true)
    try {
      // Hae companyId localStoragesta
      let companyId = null
      try {
        const userRaw = JSON.parse(localStorage.getItem('user') || 'null')
        companyId = userRaw?.companyId || userRaw?.user?.companyId || null
      } catch (e) {
        console.warn('Could not parse user from localStorage:', e)
      }
      const payload = {
        month: newMonth,
        strategy: newStrategy,
        companies: companyId ? [companyId] : []
      }
      const res = await axios.post('/api/create-strategy', payload)
      if (res.data.success) {
        setShowAddModal(false)
        setNewMonth('Tammikuu')
        setNewStrategy('')
        // Hae strategiat uudestaan
        window.location.reload() // helpoin tapa, voit korvata fetchStrategy() jos haluat ilman reloadia
      } else {
        alert('Strategian lisääminen epäonnistui: ' + (res.data.error || 'Tuntematon virhe'))
      }
    } catch (e) {
      alert('Strategian lisääminen epäonnistui: ' + (e.response?.data?.error || e.message))
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <p>Ladataan...</p>

  // Ota vain ensimmäinen item strategia-arraysta
  const mainItem = Array.isArray(strategy) ? strategy[0] : strategy;
  


  return (
    <>
      <PageHeader title="Sisältöstrategia" />
      <div style={{maxWidth: 1400, padding: '0 8px', margin: '0 auto'}}>
        {/* Lisää strategia -painike */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            className="strategy-button strategy-button--brand"
            onClick={() => setShowAddModal(true)}
          >
            <span style={{fontSize: 20, lineHeight: 1}}>➕</span>
            Lisää strategia
          </button>
        </div>
        {error && <p style={{color: 'red'}}>{error}</p>}
        {mainItem && (
          <div className="content-strategy-grid">
            {/* ICP-kortti */}
            {mainItem.ICP && (
              <div className="strategy-card">
                <h2>Ihanneasiakas</h2>
                <div className={`content ${!mainItem.ICP.summary ? 'empty' : ''}`}>
                  {mainItem.ICP.summary || 'Ei kuvausta. Lisää ihanneasiakkaan kuvaus.'}
                </div>
                <button className="strategy-button" onClick={() => handleEdit(mainItem, 'icp')}>
                  Muokkaa ICP:tä
                </button>
              </div>
            )}

            {/* Strategia-kortit */}
            {mainItem.strategies && Array.isArray(mainItem.strategies) && mainItem.strategies.length > 0 ? (
              mainItem.strategies.map((strategy, index) => (
                <div key={strategy.id || index} className="strategy-card">
                  <h2>
                    {strategy.month ? capitalize(strategy.month) + ' strategia' : 'Strategia'}
                  </h2>
                  <div className={`content ${!strategy.text ? 'empty' : ''}`}>
                    {strategy.text || 'Ei strategiatekstiä. Lisää strategia.'}
                  </div>
                  <button 
                    className="strategy-button"
                    onClick={() => handleEdit({
                      ...mainItem, 
                      Strategy: strategy.text, 
                      Month: strategy.month, 
                      recordId: strategy.id
                    }, 'strategy')}
                  >
                    Muokkaa strategiaa
                  </button>
                </div>
              ))
            ) : (
              <div className="strategy-card">
                <h2>Strategia</h2>
                <div className="content empty">Ei strategiatekstiä. Lisää strategia.</div>
                <button className="strategy-button" onClick={() => handleEdit(mainItem, 'strategy')}>
                  Muokkaa strategiaa
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Uuden strategian lisäysmodaali */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: '100%',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{marginTop: 0}}>Lisää uusi strategia</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>Kuukausi</label>
              <select
                value={newMonth}
                onChange={e => setNewMonth(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}
              >
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500, marginBottom: 4, display: 'block' }}>Strategiateksti</label>
              <textarea
                value={newStrategy}
                onChange={e => setNewStrategy(e.target.value)}
                rows={6}
                style={{ width: '100%', borderRadius: 6, border: '1px solid #d1d5db', padding: 8 }}
                placeholder="Kirjoita strategia tähän..."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer' }}
                disabled={adding}
              >
                Peruuta
              </button>
              <button
                onClick={handleAddStrategy}
                style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                disabled={adding || !newStrategy}
              >
                {adding ? 'Tallennetaan...' : 'Tallenna'}
              </button>
            </div>
          </div>
        </div>
      )}

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