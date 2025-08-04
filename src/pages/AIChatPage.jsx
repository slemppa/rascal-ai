import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './AIChatPage.css'

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
  
  // Debug: Seuraa uploadLoading tilan muutoksia
  useEffect(() => {
    console.log('uploadLoading muuttui:', uploadLoading)
  }, [uploadLoading])
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([])
  
  // Debug: Seuraa pendingFiles tilan muutoksia
  useEffect(() => {
    console.log('pendingFiles muuttui:', pendingFiles.length, pendingFiles.map(f => f.name))
  }, [pendingFiles])
  const [dragActive, setDragActive] = useState(false)
  const dropRef = useRef(null)
  const filesListRef = useRef(null)
  const { user } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loadingUserData, setLoadingUserData] = useState(true)

  // Hae käyttäjän tiedot Supabase-tietokannasta
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setLoadingUserData(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('company_name, company_id, assistant_id, id')
          .eq('auth_user_id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
        } else {
          setUserData(data)
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error)
      } finally {
        setLoadingUserData(false)
      }
    }

    fetchUserData()
  }, [user?.id])

  // Hae companyName, companyId, assistantId käyttäjän tiedoista
  const companyName = userData?.company_name || 'Yrityksen'
  const companyId = userData?.company_id
  const assistantId = userData?.assistant_id

  // Vieritä alas aina kun viestit päivittyvät (column-reverse hoitaa, joten ei tarvita)
  // useEffect ei enää tarpeen

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
    console.log('fetchFiles alkaa, loadingUserData:', loadingUserData, 'companyId:', companyId)
    if (loadingUserData) {
      setFilesError('Ladataan käyttäjän tietoja...')
      return
    }
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
      console.error('Virhe haettaessa tiedostoja:', error)
      setFilesError('Virhe haettaessa tiedostoja')
    } finally {
      setFilesLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading || loadingUserData) return
    
    if (!assistantId) {
      const errorMessage = { role: 'assistant', content: 'Assistentin ID puuttuu. Ota yhteyttä ylläpitoon.' }
      setMessages(prev => [...prev, errorMessage])
      return
    }

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
    if (!companyId) {
      setUploadError('Yrityksen ID puuttuu')
      return
    }
    if (!assistantId) {
      setUploadError('Assistentin ID puuttuu')
      return
    }

    console.log('Asetetaan uploadLoading = true (handleFileUpload)')
    setUploadLoading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      formData.append('action', 'feed')
      formData.append('companyId', companyId)
      formData.append('assistantId', assistantId)

      await axios.post('/api/upload-knowledge', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-api-key': import.meta.env.N8N_SECRET_KEY
        }
      })

      setUploadSuccess(`${files.length} tiedosto ladattu onnistuneesti!`)
      // Päivitä tiedostolista heti uploadin jälkeen
      await fetchFiles()
    } catch (error) {
      console.error('Virhe tiedostojen lataamisessa:', error)
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
    console.log('handleFileInput kutsuttu, tiedostoja:', files.length)
    if (files.length > 0) {
      setPendingFiles(prev => {
        const newPendingFiles = [...prev, ...files.filter(f => !prev.some(p => p.name === f.name && p.size === f.size))]
        console.log('pendingFiles päivitetty:', newPendingFiles.length)
        return newPendingFiles
      })
    }
  }
  const handleRemovePending = (name, size) => {
    setPendingFiles(prev => prev.filter(f => !(f.name === name && f.size === size)))
  }
  const handleUploadPending = async () => {
    console.log('handleUploadPending klikattu, pendingFiles:', pendingFiles.length)
    if (pendingFiles.length === 0) return
    if (!companyId) {
      setUploadError('Yrityksen ID puuttuu')
      return
    }
    if (!assistantId) {
      setUploadError('Assistentin ID puuttuu')
      return
    }
    console.log('Asetetaan uploadLoading = true (handleUploadPending)')
    setUploadLoading(true)
    setUploadError('')
    setUploadSuccess('')
    try {
      const formData = new FormData()
      pendingFiles.forEach(file => formData.append('files', file))
      formData.append('action', 'feed')
      formData.append('companyId', companyId)
      formData.append('assistantId', assistantId)
      console.log('Lähetetään tiedostot...')
      await axios.post('/api/upload-knowledge', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-api-key': import.meta.env.N8N_SECRET_KEY
        }
      })
      console.log('Tiedostot lähetetty onnistuneesti')
      setUploadSuccess(`${pendingFiles.length} tiedosto(a) ladattu onnistuneesti!`)
      setPendingFiles([])
      // Päivitä tiedostolista heti uploadin jälkeen
      console.log('Päivitetään tiedostolista...')
      await fetchFiles()
      console.log('Tiedostolista päivitetty')
    } catch (error) {
      console.error('Virhe tiedostojen lataamisessa:', error)
      setUploadError('Virhe tiedostojen lataamisessa')
    } finally {
      console.log('Asetetaan uploadLoading = false (handleFileUpload)')
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
      {loadingUserData ? (
        <div className="ai-chat-loading">
          Ladataan käyttäjän tietoja...
        </div>
      ) : (
        <div className="ai-chat-wrapper">
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
            <button
              onClick={() => setTab('chat')}
              style={{
                flex: 1,
                height: '100%',
                border: 'none',
                background: tab === 'chat' ? '#fff' : 'transparent',
                color: tab === 'chat' ? 'var(--brand-dark, #1f2937)' : '#6b7280',
                fontWeight: tab === 'chat' ? 700 : 500,
                cursor: 'pointer',
                borderBottom: tab === 'chat' ? '3px solid var(--brand-accent, #7c3aed)' : '3px solid transparent',
                fontSize: 18,
                letterSpacing: 0.5,
                transition: 'background 0.15s, color 0.15s',
                borderRadius: 0,
                outline: 'none',
                boxShadow: 'none',
                margin: 0,
                padding: 0
              }}
              onMouseOver={e => { if(tab !== 'chat') e.currentTarget.style.background = '#f3f4f6' }}
              onMouseOut={e => { if(tab !== 'chat') e.currentTarget.style.background = 'transparent' }}
            >
              Keskustelu
            </button>
            <button
              onClick={() => setTab('files')}
              style={{
                flex: 1,
                height: '100%',
                border: 'none',
                background: tab === 'files' ? '#fff' : 'transparent',
                color: tab === 'files' ? 'var(--brand-dark, #1f2937)' : '#6b7280',
                fontWeight: tab === 'files' ? 700 : 500,
                cursor: 'pointer',
                borderBottom: tab === 'files' ? '3px solid var(--brand-accent, #7c3aed)' : '3px solid transparent',
                fontSize: 18,
                letterSpacing: 0.5,
                transition: 'background 0.15s, color 0.15s',
                borderRadius: 0,
                outline: 'none',
                boxShadow: 'none',
                margin: 0,
                padding: 0
              }}
              onMouseOver={e => { if(tab !== 'files') e.currentTarget.style.background = '#f3f4f6' }}
              onMouseOut={e => { if(tab !== 'files') e.currentTarget.style.background = 'transparent' }}
            >
              Tietokanta ({files.length})
            </button>
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
                padding: 0,
                height: '100%'
              }}>
                {/* Viestit */}
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  margin: 0,
                  padding: 0,
                  overflow: 'hidden'
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
                    width: '100%',
                    height: '100%'
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
                    placeholder="Kirjoita viestisi..."
                    disabled={loading}
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      fontSize: 16,
                      outline: 'none',
                      margin: 0
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
                      borderRadius: 8,
                      cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                      opacity: loading || !input.trim() ? 0.6 : 1,
                      fontWeight: 600,
                      fontSize: 16,
                      margin: 0,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Lähetä
                  </button>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    title="Aloita uusi keskustelu"
                    style={{
                      padding: '10px 14px',
                      background: '#e5e7eb',
                      color: '#2563eb',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 20,
                      margin: 0,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span role="img" aria-label="Uusi keskustelu">➕</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="ai-chat-files-container">
                {/* Upload kortti */}
                <div className="ai-chat-upload-card">
                  <h3>Lisää tiedosto tietokantaan</h3>
                  <p>Voit liittää PDF-, Word- tai tekstimuotoisen tiedoston. Tiedosto tallennetaan yrityksesi tietokantaan.</p>
                  {/* Drag & drop -alue */}
                  <div
                    ref={dropRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`ai-chat-drag-drop ${dragActive ? 'active' : ''}`}
                    onClick={() => dropRef.current && dropRef.current.querySelector('input[type=file]').click()}
                  >
                    Vedä ja pudota tiedostoja tähän tai <span>valitse tiedostot</span>
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
                    <div className="ai-chat-pending-files">
                      {pendingFiles.map(f => (
                        <div key={f.name + f.size} className="ai-chat-pending-file">
                          <span className="ai-chat-pending-file-name">{f.name}</span>
                          <span className="ai-chat-remove-file" onClick={() => handleRemovePending(f.name, f.size)}>❌</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleUploadPending}
                    disabled={uploadLoading || pendingFiles.length === 0}
                    className="ai-chat-upload-button"
                    style={{ 
                      opacity: (uploadLoading || pendingFiles.length === 0) ? 0.5 : 1,
                      cursor: (uploadLoading || pendingFiles.length === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Lähetä tiedostot ({pendingFiles.length})
                  </button>
                  {uploadLoading && <p style={{ color: '#2563eb', margin: 0 }}>Ladataan...</p>}
                  {uploadError && <p style={{ color: 'red', margin: 0 }}>{uploadError}</p>}
                  {uploadSuccess && <p style={{ color: 'green', margin: 0 }}>{uploadSuccess}</p>}
                </div>
                {/* Tiedostot */}
                <div className="ai-chat-files-list">
                  <h3>Tiedostot</h3>
                  <div className="ai-chat-files-scroll" ref={filesListRef}>
                    {filesLoading ? (
                      <p>Ladataan tiedostoja...</p>
                    ) : filesError ? (
                      <p style={{ color: 'red' }}>{filesError}</p>
                    ) : files.length === 0 ? (
                      <div className="ai-chat-empty-state">
                        <img src="/placeholder.png" alt="Ei tiedostoja" />
                        <div>Et ole vielä lisännyt tiedostoja</div>
                      </div>
                    ) : (
                      <>
                        {files.map((file) => (
                          <div key={file.id} className="ai-chat-file-item">
                            <div className="ai-chat-file-info">
                              <div className="ai-chat-file-name">{file.filename}</div>
                              <div className="ai-chat-file-meta">
                                {formatBytes(file.bytes)} • {formatDate(file.created_at)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleFileDeletion(file.id)}
                              className="ai-chat-delete-button"
                            >
                              Poista
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
} 