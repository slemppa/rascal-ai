import React, { useEffect, useState } from 'react'
import axios from 'axios'

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
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const textareaRef = React.useRef(null)

  useEffect(() => {
    const fetchStrategy = async () => {
      try {
        setLoading(true)
        setError(null)
        // Voit hakea companyId:n localStoragesta tai muualta, tässä esimerkissä ei käytetä
        const data = await getStrategy()
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
  }, [editText, editId])

  const handleEdit = (item) => {
    setEditId(item.id)
    setEditText(item.Strategy)
  }

  const handleSave = async (item) => {
    try {
      const updated = { ...item, Strategy: editText, updateType: 'strategyUpdate' }
      await axios.post('/api/strategy', updated)
      setStrategy(strategy.map(s => s.id === item.id ? updated : s))
      setEditId(null)
    } catch (e) {
      alert('Tallennus epäonnistui')
    }
  }

  if (loading) return <p>Ladataan...</p>

  return (
    <>
      <div style={{
        background: 'var(--brand-dark)',
        color: '#fff',
        borderBottom: '1px solid #e2e8f0',
        paddingTop: 32,
        paddingBottom: 24
      }}>
        <h1 style={{margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1.2}}>Sisältöstrategia</h1>
      </div>
      <div style={{maxWidth: 1100, padding: '0 8px'}}>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <div style={{display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 32}}>
          {strategy.map(item => (
            <div key={item.id} style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              border: '1px solid #e1e8ed',
              padding: 24,
              minWidth: 320,
              maxWidth: 600,
              width: 'auto',
              position: 'relative',
              marginBottom: 24
            }}>
              <div style={{fontWeight: 700, fontSize: 20, marginBottom: 8}}>{item.Month}</div>
              <div style={{marginBottom: 8, color: '#888', fontSize: 13}}>Yrityksiä: {item.Companies?.length || 0}</div>
              {editId === item.id ? (
                <>
                  <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 40,
                      marginBottom: 12,
                      resize: 'none',
                      overflow: 'hidden',
                      fontSize: 16,
                      lineHeight: 1.5,
                      borderRadius: 8,
                      border: '1.5px solid #e1e8ed',
                      background: '#f7fafc',
                      padding: '12px 14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button onClick={() => handleSave(item)} style={{marginRight: 8, background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, cursor: 'pointer'}}>Tallenna</button>
                  <button onClick={() => setEditId(null)} style={{background: '#eee', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, cursor: 'pointer'}}>Peruuta</button>
                </>
              ) : (
                <>
                  <div style={{marginBottom: 12, whiteSpace: 'pre-line'}}>{item.Strategy}</div>
                  <button onClick={() => handleEdit(item)} style={{position: 'absolute', top: 16, right: 16, background: 'var(--brand-green)', color: 'var(--brand-black)', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, cursor: 'pointer'}}>Muokkaa</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
} 