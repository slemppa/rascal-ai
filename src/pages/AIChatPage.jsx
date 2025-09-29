import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { upload as vercelBlobUpload } from '@vercel/blob/client'
import ReactMarkdown from 'react-markdown'
import PageHeader from '../components/PageHeader'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './AIChatPage.css'

export default function AIChatPage() {
  const { t } = useTranslation('common')
  // Luotettava lähetystapa sivulta poistuttaessa
  const PENDING_KEY = 'rascalai_pending_msgs'
  const loadPendingQueue = () => {
    try { const s = localStorage.getItem(PENDING_KEY); return s ? JSON.parse(s) : [] } catch { return [] }
  }
  const savePendingQueue = (q) => { try { localStorage.setItem(PENDING_KEY, JSON.stringify(q)) } catch {} }
  const pendingQueueRef = useRef(loadPendingQueue())
  const enqueuePending = (item) => { pendingQueueRef.current = [...pendingQueueRef.current, item]; savePendingQueue(pendingQueueRef.current) }
  const dequeuePending = (id) => { pendingQueueRef.current = pendingQueueRef.current.filter(i => i.id !== id); savePendingQueue(pendingQueueRef.current) }
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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const MAX_BATCH_BYTES = 4 * 1024 * 1024 // ei käytössä Blob-polussa, jätetty varalle

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

  // Hae companyName käyttäjän tiedoista
  const companyName = userData?.company_name || 'Company'

  // Vieritä alas aina kun viestit päivittyvät (column-reverse hoitaa, joten ei tarvita)
  // useEffect ei enää tarpeen

  // Hae tiedostot kun tietokanta-välilehti avataan
  useEffect(() => {
    if (tab === 'files' && files.length === 0) {
      fetchFiles()
    }
  }, [tab])

  // Seuraa ikkunan koon muutoksia responsiivisuutta varten
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
  function formatMB(bytes) {
    const mb = (bytes / (1024 * 1024))
    return mb.toFixed(1).replace('.', ',') + ' MB'
  }

  // Palauta turvallinen tiedostonimi (poista diakriitit ja erikoismerkit)
  function sanitizeFilename(inputName) {
    const trimmed = (inputName || '').trim()
    const justName = trimmed.split('\\').pop().split('/').pop()
    const dotIdx = justName.lastIndexOf('.')
    const ext = dotIdx >= 0 ? justName.slice(dotIdx) : ''
    const base = dotIdx >= 0 ? justName.slice(0, dotIdx) : justName
    const withoutDiacritics = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const asciiSafe = withoutDiacritics.replace(/[^a-zA-Z0-9._-]+/g, '-')
    const collapsed = asciiSafe.replace(/-+/g, '-').replace(/^[.-]+|[.-]+$/g, '')
    return (collapsed || 'file') + ext
  }

  const fetchFiles = async () => {
    console.log('fetchFiles alkaa, loadingUserData:', loadingUserData, 'userId:', userData?.id)
    if (loadingUserData) {
      setFilesError(t('assistant.loadingUser'))
      return
    }
    if (!userData?.id) {
      setFilesError('Käyttäjän ID puuttuu')
      return
    }
    setFilesLoading(true)
    setFilesError('')
    try {
      const response = await axios.post('/api/dev-knowledge', { action: 'list', userId: userData.id }, {
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

      // Normalize: ensure we always have a visible filename and consistent id array
      const normalized = Array.isArray(arr) ? arr.map(item => {
        if (item && typeof item === 'object' && 'file_name' in item && Array.isArray(item.id)) {
          return item
        }
        const resolvedName = (item && typeof item === 'object')
          ? (item.file_name || item.filename || item.name || item.originalFilename || item.title || 'Tiedosto')
          : (typeof item === 'string' ? item : 'Tiedosto')
        const resolvedId = (item && typeof item === 'object')
          ? (Array.isArray(item.id) ? item.id : (item.id ? [item.id] : []))
          : []
        return {
          file_name: resolvedName,
          id: resolvedId,
        }
      }) : []

      setFiles(normalized)
    } catch (error) {
      console.error('Virhe haettaessa tiedostoja:', error)
      setFilesError(t('assistant.files.list.error'))
    } finally {
      setFilesLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading || loadingUserData) return
    
    if (!userData?.id) {
      const errorMessage = { role: 'assistant', content: 'Käyttäjän ID puuttuu. Ota yhteyttä ylläpitoon.' }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const payload = { message: input, threadId, userId: userData?.id }
      const pendingId = `msg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
      enqueuePending({ id: pendingId, payload })
      const response = await axios.post('/api/chat', payload)

      // Ota oikea vastausmuoto (array tai objekti)
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      const assistantMessage = { role: 'assistant', content: data.output || data.response }
      setMessages(prev => [...prev, assistantMessage])
      dequeuePending(pendingId)
      if (data.threadId && !threadId) {
        setThreadId(data.threadId)
        localStorage.setItem('rascalai_threadId', data.threadId)
      }
    } catch (error) {
      const errorMessage = { role: 'assistant', content: t('assistant.sendError') }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  // Flushaa keskeneräiset viestit käynnistyksessä ja poistuttaessa
  useEffect(() => {
    const flushWithAxios = async () => {
      if (!pendingQueueRef.current.length) return
      const queue = [...pendingQueueRef.current]
      for (const item of queue) {
        try { await axios.post('/api/chat', item.payload); dequeuePending(item.id) } catch {}
      }
    }
    flushWithAxios()

    const flushWithBeacon = () => {
      if (!pendingQueueRef.current.length) return
      const queue = [...pendingQueueRef.current]
      for (const item of queue) {
        const body = JSON.stringify(item.payload)
        let sent = false
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' })
          sent = navigator.sendBeacon('/api/chat', blob)
        }
        if (!sent) {
          try { fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }) } catch {}
        }
        dequeuePending(item.id)
      }
    }
    const onVis = () => { if (document.visibilityState === 'hidden') flushWithBeacon() }
    const onUnload = () => { flushWithBeacon() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [])

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    if (!userData?.id) {
      setUploadError('Käyttäjän ID puuttuu')
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
      formData.append('userId', userData.id)
      try { formData.append('fileNames', JSON.stringify(files.map(f => f.name))) } catch {}

      await axios.post('/api/dev-upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-api-key': import.meta.env.N8N_SECRET_KEY
        }
      })

      setUploadSuccess(t('assistant.files.uploadCard.uploadSuccess', { count: files.length }))
      // Päivitä tiedostolista heti uploadin jälkeen
      await fetchFiles()
    } catch (error) {
      console.error('Virhe tiedostojen lataamisessa:', error)
      console.error('Virheen response:', error.response?.data)
      console.error('Virheen message:', error.message)
      console.error('Virheen status:', error.response?.status)
      console.error('Virheen config:', error.config)
      
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message
      console.log('Asetetaan virheviesti:', errorMessage)
      setUploadError(`${t('assistant.files.uploadCard.uploadError')}: ${errorMessage}`)
    } finally {
      console.log('Finally-lohko suoritettu')
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
      await axios.post('/api/dev-delete-files', {
        ids: [fileId]
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
    if (files.length === 0) return
    // Kokorajoitus 25 MB per tiedosto drag&dropissa
    const MAX_BYTES = 25 * 1024 * 1024
    const tooLargeDrop = files.find(f => (f.size || 0) > MAX_BYTES)
    if (tooLargeDrop) {
      setUploadError('Tiedosto liian suuri')
      return
    }
    setPendingFiles(prev => {
      const uniqueNew = files.filter(f => !prev.some(p => p.name === f.name && p.size === f.size))
      return [...prev, ...uniqueNew]
    })
  }
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    console.log('handleFileInput kutsuttu, tiedostoja:', files.length)
    if (files.length > 0) {
      // Kokorajoitus 25 MB per tiedosto inputista
      const MAX_BYTES = 25 * 1024 * 1024
      const tooLargeInput = files.find(f => (f.size || 0) > MAX_BYTES)
      if (tooLargeInput) {
        setUploadError('Tiedosto liian suuri')
        return
      }
      setPendingFiles(prev => {
        const uniqueNew = files.filter(f => !prev.some(p => p.name === f.name && p.size === f.size))
        const newPendingFiles = [...prev, ...uniqueNew]
        console.log('pendingFiles päivitetty:', newPendingFiles.length)
        return newPendingFiles
      })
    }
  }
  const handleRemovePending = (name, size) => {
    console.log('handleRemovePending kutsuttu:', name, size)
    setPendingFiles(prev => {
      const newFiles = prev.filter(f => !(f.name === name && f.size === size))
      console.log('pendingFiles päivitetty:', newFiles.length)
      return newFiles
    })
  }
  const handleUploadPending = async () => {
    console.log('handleUploadPending klikattu, pendingFiles:', pendingFiles.length)
    console.log('userId:', userData?.id)
    console.log('uploadLoading:', uploadLoading)
    
    if (pendingFiles.length === 0) {
      console.log('Ei pendingFiles, palautetaan')
      return
    }
    if (!userData?.id) {
      console.log('userId puuttuu')
      setUploadError('Käyttäjän ID puuttuu')
      return
    }
    console.log('Asetetaan uploadLoading = true (handleUploadPending)')
    setUploadLoading(true)
    setUploadError('')
    setUploadSuccess('')
    try {
      console.log('Ladataan tiedostot Supabaseen (public bucket upload)...')
      const uploaded = []
      for (const file of pendingFiles) {
        const bucket = 'temp-ingest'
        const safeName = sanitizeFilename(file.name)
        const path = `${Date.now()}-${safeName}`
        const { error: putErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' })
        if (putErr) throw new Error(putErr.message)
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
        uploaded.push({ bucket, path, publicUrl: pub?.publicUrl || null, filename: file.name, size: file.size || 0, contentType: file.type || 'application/octet-stream' })
      }
      await fetch('/api/storage-ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': import.meta.env.N8N_SECRET_KEY },
        body: JSON.stringify({ userId: userData.id, files: uploaded })
      })
      setUploadSuccess(t('assistant.files.uploadCard.uploadSuccess', { count: pendingFiles.length }))
      setPendingFiles([])
      // Päivitä tiedostolista heti uploadin jälkeen
      console.log('Päivitetään tiedostolista...')
      await fetchFiles()
      console.log('Tiedostolista päivitetty')
    } catch (error) {
      console.error('Virhe tiedostojen lataamisessa (blob):', error)
      setUploadError(t('assistant.files.uploadCard.uploadError'))
    } finally {
      console.log('Asetetaan uploadLoading = false (handleUploadPending)')
      setUploadLoading(false)
    }
  }

  // UUSI: Assistentin tiedostojen lisäys (POST + action)
  async function uploadAssistantKnowledgeFiles({ files, userId }) {
    const formData = new FormData()
    Array.from(files).forEach(file => formData.append('files', file))
    formData.append('action', 'feed')
    formData.append('userId', userId)
    return axios.post('/api/dev-upload', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'x-api-key': import.meta.env.N8N_SECRET_KEY
      }
    })
  }

  // UUSI: Assistentin tiedoston poisto (POST + action)
  async function deleteAssistantKnowledgeFile({ fileId, userId }) {
    return axios.post('/api/dev-delete-files', {
      ids: [fileId]
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
          {t('assistant.loadingUser')}
        </div>
      ) : (
        <div className="ai-chat-wrapper">
          {/* Välilehdet */}
          <div className="ai-chat-tabs">
            <button onClick={() => setTab('chat')} className={`ai-chat-tab ${tab === 'chat' ? 'active' : ''}`}>
              {t('assistant.tabs.chat')}
            </button>
            <button onClick={() => setTab('files')} className={`ai-chat-tab ${tab === 'files' ? 'active' : ''}`}>
              {t('assistant.tabs.files')} ({files.length})
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
                        list.push({ role: 'assistant', content: t('assistant.typing'), temp: true })
                      }
                      return list.slice().reverse().map((message, index) => (
                        <div key={index} className={`ai-chat-message ${message.role === 'assistant' ? 'assistant' : ''}`}>
                          <div className={`ai-chat-message-bubble ${message.role === 'assistant' ? 'assistant' : ''}`}>
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
                <form onSubmit={handleSendMessage} className="ai-chat-input-form">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('assistant.inputPlaceholder')}
                    disabled={loading}
                    className="ai-chat-input"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="ai-chat-send-button"
                  >
                    {t('assistant.send')}
                  </button>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    title={t('assistant.newChatTitle')}
                    className="ai-chat-newchat-button"
                  >
                    <span role="img" aria-label={t('assistant.newChatAria')}>➕</span>
                  </button>
                </form>
              </div>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: windowWidth <= 768 ? '16px' : windowWidth <= 480 ? '12px' : '24px',
                gap: windowWidth <= 768 ? '20px' : windowWidth <= 480 ? '16px' : '24px',
                overflow: 'hidden',
                background: '#f7f8fc'
              }}>
                {/* Upload kortti - aina näkyvissä */}
                <div className="ai-chat-upload-card" style={{ flexShrink: 0 }}>
                  <h3>{t('assistant.files.uploadCard.title')}</h3>
                  <p>{t('assistant.files.uploadCard.desc')}</p>
                  {/* Drag & drop -alue */}
                  <div
                    ref={dropRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`ai-chat-drag-drop ${dragActive ? 'active' : ''}`}
                    onClick={() => dropRef.current && dropRef.current.querySelector('input[type=file]').click()}
                  >
                    {t('assistant.files.uploadCard.dragText')} <span>{t('assistant.files.uploadCard.chooseFiles')}</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.md,.rtf,image/*,audio/*"
                      style={{ display: 'none' }}
                      onChange={handleFileInput}
                    />
                  </div>
                  {/* Valitut tiedostot */}
                  {pendingFiles.length > 0 && (
                    <div className="ai-chat-pending-files">
                      {pendingFiles.map(f => (
                        <div key={f.name + f.size} className="ai-chat-pending-file">
                          <span className="ai-chat-pending-file-name">{f.name}</span>
                          <span className="ai-chat-remove-file" onClick={() => handleRemovePending(f.name, f.size)}>{t('assistant.files.uploadCard.remove')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      handleUploadPending()
                    }}
                    disabled={uploadLoading || pendingFiles.length === 0}
                    className="ai-chat-upload-button"
                  >
                    {t('assistant.files.uploadCard.uploadBtn', { count: pendingFiles.length })}
                  </button>
                  {uploadLoading && <p className="ai-chat-loading-text">{t('assistant.files.uploadCard.uploading')}</p>}
                  {uploadError && <p className="ai-chat-error-text">{uploadError}</p>}
                  {uploadSuccess && <p className="ai-chat-success-text">{uploadSuccess}</p>}
                </div>
                
                {/* Tiedostot - erillinen container */}
                <div className="ai-chat-files-list">
                  <h3>{t('assistant.files.list.title')}</h3>
                  <div className="ai-chat-files-scroll" ref={filesListRef}>
                    {filesLoading ? (
                      <div className="ai-chat-loading">
                        <span>{t('assistant.files.list.loading')}</span>
                      </div>
                    ) : filesError ? (
                      <div className="ai-chat-error">
                        <span>{filesError}</span>
                      </div>
                    ) : files.length === 0 ? (
                      <div className="ai-chat-empty-state">
                        <img src="/placeholder.png" alt={t('assistant.files.list.emptyAlt')} />
                        <div>{t('assistant.files.list.emptyTitle')}</div>
                      </div>
                    ) : (
                      <>
                        {files.map((file) => (
                          <div key={file.file_name} className="ai-chat-file-item">
                            <div className="ai-chat-file-info">
                              <div className="ai-chat-file-name">{file.file_name || file.filename}</div>
                              {Array.isArray(file.id) && (
                                <div className="ai-chat-file-meta">{file.id.length} osaa</div>
                              )}
                            </div>
                            <button
                              onClick={() => handleFileDeletion(file.id)}
                              className="ai-chat-delete-button"
                            >
                              {t('assistant.files.list.delete')}
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