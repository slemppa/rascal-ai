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
  const [icpText, setIcpText] = useState('')
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
            ? { 
                summary: item.icpSummary[0],
                recordId: item.icpSummaryRecordId || null // Säilytä recordId
              }
            : null
          // Strategiat
          const strategies = Array.isArray(item.strategyAndMonth)
            ? item.strategyAndMonth.map((s, idx) => {
                // N8N palauttaa recordId:n oikeassa muodossa, käytä sitä suoraan
                const recordId = s.recordId || s.id || s.record_id || null
                
                return {
                  text: s.Strategy,
                  month: s.Month,
                  id: recordId || `${s.Month}_${idx}`, // Käytä recordId:tä jos saatavilla
                  recordId: recordId // Säilytä recordId
                }
              })
            : []
          processedData = [{
            ICP: icpData,
            strategies: strategies,
            recordId: item.recordId || null // Säilytä päärecordId
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
        setIcpText('')
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [])



  const handleEdit = (item, type = 'strategy') => {
    setEditingItem(item)
    setEditType(type)
    if (type === 'strategy') {
    setEditText(item.Strategy)
    } else if (type === 'icp') {
      // Täytetään tekstikenttä olemassa olevalla tekstillä
      if (item.ICP && item.ICP.summary) {
        setIcpText(item.ICP.summary)
      } else {
        setIcpText('')
      }
    }
    setShowModal(true)
  }

  const handleSave = async (item) => {
    try {
      let updateData
      let updateType
      let action = 'update'

      if (editType === 'strategy') {
        if (!item.recordId) {
          alert('Record ID puuttuu - ei voi päivittää strategiaa')
          return
        }
        updateData = editText
        updateType = 'strategy'
      } else if (editType === 'icp') {
        // Käytä tekstikentän sisältöä suoraan
        updateData = icpText
        updateType = 'icp'
        
        // ICP:n recordId on companyId, joten aina käytetään 'update' actionia
        if (!item.recordId) {
          alert('Company ID puuttuu - ei voi päivittää ICP:tä')
          return
        }
      } else {
        alert('Virheellinen päivitystyyppi')
        return
      }

      // Päivitä N8N webhookin kautta
      const payload = {
        updateType: 'strategyUpdate',
        action: action,
        type: updateType,
        data: updateData
      }
      
      // Lisää id suoraan payload:iin, ei payload.id:hen
      if (item.recordId) {
        payload.id = item.recordId
      }
      
      console.log('Lähetetään strategy payload:', payload)
      const response = await axios.post('/api/update-post.js', payload)
      console.log('Strategy response:', response.data)

      // Hyväksy onnistuneeksi jos ei erroria ja status 200
      if ((response.data.success || (response.status === 200 && !response.data.error))) {
        window.location.reload() // Lataa sivu uudestaan päivittääksesi datan
        setShowModal(false)
        setEditingItem(null)
        setEditText('')
        alert('Päivitys onnistui!')
      } else {
        alert('Päivitys epäonnistui: ' + (response.data.error || 'Tuntematon virhe'))
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
        updateType: 'strategyUpdate',
        action: 'create',
        month: newMonth,
        strategy: newStrategy,
        companies: companyId ? [companyId] : []
      }
      const res = await axios.post('/api/update-post.js', payload)
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
                <button className="strategy-button" onClick={() => {
                  // Hae companyId localStoragesta ICP:n recordId:ksi
                  let companyId = null
                  try {
                    const userRaw = JSON.parse(localStorage.getItem('user') || 'null')
                    companyId = userRaw?.companyId || userRaw?.user?.companyId || null
                  } catch (e) {
                    console.warn('Could not parse user from localStorage:', e)
                  }
                  
                  handleEdit({
                    ...mainItem,
                    recordId: companyId
                  }, 'icp')
                }}>
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
                      recordId: strategy.recordId || strategy.id
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
            setIcpText('')
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
                  setIcpText('')
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
                  <div>
                    <h4 style={{margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: '#374151'}}>ICP kuvaus</h4>
                    <textarea
                      value={icpText}
                      onChange={e => setIcpText(e.target.value)}
                      rows={12}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: 14,
                        lineHeight: 1.5,
                        resize: 'vertical'
                      }}
                      placeholder="Kirjoita ihanneasiakkaan kuvaus tähän..."
                    />
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
                  setIcpText('')
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