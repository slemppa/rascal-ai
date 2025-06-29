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
    if (tab === 'files' && files.length === 0) {
      fetchFiles()
    }
  }, [tab])

  const fetchFiles = async () => {
    if (!companyId) {
      setFilesError('Yrityksen ID puuttuu')
      return
    }
    
    setFilesLoading(true)
    setFilesError('')
    try {
      const response = await axios.get(`/api/vector-store-files?companyId=${companyId}`)
      setFiles(response.data.files || [])
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
      await axios.delete(`/api/vector-store-files?fileId=${fileId}&companyId=${companyId}`)
      setFiles(prev => prev.filter(file => file.id !== fileId))
      setSelectedFiles(prev => prev.filter(id => id !== fileId))
    } catch (error) {
      console.error('Virhe tiedoston poistamisessa:', error)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Välilehdet */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb'
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

      {/* Sisältö */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'chat' ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Viestit */}
            <div style={{ 
              flex: 1, 
              overflow: 'auto', 
              padding: '20px',
              background: '#f9fafb'
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
                      lineHeight: 1.5
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

            {/* Syöttökenttä */}
            <form onSubmit={handleSendMessage} style={{
              padding: '20px',
              borderTop: '1px solid #e5e7eb',
              background: '#fff'
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
          <div style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600 }}>
                Tietokanta
              </h2>
              <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
                Lataa tiedostoja, joita assistentti voi käyttää vastauksissaan.
              </p>
              
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploadLoading}
                style={{ marginBottom: '16px' }}
              />
              
              {uploadLoading && <p>Ladataan...</p>}
              {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
              {uploadSuccess && <p style={{ color: 'green' }}>{uploadSuccess}</p>}
            </div>

            {filesLoading ? (
              <p>Ladataan tiedostoja...</p>
            ) : filesError ? (
              <p style={{ color: 'red' }}>{filesError}</p>
            ) : files.length === 0 ? (
              <p style={{ color: '#6b7280' }}>Ei tiedostoja vielä.</p>
            ) : (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => setShowAllFiles(!showAllFiles)}
                    style={{
                      padding: '8px 16px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {showAllFiles ? 'Piilota tiedostot' : 'Näytä kaikki tiedostot'}
                  </button>
                </div>
                
                <div style={{ display: 'grid', gap: '12px' }}>
                  {files.slice(0, showAllFiles ? files.length : 5).map((file) => (
                    <div key={file.id} style={{
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{file.filename}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {file.size} tavua • {new Date(file.created_at).toLocaleDateString('fi-FI')}
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 