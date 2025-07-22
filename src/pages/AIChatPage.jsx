import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'

export default function AIChatPage() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('rascalai_chat_messages')
    return saved ? JSON.parse(saved) : []
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('chat')
  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState('')
  const [threadId, setThreadId] = useState(() => localStorage.getItem('rascalai_threadId') || null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const dropRef = useRef(null)
  const [monthlyLimitReached, setMonthlyLimitReached] = useState(false)
  const [postsThisMonth, setPostsThisMonth] = useState(0)

  // Hae companyName, companyId, assistantId localStoragesta
  let companyName = 'Yrityksen';
  let companyId = null;
  let assistantId = null;
  try {
    const userRaw = JSON.parse(localStorage.getItem('user') || 'null')
    if (userRaw && userRaw.user && userRaw.user.companyName) {
      companyName = userRaw.user.companyName
      companyId = userRaw.user.companyId
      assistantId = userRaw.user.assistantId
    } else if (userRaw && userRaw.companyName) {
      companyName = userRaw.companyName
      companyId = userRaw.companyId
      assistantId = userRaw.assistantId
    }
  } catch (e) {}

  // Vieritä alas aina kun viestit päivittyvät (column-reverse hoitaa, joten ei tarvita)
  // useEffect ei enää tarpeen

  // Hae tiedostot kun tietokanta-välilehti avataan
  useEffect(() => {
    if (tab === 'files' && files.length === 0) {
      fetchFiles()
    }
  }, [tab])

  // Tarkista kuukausirajoitus
  useEffect(() => {
    const checkMonthlyLimit = async () => {
      try {
        const companyId = JSON.parse(localStorage.getItem('user') || 'null')?.companyId
        if (!companyId) return

        const url = `/api/get-posts${companyId ? `?companyId=${companyId}` : ''}`
        const response = await fetch(url)
        const data = await response.json()
        
        // Oikea datan purku - sama logiikka kuin muissa sivuissa
        const all = Array.isArray(data?.[0]?.data) ? data[0].data : [];
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        const postsThisMonth = all.filter(post => {
          // Suodata pois slide-tiedostot (joilla on "Slide No." -kenttä)
          if (post["Slide No."]) return false
          
          const date = post["createdTime"] ? new Date(post["createdTime"]) : null
          return date && date.getMonth() === currentMonth && date.getFullYear() === currentYear
        }).length
        
        const monthlyLimit = 30
        setPostsThisMonth(postsThisMonth)
        setMonthlyLimitReached(postsThisMonth >= monthlyLimit)
      } catch (error) {
        console.error('Virhe kuukausirajoituksen tarkistuksessa:', error)
      }
    }
    
    checkMonthlyLimit()
  }, [])

  // Apufunktiot tiedostokoon ja päivämäärän muotoiluun
  function formatBytes(bytes) {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' t'
    return (bytes / 1024).toFixed(1).replace('.', ',') + ' kt'
  }
  function formatDate(ts) {
    if (!ts) return '-'
    const d = new Date(ts * 1000)
    return d.toLocaleDateString('fi-FI')
  }

  const fetchFiles = async () => {
    if (!companyId) {
      setFilesError('Yrityksen ID puuttuu')
      return
    }
    setFilesLoading(true)
    setFilesError('')
    try {
      const response = await axios.post('/api/vector-store-files', { companyId }, {
        headers: { 'x-api-key': import.meta.env.N8N_SECRET_KEY }
      })
      // Tuki eri payload-rakenteille
      let arr = []
      if (Array.isArray(response.data.files)) {
        arr = response.data.files
      } else if (response.data.files && Array.isArray(response.data.files.data)) {
        arr = response.data.files.data
      } else if (Array.isArray(response.data.data)) {
        arr = response.data.data
      } else if (Array.isArray(response.data)) {
        // Jos response.data on array, tarkista onko siinä data-kenttiä
        if (response.data.length > 0 && response.data[0].data && Array.isArray(response.data[0].data)) {
          arr = response.data[0].data
        } else {
          arr = response.data
        }
      }
      setFiles(arr)
    } catch (error) {
      setFilesError('Virhe haettaessa tiedostoja')
    } finally {
      setFilesLoading(false)
        }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading || monthlyLimitReached) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post('/api/chat', {
        message: input,
        threadId: threadId,
        companyId: companyId,
        assistantId: assistantId
      })

      // Ota oikea vastausmuoto (array tai objekti)
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      const assistantMessage = { role: 'assistant', content: data.output || data.response }
      setMessages(prev => [...prev, assistantMessage])
      if (data.threadId && !threadId) {
        setThreadId(data.threadId)
        localStorage.setItem('rascalai_threadId', data.threadId)
      }
    } catch (error) {
      const errorMessage = { role: 'assistant', content: 'Virhe viestin lähettämisessä. Yritä uudelleen.' }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadLoading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      formData.append('companyId', companyId)
      formData.append('assistantId', assistantId)

      const response = await axios.post('/api/upload-knowledge', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-api-key': import.meta.env.N8N_SECRET_KEY
        }
      })

      setUploadSuccess(`${files.length} tiedosto ladattu onnistuneesti!`)
      fetchFiles() // Päivitä tiedostolista
    } catch (error) {
      setUploadError('Virhe tiedostojen lataamisessa')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleFileDeletion = async (fileId) => {
    try {
      await axios.post('/api/delete-files', {
        action: 'delete',
        companyId,
        assistantId,
        fileId
      }, {
        headers: { 'x-api-key': import.meta.env.N8N_SECRET_KEY }
      })
      setFiles(prev => prev.filter(file => file.id !== fileId))
      setSelectedFiles(prev => prev.filter(id => id !== fileId))
    } catch (error) {
      console.error('Virhe tiedoston poistamisessa:', error)
    }
  }

  // Drag & drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files.filter(f => !prev.some(p => p.name === f.name && p.size === f.size))])
    }
  }
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files.filter(f => !prev.some(p => p.name === f.name && p.size === f.size))])
    }
  }
  const handleRemovePending = (name, size) => {
    setPendingFiles(prev => prev.filter(f => !(f.name === name && f.size === size)))
  }
  const handleUploadPending = async () => {
    if (pendingFiles.length === 0) return
    setUploadLoading(true)
    setUploadError('')
    setUploadSuccess('')
    try {
      const formData = new FormData()
      pendingFiles.forEach(file => formData.append('files', file))
      formData.append('action', 'feed')
      formData.append('companyId', companyId)
      formData.append('assistantId', assistantId)
      await axios.post('/api/upload-knowledge', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-api-key': import.meta.env.N8N_SECRET_KEY
        }
      })
      setUploadSuccess(`${pendingFiles.length} tiedosto(a) ladattu onnistuneesti!`)
      setPendingFiles([])
      fetchFiles()
    } catch (error) {
      setUploadError('Virhe tiedostojen lataamisessa')
    } finally {
      setUploadLoading(false)
    }
  }

  // UUSI: Assistentin tiedostojen lisäys (POST + action)
  async function uploadAssistantKnowledgeFiles({ files, assistantId, companyId }) {
    const formData = new FormData()
    Array.from(files).forEach(file => formData.append('files', file))
    formData.append('action', 'feed')
    formData.append('companyId', companyId)
    formData.append('assistantId', assistantId)
    return axios.post('/api/upload-knowledge', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'x-api-key': import.meta.env.N8N_SECRET_KEY
      }
    })
  }

  // UUSI: Assistentin tiedoston poisto (POST + action)
  async function deleteAssistantKnowledgeFile({ fileId, assistantId, companyId }) {
    return axios.post('/api/delete-files', {
      action: 'delete',
      companyId,
      assistantId,
      fileId
    }, {
      headers: { 'x-api-key': import.meta.env.N8N_SECRET_KEY }
    })
  }

  // Tyhjennä keskustelu
  const handleNewChat = () => {
    setMessages([])
    localStorage.removeItem('rascalai_chat_messages')
    setThreadId(null)
    localStorage.removeItem('rascalai_threadId')
  }

  useEffect(() => {
    localStorage.setItem('rascalai_chat_messages', JSON.stringify(messages))
  }, [messages])

  return (
    <>
      <PageHeader title={tab === 'chat' ? 'Keskustelu' : 'Tietokanta'} />
      <div className="ai-chat-wrapper" style={{ flex: 1, minHeight: 0 }}>
        {/* Välilehdet */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          background: '#f9fafb',
          flexShrink: 0,
          padding: '0 32px',
          gap: 0,
          height: 48,
          margin: 0
        }}>
          <Button
            onClick={() => setTab('chat')}
            style={{
              flex: 1,
              height: '100%',
              borderRadius: 0,
              outline: 'none',
              boxShadow: 'none',
              margin: 0,
              padding: 0
            }}
            variant={tab === 'chat' ? 'primary' : 'secondary'}
          >
            Keskustelu
          </Button>
          <Button
            onClick={() => setTab('files')}
            style={{
              flex: 1,
              height: '100%',
              borderRadius: 0,
              outline: 'none',
              boxShadow: 'none',
              margin: 0,
              padding: 0
            }}
            variant={tab === 'files' ? 'primary' : 'secondary'}
          >
            Tietokanta ({files.length})
          </Button>
        </div>
        {/* Sisältö */}
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          margin: 0,
          padding: 0
        }}>
          {tab === 'chat' ? (
            <div style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              margin: 0,
              padding: 0
            }}>
              {/* Viestit */}
              <div style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                margin: 0,
                padding: 0
              }}>
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  gap: 12,
                  margin: 0,
                  padding: 24,
                  width: '100%'
                }}>
                  {(() => {
                    const list = [...messages]
                    if (loading) {
                      list.push({ role: 'assistant', content: 'Kirjoittaa…', temp: true })
                    }
                    return list.slice().reverse().map((message, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                      }}>
                        <div style={{
                          maxWidth: '85%',
                          padding: '12px 16px',
                          borderRadius: 8,
                          background: message.role === 'user' ? '#2563eb' : '#fff',
                          color: message.role === 'user' ? '#fff' : '#1f2937',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                          lineHeight: 1.5,
                          overflowWrap: 'break-word',
                          fontSize: 16
                        }}>
                          {message.temp ? (
                            message.content
                          ) : message.role === 'assistant' ? (
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          ) : (
                            message.content
                          )}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
              {/* Kuukausirajoituksen varoitus */}
              {monthlyLimitReached && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '12px 16px',
                  margin: '0 24px 12px 24px',
                  color: '#dc2626',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  ⚠️ Kuukausirajoitus saavutettu ({postsThisMonth}/30). Et voi luoda uusia julkaisuja tässä kuussa.
                </div>
              )}
              
              {/* Syöttökenttä ja uusi keskustelu -ikoni */}
              <form onSubmit={handleSendMessage} style={{
                height: 'auto',
                minHeight: 56,
                borderTop: '1.5px solid #e5e7eb',
                background: '#fff',
                flexShrink: 0,
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                padding: '12px 24px',
                margin: 0,
                flexWrap: 'wrap'
              }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={monthlyLimitReached ? "Kuukausirajoitus saavutettu" : "Kirjoita viestisi..."}
                  disabled={loading || monthlyLimitReached}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: 16,
                    outline: 'none',
                    margin: 0,
                    opacity: monthlyLimitReached ? 0.6 : 1
                  }}
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim() || monthlyLimitReached}
                  style={{ margin: 0, whiteSpace: 'nowrap' }}
                >
                  {monthlyLimitReached ? 'Rajoitettu' : 'Lähetä'}
                </Button>
                <Button
                  type="button"
                  onClick={handleNewChat}
                  title="Aloita uusi keskustelu"
                  style={{ margin: 0, whiteSpace: 'nowrap', padding: '10px 14px', background: '#e5e7eb', color: '#2563eb', fontSize: 20 }}
                  variant="secondary"
                >
                  <span role="img" aria-label="Uusi keskustelu">➕</span>
                </Button>
              </form>
            </div>
          ) : (
            <div style={{
              width: '100%',
              maxWidth: 1400,
              margin: '0 auto',
              display: 'flex',
              gap: 0,
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              padding: '32px 0',
              minHeight: 0,
              height: '100%',
              boxSizing: 'border-box',
              flex: 1
            }}>
              {/* Lomakekortti */}
              <div style={{
                flex: '0 0 380px',
                minWidth: 280,
                maxWidth: 380,
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                padding: 32,
                minHeight: 'unset',
                height: 'auto',
                overflow: 'visible',
                justifyContent: 'flex-start',
                alignSelf: 'flex-start',
                marginRight: 0
              }}>
                <h3 style={{margin: 0, fontSize: 20, fontWeight: 700, color: '#1f2937'}}>Lisää tiedosto tietokantaan</h3>
                <p style={{margin: 0, color: '#6b7280', fontSize: 15}}>Voit liittää PDF-, Word- tai tekstimuotoisen tiedoston. Tiedosto tallennetaan yrityksesi tietokantaan.</p>
                {/* Drag & drop -alue */}
                <div
                  ref={dropRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: dragActive ? '2px solid #2563eb' : '2px dashed #d1d5db',
                    borderRadius: 12,
                    background: dragActive ? '#f0f6ff' : '#f9fafb',
                    padding: '32px 0',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: 16,
                    cursor: 'pointer',
                    transition: 'border 0.2s, background 0.2s',
                    marginBottom: 8
                  }}
                  onClick={() => dropRef.current && dropRef.current.querySelector('input[type=file]').click()}
                >
                  Vedä ja pudota tiedostoja tähän tai <span style={{color: '#2563eb', textDecoration: 'underline'}}>valitse tiedostot</span>
                  <input
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileInput}
                    disabled={uploadLoading}
                  />
                </div>
                {/* Valitut tiedostot */}
                {pendingFiles.length > 0 && (
                  <div style={{
                    background: '#f9fafb',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 8,
                    maxHeight: 120,
                    overflowY: 'auto',
                    fontSize: 15
                  }}>
                    {pendingFiles.map(f => (
                      <div key={f.name + f.size} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4}}>
                        <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180}}>{f.name}</span>
                        <span style={{color: '#ef4444', cursor: 'pointer', fontSize: 18, marginLeft: 8}} onClick={() => handleRemovePending(f.name, f.size)}>❌</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  onClick={handleUploadPending}
                  disabled={uploadLoading || pendingFiles.length === 0}
                  style={{ padding: '12px 0', fontWeight: 700, fontSize: 16, marginTop: 8 }}
                >
                  Lähetä tiedostot
                </Button>
                {uploadLoading && <p style={{ color: '#2563eb', margin: 0 }}>Ladataan...</p>}
                {uploadError && <p style={{ color: 'red', margin: 0 }}>{uploadError}</p>}
                {uploadSuccess && <p style={{ color: 'green', margin: 0 }}>{uploadSuccess}</p>}
              </div>
              {/* Tiedostot */}
              <div style={{
                flex: 1,
                minWidth: 0,
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                padding: 32,
                minHeight: 0,
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                marginLeft: 0
              }}>
                <h3 style={{margin: 0, fontSize: 20, fontWeight: 700, color: '#1f2937'}}>Tiedostot</h3>
                <div style={{flex: 1, overflowY: 'auto', marginTop: 8}}>
                  {filesLoading ? (
                    <p>Ladataan tiedostoja...</p>
                  ) : filesError ? (
                    <p style={{ color: 'red' }}>{filesError}</p>
                  ) : files.length === 0 ? (
                    <div style={{textAlign: 'center', color: '#6b7280', marginTop: 32}}>
                      <img src="/placeholder.png" alt="Ei tiedostoja" style={{width: 64, opacity: 0.5, marginBottom: 8}} />
                      <div>Et ole vielä lisännyt tiedostoja</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {files.map((file) => (
                        <div key={file.id} style={{
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          background: '#f9fafb',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{file.filename}</div>
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>
                              {formatBytes(file.bytes)} • {formatDate(file.created_at)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleFileDeletion(file.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            Poista
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 