import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { Trans, t } from '@lingui/macro'

export default function AIChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('chat')
  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState('')
  const messagesEndRef = useRef(null)
  const [threadId, setThreadId] = useState(() => localStorage.getItem('rascalai_threadId') || null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([]);

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
    console.log('AIChatPage: Haetaan tiedostoja companyId:', companyId)
    axios.post('/api/vector-store-files', { companyId, action: 'listFiles' })
      .then(res => {
        console.log('AIChatPage: API palautti datan:', res.data)
        console.log('AIChatPage: Data on array:', Array.isArray(res.data))
        console.log('AIChatPage: Data pituus:', Array.isArray(res.data) ? res.data.length : 'ei array')
        setFiles(Array.isArray(res.data) ? res.data : [])
      })
      .catch((error) => {
        console.error('AIChatPage: Virhe tiedostojen haussa:', error)
        setFilesError(t`Tiedostojen haku epäonnistui`)
      })
      .finally(() => setFilesLoading(false))
  }, [tab, companyId])

  // Hae viestihistoria kun threadId löytyy
  useEffect(() => {
    if (threadId) {
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
      axios.post('https://samikiias.app.n8n.cloud/webhook/ab7de54b-9f81-4b26-8421-c8de56f8e89e/chat', {
        threadId,
        action: 'getHistory',
        companyId,
        assistantId
      }).then(res => {
        if (Array.isArray(res.data.messages)) {
          setMessages(res.data.messages)
        }
      })
    }
  }, [threadId, companyId])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const userMessage = { role: 'user', text: input }
    setMessages(msgs => [...msgs, userMessage])
    setInput('')
    setLoading(true)
    try {
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
        threadId,
        action: 'chat'
      })
      // Tallenna mahdollinen uusi threadId
      if (res.data?.threadId && res.data.threadId !== threadId) {
        setThreadId(res.data.threadId)
        localStorage.setItem('rascalai_threadId', res.data.threadId)
      }
      const aiText = res.data?.reply || res.data?.message || res.data?.output || res.data?.response || res.data?.text || t`AI ei vastannut.`
      setMessages(msgs => [...msgs, { role: 'ai', text: aiText }])
    } catch (err) {
      setMessages(msgs => [...msgs, { role: 'ai', text: t`AI ei vastannut.` }])
    } finally {
      setLoading(false)
    }
  }

  // Tyylikäs välilehtipalkki
  const tabList = [
    { key: 'chat', label: t`Chat` },
    { key: 'tietokanta', label: t`Tietokanta` }
  ]

  // Loading-indikaattori komponentti
  const LoadingIndicator = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '16px 20px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      maxWidth: 'fit-content',
      marginBottom: 16,
      alignSelf: 'flex-start',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <div style={{
        display: 'flex',
        gap: 4
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#3b82f6',
              animation: `bounce 1.4s ease-in-out infinite both`,
              animationDelay: `${i * 0.16}s`
            }}
          />
        ))}
      </div>
      <span style={{
        fontSize: 15,
        color: '#64748b',
        fontWeight: 500,
        marginLeft: 4
      }}>
        <Trans>AI kirjoittaa...</Trans>
      </span>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      boxSizing: 'border-box',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      padding: 0,
      margin: 0,
      minWidth: 0,
      width: '100%'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        margin: 0,
        borderRadius: 0,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: 'none',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        flex: 1,
        position: 'static'
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--brand-dark)',
          padding: '32px 8px 24px 8px',
          color: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          margin: 0
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: -0.5,
            lineHeight: 1.2
          }}>
            <Trans>{companyName} markkinointiassistentti</Trans>
          </h2>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: 16,
            color: '#cbd5e1',
            fontWeight: 400
          }}>
            <Trans>Kysy mitä tahansa markkinointiin liittyvää</Trans>
          </p>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', width: '100%', flex: 1}}>
          {/* Välilehtipalkki */}
          <div style={{
            display: 'flex', 
            gap: 4, 
            padding: '0 8px', 
            margin: '24px 0 0 0', 
            borderBottom: '2px solid #f1f5f9',
            background: '#ffffff'
          }}>
            {tabList.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '16px 32px',
                  fontSize: 16,
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '12px 12px 0 0',
                  background: tab === t.key ? '#3b82f6' : 'transparent',
                  color: tab === t.key ? '#ffffff' : '#64748b',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  borderBottom: tab === t.key ? '3px solid #3b82f6' : '3px solid transparent',
                  marginBottom: -2,
                  position: 'relative',
                  boxShadow: tab === t.key ? '0 4px 12px rgba(59,130,246,0.15)' : 'none'
                }}
                onMouseOver={e => { 
                  if (tab !== t.key) {
                    e.currentTarget.style.background = '#f1f5f9'
                    e.currentTarget.style.color = '#475569'
                  }
                }}
                onMouseOut={e => { 
                  if (tab !== t.key) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#64748b'
                  }
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Sisältö */}
          {tab === 'chat' && (
            <div style={{
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%',
              background: '#fafafa'
            }}>
              {/* Chat-alue */}
              <div style={{
                flex: 1, 
                overflowY: 'auto', 
                margin: 0, 
                padding: '24px 8px', 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                background: '#fafafa'
              }}>
                {messages.length === 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#64748b',
                    textAlign: 'center',
                    padding: '40px 20px'
                  }}>
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 24,
                      boxShadow: '0 8px 32px rgba(59,130,246,0.2)'
                    }}>
                      <span style={{fontSize: 32, color: '#ffffff'}}>💬</span>
                    </div>
                    <h3 style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#1e293b',
                      margin: '0 0 8px 0'
                    }}>
                      <Trans>Tervetuloa chat-keskusteluun!</Trans>
                    </h3>
                    <p style={{
                      fontSize: 16,
                      color: '#64748b',
                      margin: 0,
                      maxWidth: 400,
                      lineHeight: 1.5
                    }}>
                      <Trans>Aloita keskustelu kirjoittamalla viesti alle. Voin auttaa sinua markkinointiin liittyvissä kysymyksissä.</Trans>
                    </p>
                  </div>
                )}
                
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 16,
                    animation: 'fadeInUp 0.3s ease-out'
                  }}>
                    <div style={{
                      background: msg.role === 'user' 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                        : '#ffffff',
                      color: msg.role === 'user' ? '#ffffff' : '#1e293b',
                      borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      padding: '16px 20px',
                      maxWidth: '75%',
                      boxShadow: msg.role === 'user' 
                        ? '0 4px 16px rgba(59,130,246,0.2)' 
                        : '0 2px 12px rgba(0,0,0,0.08)',
                      border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                      fontSize: 15,
                      lineHeight: 1.5,
                      wordWrap: 'break-word'
                    }}>
                      {msg.role === 'ai' ? (
                        <ReactMarkdown style={{
                          '& p': { margin: '0 0 8px 0' },
                          '& p:last-child': { margin: 0 },
                          '& code': {
                            background: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: '0.9em',
                            color: '#475569'
                          },
                          '& pre': {
                            background: '#f8fafc',
                            padding: 12,
                            borderRadius: 8,
                            overflow: 'auto',
                            border: '1px solid #e2e8f0'
                          }
                        }}>
                          {msg.text}
                        </ReactMarkdown>
                      ) : (
                        <span style={{ whiteSpace: 'pre-line' }}>{msg.text}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {loading && <LoadingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input-alue */}
              <div style={{
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                padding: '24px 8px',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
              }}>
                <form onSubmit={handleSend} style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-end'
                }}>
                  <div style={{
                    flex: 1,
                    position: 'relative'
                  }}>
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder={t`Kirjoita viesti...`}
                      style={{
                        width: '100%',
                        fontSize: 16,
                        padding: '16px 20px',
                        borderRadius: '25px',
                        border: '2px solid #e2e8f0',
                        outline: 'none',
                        background: '#ffffff',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box',
                        resize: 'none',
                        minHeight: 52,
                        fontFamily: 'inherit'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#3b82f6'
                        e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e2e8f0'
                        e.target.style.boxShadow = 'none'
                      }}
                      disabled={loading}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    style={{
                      padding: '16px 24px',
                      borderRadius: '25px',
                      background: input.trim() && !loading 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                        : '#e2e8f0',
                      color: input.trim() && !loading ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                      fontSize: 16,
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      boxShadow: input.trim() && !loading 
                        ? '0 4px 16px rgba(59,130,246,0.3)' 
                        : 'none',
                      minWidth: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                    onMouseOver={e => {
                      if (input.trim() && !loading) {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.4)'
                      }
                    }}
                    onMouseOut={e => {
                      if (input.trim() && !loading) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.3)'
                      }
                    }}
                  >
                    <span>💬</span>
                    <Trans>Lähetä</Trans>
                  </button>
                </form>
              </div>
            </div>
          )}

          {tab === 'tietokanta' && (
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'stretch',
              gap: 40,
              width: '100%',
              background: 'transparent',
              marginTop: 32,
              padding: '40px 0 80px 0'
            }}>
              {/* Vasemmalle tiedoston lisäyslomake */}
              <div style={{
                flex: 1,
                minWidth: 0,
                background: '#fff',
                borderRadius: 18,
                boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
                border: '1.5px solid #e1e8ed',
                padding: 32,
                alignItems: 'stretch',
                marginTop: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                height: 'auto',
                minHeight: 0
              }}>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setUploadError('');
                    setUploadSuccess('');
                    setUploadLoading(true);
                    const formData = new FormData();
                    selectedFiles.forEach(file => formData.append('file', file));
                    try {
                      const res = await fetch('/api/upload-knowledge', {
                        method: 'POST',
                        body: formData,
                      });
                      if (!res.ok) throw new Error('Lähetys epäonnistui');
                      setUploadSuccess('Tiedostot lähetetty!');
                      setSelectedFiles([]);
                      e.target.reset();
                    } catch (err) {
                      setUploadError('Tiedostojen lähetys epäonnistui');
                    } finally {
                      setUploadLoading(false);
                    }
                  }}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}
                >
                  <div style={{fontWeight: 700, fontSize: 19, marginBottom: 2, color: '#1e293b', letterSpacing: 0.1}}>Lisää tiedosto tietokantaan</div>
                  <div style={{fontSize: 15, color: '#64748b', marginBottom: 2}}>Voit liittää PDF-, Word- tai tekstimuotoisen tiedoston. Tiedosto tallennetaan yrityksesi tietokantaan.</div>
                  <label htmlFor="file-upload" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: '#f7fafc',
                    border: '1.5px dashed #2563eb',
                    borderRadius: 10,
                    padding: '18px 18px',
                    fontWeight: 600,
                    color: '#2563eb',
                    fontSize: 16,
                    cursor: 'pointer',
                    transition: 'border 0.2s',
                    marginBottom: 0,
                    width: '100%'
                  }}>
                    <span style={{fontSize: 22}}>📄</span>
                    <span>Valitse tiedostot</span>
                    <input
                      id="file-upload"
                      type="file"
                      name="file"
                      multiple
                      required
                      style={{display: 'none'}}
                      onChange={e => setSelectedFiles(Array.from(e.target.files))}
                    />
                  </label>
                  {/* Näytä valitut tiedostot */}
                  {selectedFiles.length > 0 && (
                    <ul style={{margin: '8px 0 0 0', padding: 0, listStyle: 'none', color: '#2563eb', fontWeight: 600, fontSize: 15}}>
                      {selectedFiles.map((file, i) => (
                        <li key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0'}}>
                          <span>{file.name} ({Math.round(file.size/1024)} kt)</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFiles(selectedFiles.filter((_, index) => index !== i))}
                            style={{
                              background: 'transparent',
                              color: '#ef4444',
                              border: 'none',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 'bold',
                              marginLeft: 8
                            }}
                            title="Poista tiedosto"
                          >
                            ❌
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="submit" style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '14px 0',
                    fontWeight: 700,
                    fontSize: 17,
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(37,99,235,0.10)',
                    marginTop: 4,
                    transition: 'background 0.18s, box-shadow 0.18s',
                    width: '100%'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#1d4ed8'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'; }}
                  >
                    {uploadLoading ? 'Lähetetään...' : 'Lähetä tiedostot'}
                  </button>
                  {uploadSuccess && <div style={{
                    color: '#22c55e',
                    fontWeight: 600,
                    fontSize: 15,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 8,
                    padding: '10px 16px',
                    marginTop: 2,
                    width: '100%'
                  }}>{uploadSuccess}</div>}
                  {uploadError && <div style={{
                    color: '#e53e3e',
                    fontWeight: 600,
                    fontSize: 15,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    padding: '10px 16px',
                    marginTop: 2,
                    width: '100%'
                  }}>{uploadError}</div>}
                </form>
              </div>
              {/* Oikealle tiedostolista taulukkomaisena */}
              <div style={{
                flex: 2,
                minWidth: 0,
                background: '#ffffff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                padding: '32px 24px',
                minHeight: 320,
                maxHeight: '70vh',
                height: 'auto',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: 20,
                  marginBottom: 24,
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{fontSize: 24}}>📁</span>
                  <Trans>Tiedostot</Trans>
                </div>
                {/* Taulukko-otsikko */}
                <div style={{
                  display: 'flex',
                  fontWeight: 600,
                  fontSize: 15,
                  color: '#64748b',
                  borderBottom: '2px solid #e2e8f0',
                  paddingBottom: 8,
                  marginBottom: 8
                }}>
                  <div style={{flex: 2}}>Tiedostonimi</div>
                  <div style={{flex: 1, textAlign: 'right'}}>Koko</div>
                  <div style={{flex: 1, textAlign: 'right'}}>Päivämäärä</div>
                </div>
                {/* Tiedostorivit */}
                {files.length === 0 && (
                  <div style={{color: '#64748b', textAlign: 'center', padding: '40px 20px'}}>
                    <div style={{fontSize: 48, marginBottom: 16}}>📄</div>
                    <Trans>Ei tiedostoja</Trans>
                  </div>
                )}
                <div style={{flex: 1, overflowY: 'auto'}}>
                  {files.slice(0, showAllFiles ? files.length : 10).map((file, i) => {
                    const sizeKb = file.bytes ? Math.round(file.bytes / 1024) : '-';
                    const date = file.created_at ? new Date(file.created_at * 1000) : null;
                    const dateStr = date ? `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth()+1).toString().padStart(2, '0')}.${date.getFullYear()}` : '-';
                    return (
                      <div key={file.id || i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: '1px solid #f1f5f9',
                        padding: '10px 0',
                        fontSize: 15
                      }}>
                        <div style={{flex: 2, color: '#3b82f6', fontWeight: 600, wordBreak: 'break-all'}}>
                          {file.filename || file.name || file.id || 'Nimetön tiedosto'}
                        </div>
                        <div style={{flex: 1, textAlign: 'right', color: '#64748b'}}>
                          {sizeKb} kt
                        </div>
                        <div style={{flex: 1, textAlign: 'right', color: '#64748b', paddingLeft: 16}}>
                          {dateStr}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Näytä lisää -painike */}
                {files.length > 10 && !showAllFiles && (
                  <button onClick={() => setShowAllFiles(true)} style={{
                    marginTop: 16,
                    alignSelf: 'center',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(59,130,246,0.10)'
                  }}>
                    Näytä lisää
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
} 