import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

export default function AIChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('chat')
  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState('')
  const messagesEndRef = useRef(null)

  // Hae companyName ja companyId localStoragesta
  let companyName = 'Yrityksen';
  let companyId = null;
  try {
    const userRaw = JSON.parse(localStorage.getItem('user') || 'null')
    if (userRaw && userRaw.user && userRaw.user.companyName) {
      companyName = userRaw.user.companyName
      companyId = userRaw.user.companyId
    } else if (userRaw && userRaw.companyName) {
      companyName = userRaw.companyName
      companyId = userRaw.companyId
    }
  } catch (e) {}

  // Vieritä alas aina kun viestit päivittyvät
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Hae tiedostot kun tietokanta-välilehti avataan
  useEffect(() => {
    if (tab !== 'tietokanta') return
    setFilesLoading(true)
    setFilesError('')
    axios.post('/api/vector-store-files', { companyId, action: 'listFiles' })
      .then(res => {
        setFiles(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => setFilesError('Tiedostojen haku epäonnistui'))
      .finally(() => setFilesLoading(false))
  }, [tab, companyId])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const userMessage = { role: 'user', text: input }
    setMessages(msgs => [...msgs, userMessage])
    setInput('')
    setLoading(true)
    try {
      // Hae companyId ja assistantId localStoragesta/user-objektista
      let assistantId = null
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        assistantId = user.assistantId || null
      } catch (e) {}
      if (!assistantId) {
        try {
          assistantId = localStorage.getItem('assistantId') || null
        } catch (e) {}
      }
      const res = await axios.post('https://samikiias.app.n8n.cloud/webhook/ab7de54b-9f81-4b26-8421-c8de56f8e89e/chat', {
        message: input,
        companyId,
        assistantId,
      })
      // Ota AI:n vastaus oikeasta kentästä
      const aiText = res.data?.reply || res.data?.message || res.data?.output || res.data?.response || res.data?.text || 'AI ei vastannut.'
      setMessages(msgs => [...msgs, { role: 'ai', text: aiText }])
    } catch (err) {
      setMessages(msgs => [...msgs, { role: 'ai', text: 'AI ei vastannut.' }])
    } finally {
      setLoading(false)
    }
  }

  // Tyylikäs välilehtipalkki
  const tabList = [
    { key: 'chat', label: 'Chat' },
    { key: 'tietokanta', label: 'Tietokanta' }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{
        background: '#fff',
        maxWidth: 700,
        width: '100%',
        margin: '40px auto',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1.5px solid #e1e8ed',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 500,
      }}>
        <h2 style={{margin: '32px 0 0 0', paddingLeft: 36, paddingBottom: 0, flexShrink: 0, fontSize: 28, fontWeight: 800, color: '#222', letterSpacing: 0.2}}>{companyName} markkinointiassistentti</h2>
        <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
          {/* Välilehtipalkki */}
          <div style={{display: 'flex', gap: 8, paddingLeft: 28, margin: '22px 0 0 0', borderBottom: '1.5px solid #e1e8ed'}}>
            {tabList.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '10px 28px',
                  fontSize: 17,
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '18px 18px 0 0',
                  background: tab === t.key ? '#2563eb' : 'transparent',
                  color: tab === t.key ? '#fff' : '#2563eb',
                  boxShadow: tab === t.key ? '0 2px 8px rgba(37,99,235,0.10)' : 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.18s',
                  borderBottom: tab === t.key ? '2.5px solid #2563eb' : '2.5px solid transparent',
                  marginBottom: -1.5,
                }}
                onMouseOver={e => { if (tab !== t.key) e.currentTarget.style.background = '#e6f0ff' }}
                onMouseOut={e => { if (tab !== t.key) e.currentTarget.style.background = 'transparent' }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Sisältö */}
          {tab === 'chat' && (
            <>
              <div style={{flex: 1, overflowY: 'auto', margin: 0, padding: '0 36px 32px 36px', display: 'flex', flexDirection: 'column', height: '100%'}}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    background: msg.role === 'user' ? '#e6f0ff' : '#f5f5f5',
                    color: '#222',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 8,
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                    whiteSpace: 'pre-line',
                    fontSize: 16,
                  }}>
                    {msg.role === 'ai' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
                  </div>
                ))}
                {loading && (
                  <div style={{color: '#888', fontStyle: 'italic', marginBottom: 8}}>AI kirjoittaa...</div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} style={{width: '100%', margin: 0, display: 'flex', gap: 8, padding: '0 36px 36px 36px', background: '#fff', borderTop: '1px solid #e1e8ed', boxSizing: 'border-box', flexShrink: 0}}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Kirjoita viesti..."
                  style={{flex: 1, fontSize: 17, padding: '12px 16px', borderRadius: 8, border: '1px solid #cfd8dc', outline: 'none'}}
                  disabled={loading}
                />
                <button type="submit" style={{fontSize: 17, padding: '12px 24px', borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer'}} disabled={loading || !input.trim()}>
                  Lähetä
                </button>
              </form>
            </>
          )}
          {tab === 'tietokanta' && (
            <div style={{display: 'flex', flexDirection: 'row', width: '100%', minHeight: 400, background: 'transparent', marginTop: 24}}>
              {/* Vasemmalle placeholder, oikealle tiedostolista */}
              <div style={{flex: 1, minWidth: 0, padding: '0 0 0 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start'}}>
                {/* Tähän voi lisätä tiedoston lisäyksen */}
              </div>
              <div style={{width: 420, background: '#f8fafc', borderRadius: 14, border: '1.5px solid #e1e8ed', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '28px 18px 18px 28px', marginRight: 32, minHeight: 320, maxHeight: 540, overflowY: 'auto'}}>
                <div style={{fontWeight: 700, fontSize: 19, marginBottom: 18, color: '#222'}}>Tiedostot</div>
                {filesLoading && <div style={{color: '#2563eb', fontWeight: 500}}>Ladataan tiedostoja...</div>}
                {filesError && <div style={{color: '#e53e3e', fontWeight: 600}}>{filesError}</div>}
                {!filesLoading && !filesError && files.length === 0 && <div style={{color: '#888'}}>Ei tiedostoja</div>}
                <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                  {files.map((file, i) => (
                    <li key={file.id || i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e1e8ed'}}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        <span style={{fontWeight: 600, color: '#2563eb', fontSize: 16, wordBreak: 'break-all'}}>{file.name || file.filename || file.title || 'Nimetön tiedosto'}</span>
                        {file.uploaded && <span style={{fontSize: 13, color: '#888'}}>{file.uploaded}</span>}
                      </div>
                      {/* Poistoikoni tms. myöhemmin */}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 