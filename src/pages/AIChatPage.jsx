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
  const [threadId, setThreadId] = useState(() => localStorage.getItem('rascalai_threadId') || null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const dropRef = useRef(null)

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

  // Vieritä alas aina kun viestit päivittyvät
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Hae tiedostot kun tietokanta-välilehti avataan
  useEffect(() => {
    if (tab === 'files' && files.length === 0) {
      fetchFiles()
    }
  }, [tab])

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
      const response = await axios.get(`/api/vector-store-files?companyId=${companyId}`)
      // Tuki sekä files: [...], files: { data: [...] } että data: [...]
      let arr = []
      if (Array.isArray(response.data.files)) {
        arr = response.data.files
      } else if (response.data.files && Array.isArray(response.data.files.data)) {
        arr = response.data.files.data
      } else if (Array.isArray(response.data.data)) {
        arr = response.data.data
      } else if (Array.isArray(response.data)) {
        arr = response.data
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
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post('/api/strategy', {
        message: input,
        threadId: threadId,
        companyId: companyId
      })

      if (response.data.threadId && !threadId) {
        setThreadId(response.data.threadId)
        localStorage.setItem('rascalai_threadId', response.data.threadId)
      }

      const assistantMessage = { role: 'assistant', content: response.data.response }
      setMessages(prev => [...prev, assistantMessage])
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

      const response = await axios.post('/api/upload-knowledge', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
      await axios.post('/api/vector-store-files', {
        action: 'delete',
        companyId,
        assistantId,
        fileId
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
      await axios.post('/api/vector-store-files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
    return axios.post('/api/vector-store-files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  // UUSI: Assistentin tiedoston poisto (POST + action)
  async function deleteAssistantKnowledgeFile({ fileId, assistantId, companyId }) {
    return axios.post('/api/vector-store-files', {
      action: 'delete',
      companyId,
      assistantId,
      fileId
    })
  }

  return (
    <div style={{
      height: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Estää koko sivun scrollauksen
    }}>
      {/* Välilehdet - kiinteä korkeus */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb',
        flexShrink: 0 // Estää kutistumisen
      }}>
              <button
          onClick={() => setTab('chat')}
                style={{
            flex: 1,
            padding: '16px',
                  border: 'none',
            background: tab === 'chat' ? '#fff' : 'transparent',
            color: tab === 'chat' ? '#1f2937' : '#6b7280',
            fontWeight: tab === 'chat' ? 600 : 500,
                  cursor: 'pointer',
            borderBottom: tab === 'chat' ? '2px solid #2563eb' : 'none'
          }}
        >
          Keskustelu
        </button>
        <button
          onClick={() => setTab('files')}
          style={{
            flex: 1,
            padding: '16px',
            border: 'none',
            background: tab === 'files' ? '#fff' : 'transparent',
            color: tab === 'files' ? '#1f2937' : '#6b7280',
            fontWeight: tab === 'files' ? 600 : 500,
            cursor: 'pointer',
            borderBottom: tab === 'files' ? '2px solid #2563eb' : 'none'
          }}
        >
          Tietokanta ({files.length})
              </button>
          </div>

      {/* Sisältö - täyttää loput tilasta */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {tab === 'chat' ? (
            <div style={{
            height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
            overflow: 'hidden'
            }}>
            {/* Viestit - scrollattava alue */}
              <div style={{
                flex: 1, 
                overflowY: 'auto', 
              overflowX: 'hidden',
              padding: '20px',
              background: '#f9fafb',
              minHeight: 0 // Tärkeä flexbox-ominaisuus
            }}>
              {messages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                  color: '#6b7280', 
                  marginTop: '20%',
                  fontSize: 16
                }}>
                  <p>Tervetuloa {companyName} assistenttiin! 👋</p>
                  <p>Kysy mitä tahansa markkinointiin liittyvää.</p>
                    </div>
              ) : (
                messages.map((message, index) => (
                  <div key={index} style={{
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: message.role === 'user' ? '#2563eb' : '#fff',
                      color: message.role === 'user' ? '#fff' : '#1f2937',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      lineHeight: 1.5,
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      {message.role === 'assistant' ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
              <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: '#fff',
                    color: '#6b7280',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    Kirjoittaa...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Syöttökenttä - kiinteä korkeus */}
            <form onSubmit={handleSendMessage} style={{
              padding: '20px',
              borderTop: '1px solid #e5e7eb',
              background: '#fff',
              flexShrink: 0 // Estää kutistumisen
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Kirjoita viestisi..."
                  disabled={loading}
                      style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
                  <button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    style={{
                    padding: '12px 24px',
                    background: '#2563eb',
                    color: '#fff',
                      border: 'none',
                    borderRadius: '8px',
                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                    opacity: loading || !input.trim() ? 0.6 : 1
                  }}
                >
                  Lähetä
                  </button>
              </div>
            </form>
            </div>
        ) : (
            <div style={{
            width: '100%',
            maxWidth: 1400,
            margin: '0 auto',
              display: 'flex',
            gap: 32,
              justifyContent: 'center',
              alignItems: 'stretch',
            padding: '32px 0',
            minHeight: 0,
            height: '100%',
            boxSizing: 'border-box',
            flex: 1
          }}>
            {/* Lomakekortti 1/3 */}
              <div style={{
                flex: 1,
              minWidth: 280,
              maxWidth: 380,
                background: '#fff',
              borderRadius: 16,
              boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
              gap: 16,
              minHeight: 0,
              height: '100%',
              overflow: 'hidden',
              justifyContent: 'flex-start'
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
                          <button
                onClick={handleUploadPending}
                disabled={uploadLoading || pendingFiles.length === 0}
                            style={{
                  padding: '12px 0',
                  background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                  borderRadius: 8,
                    fontWeight: 700,
                  fontSize: 16,
                  cursor: uploadLoading || pendingFiles.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: uploadLoading || pendingFiles.length === 0 ? 0.7 : 1
                }}
              >
                Lähetä tiedostot
                  </button>
              {uploadLoading && <p style={{ color: '#2563eb', margin: 0 }}>Ladataan...</p>}
              {uploadError && <p style={{ color: 'red', margin: 0 }}>{uploadError}</p>}
              {uploadSuccess && <p style={{ color: 'green', margin: 0 }}>{uploadSuccess}</p>}
              {/* Tyhjää tilaa tuleville featureille */}
              <div style={{flex: 1}} />
              </div>
            {/* Tiedostokortti 2/3 */}
              <div style={{
                flex: 2,
              minWidth: 320,
              background: '#fff',
                borderRadius: 16,
              boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
              padding: 32,
                minHeight: 0,
              height: '100%',
              overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
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
  )
} 