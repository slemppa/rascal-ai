import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { supabase } from '../../lib/supabase'

export default function CallsKnowledgeBaseModal({ open, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasDatabase, setHasDatabase] = useState(false)
  const [files, setFiles] = useState([])
  const [activeTab, setActiveTab] = useState('files') // 'files' | 'add'
  const [addMode, setAddMode] = useState('pdf') // 'pdf' | 'web'
  const [inboundEnabled, setInboundEnabled] = useState(false)
  const [outboundEnabled, setOutboundEnabled] = useState(false)
  const [toggleLoading, setToggleLoading] = useState(false)

  const [pendingFiles, setPendingFiles] = useState([])
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const dropRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const [webTitle, setWebTitle] = useState('')
  const [webUrl, setWebUrl] = useState('')
  const [webLoading, setWebLoading] = useState(false)
  const [webError, setWebError] = useState('')

  const fetchStatusAndList = async () => {
    setError('')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Ei aktiivista sessiota')

      const statusResp = await axios.post(
        '/api/calls/knowledge-base',
        { action: 'status' },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      const has = Boolean(statusResp?.data?.vector_store_id)
      setHasDatabase(has)
      setInboundEnabled(Boolean(statusResp?.data?.inbound_enabled))
      setOutboundEnabled(Boolean(statusResp?.data?.outbound_enabled))

      if (!has) {
        setFiles([])
        return
      }

      const listResp = await axios.post(
        '/api/calls/knowledge-base',
        { action: 'list' },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )

      const arr = Array.isArray(listResp?.data?.files) ? listResp.data.files : []
      const normalized = arr.map((item) => ({
        id: item?.id,
        file_name: item?.file_name || 'Tiedosto',
        source_type: item?.source_type || 'file',
        source_url: item?.source_url || null,
      }))
      setFiles(normalized)
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Tietokannan haku epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setPendingFiles([])
    setUploadError('')
    setUploadSuccess('')
    setWebError('')
    setActiveTab('files')
    setAddMode('pdf')
    fetchStatusAndList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handlePickFiles = (fileList) => {
    const next = Array.from(fileList || [])
    if (!next.length) return
    setPendingFiles((prev) => [...prev, ...next])
  }

  const handleCreate = async () => {
    setError('')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Ei aktiivista sessiota')

      await axios.post(
        '/api/calls/knowledge-base',
        { action: 'create' },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      setHasDatabase(true)
      await fetchStatusAndList()
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Tietokannan luonti epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (bot, enabled) => {
    setError('')
    setToggleLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Ei aktiivista sessiota')

      const resp = await axios.post(
        '/api/calls/knowledge-base',
        { action: 'set_enabled', bot, enabled },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )

      setInboundEnabled(Boolean(resp?.data?.inbound_enabled))
      setOutboundEnabled(Boolean(resp?.data?.outbound_enabled))
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Kytkentä epäonnistui')
    } finally {
      setToggleLoading(false)
    }
  }

  const handleUpload = async () => {
    setUploadError('')
    setUploadSuccess('')
    setUploadLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Ei aktiivista sessiota')
      if (!pendingFiles.length) throw new Error('Ei valittuja tiedostoja')

      const fd = new FormData()
      fd.append('fileNames', JSON.stringify(pendingFiles.map((f) => f.name)))
      pendingFiles.forEach((f) => fd.append('files', f, f.name))

      const resp = await axios.post(
        '/api/calls/knowledge-base-upload',
        fd,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )

      const uploadedCount = resp?.data?.uploaded || pendingFiles.length
      setUploadSuccess(`${uploadedCount} tiedosto(a) ladattu`)
      setPendingFiles([])
      await fetchStatusAndList()
    } catch (e) {
      setUploadError(e?.response?.data?.error || e?.message || 'Tiedostojen lähetys epäonnistui')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Ei aktiivista sessiota')

      await axios.post(
        '/api/calls/knowledge-base',
        { action: 'delete', id },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )

      setFiles((prev) => prev.filter((f) => f.id !== id))
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Poisto epäonnistui')
    }
  }

  const handleAddWeb = async () => {
    setWebError('')
    setWebLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Ei aktiivista sessiota')

      await axios.post(
        '/api/calls/knowledge-base-ingest',
        { type: 'web', title: webTitle, url: webUrl },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )

      setWebTitle('')
      setWebUrl('')
      await fetchStatusAndList()
    } catch (e) {
      setWebError(e?.response?.data?.error || e?.message || 'URL:n lisäys epäonnistui')
    } finally {
      setWebLoading(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="edit-card-modal-overlay modal-overlay modal-overlay--light"
      onClick={onClose}
    >
      <div
        className="edit-card-modal modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px' }}
      >
        <div className="edit-card-modal-header">
          <h2>Tietokanta</h2>
          <button
            className="edit-card-close-btn"
            onClick={onClose}
            disabled={loading || uploadLoading}
          >
            ×
          </button>
        </div>

        <div className="edit-card-modal-body">
          <div className="post-edit-fields">
            <div className="post-edit-field" style={{ gridColumn: '1 / -1' }}>
              <div className="calls-kb-helper-text">
                Sallitut arvot: <strong>pdf</strong>, <strong>web</strong>
              </div>
              {error ? (
                <div className="calls-kb-error">{error}</div>
              ) : null}
            </div>

            {hasDatabase ? (
              <>
                <div className="post-edit-field" style={{ gridColumn: '1 / -1' }}>
                  <div className="calls-kb-tabs">
                    <button
                      type="button"
                      className={`cancel-card-btn calls-kb-tab ${activeTab === 'files' ? 'is-active' : ''}`}
                      onClick={() => setActiveTab('files')}
                      disabled={loading || uploadLoading || webLoading}
                    >
                      Tiedostot
                    </button>
                    <button
                      type="button"
                      className={`cancel-card-btn calls-kb-tab ${activeTab === 'add' ? 'is-active' : ''}`}
                      onClick={() => setActiveTab('add')}
                      disabled={loading || uploadLoading || webLoading}
                    >
                      Lisää
                    </button>
                  </div>
                </div>

                {activeTab === 'files' && (
                  <div className="post-edit-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="calls-kb-files-header">
                      <label>Tiedostot ({files.length})</label>
                      <div className="calls-kb-switches">
                        <div className="calls-kb-switch">
                          <span className="calls-kb-switch-label">Inbound</span>
                          <label className="switch switch--brand" title="Inbound tietokanta käyttöön/pois">
                            <input
                              type="checkbox"
                              checked={inboundEnabled}
                              onChange={(e) => handleToggle('inbound', e.target.checked)}
                              disabled={!hasDatabase || toggleLoading || loading || uploadLoading || webLoading}
                            />
                            <span className="slider" />
                          </label>
                        </div>
                        <div className="calls-kb-switch">
                          <span className="calls-kb-switch-label">Outbound</span>
                          <label className="switch switch--brand" title="Outbound tietokanta käyttöön/pois">
                            <input
                              type="checkbox"
                              checked={outboundEnabled}
                              onChange={(e) => handleToggle('outbound', e.target.checked)}
                              disabled={!hasDatabase || toggleLoading || loading || uploadLoading || webLoading}
                            />
                            <span className="slider" />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="calls-kb-file-list">
                      {loading ? (
                        <div className="calls-kb-muted">Ladataan...</div>
                      ) : files.length === 0 ? (
                        <div className="calls-kb-muted">Ei tiedostoja</div>
                      ) : (
                        <ul className="calls-kb-file-ul">
                          {files.map((f, idx) => (
                            <li
                              key={(f.id || f.file_name || 'file') + idx}
                              className="calls-kb-file-li"
                            >
                              <span className="calls-kb-file-name" title={f.source_type === 'web' ? f.source_url || f.file_name : f.file_name}>
                                {f.source_type === 'web' ? `URL: ${f.file_name}` : f.file_name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDelete(f.id)}
                                title="Poista"
                                className="calls-kb-delete"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'add' && (
                  <>
                    <div className="post-edit-field" style={{ gridColumn: '1 / -1' }}>
                      <label>Lisää tyyppi:</label>
                      <div className="calls-kb-tabs">
                        <button
                          type="button"
                          className={`cancel-card-btn calls-kb-tab ${addMode === 'pdf' ? 'is-active' : ''}`}
                          onClick={() => setAddMode('pdf')}
                          disabled={loading || uploadLoading || webLoading}
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          className={`cancel-card-btn calls-kb-tab ${addMode === 'web' ? 'is-active' : ''}`}
                          onClick={() => setAddMode('web')}
                          disabled={loading || uploadLoading || webLoading}
                        >
                          URL
                        </button>
                      </div>
                    </div>

                    {addMode === 'pdf' && (
                      <div className="post-edit-field" style={{ gridColumn: '1 / -1' }}>
                        <label>Lisää PDF (pdf):</label>

                        <div
                          ref={dropRef}
                          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                          onDragLeave={() => setDragActive(false)}
                          onDrop={(e) => {
                            e.preventDefault()
                            setDragActive(false)
                            handlePickFiles(e.dataTransfer.files)
                          }}
                          onClick={() => dropRef.current?.querySelector('input[type=file]')?.click()}
                          className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
                        >
                          <div className="calls-kb-dropzone-title">Vedä ja pudota PDF tähän</div>
                          <div className="calls-kb-dropzone-subtitle">tai klikkaa valitaksesi (.pdf)</div>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => handlePickFiles(e.target.files)}
                          />
                        </div>

                        {pendingFiles.length > 0 ? (
                          <div className="calls-kb-selected">
                            <div className="calls-kb-selected-title">
                              Valitut tiedostot ({pendingFiles.length})
                            </div>
                            <ul className="calls-kb-selected-ul">
                              {pendingFiles.map((f, idx) => (
                                <li key={f.name + f.size + idx}>{f.name}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {uploadError ? (
                          <div className="calls-kb-error">{uploadError}</div>
                        ) : null}

                        {uploadSuccess ? (
                          <div className="calls-kb-success">{uploadSuccess}</div>
                        ) : null}
                      </div>
                    )}

                    {addMode === 'web' && (
                      <div className="post-edit-field" style={{ gridColumn: '1 / -1' }}>
                        <label>Lisää URL (web):</label>
                        <input
                          type="text"
                          value={webTitle}
                          onChange={(e) => setWebTitle(e.target.value)}
                          className="post-edit-input"
                          placeholder="Otsikko (valinnainen)"
                          style={{ marginBottom: 8 }}
                        />
                        <input
                          type="url"
                          value={webUrl}
                          onChange={(e) => setWebUrl(e.target.value)}
                          className="post-edit-input"
                          placeholder="https://example.com/..."
                        />
                        {webError ? (
                          <div className="calls-kb-error">{webError}</div>
                        ) : null}
                        <div className="calls-kb-actions-row">
                          <button
                            className="save-card-btn"
                            onClick={handleAddWeb}
                            disabled={loading || webLoading || !webUrl.trim()}
                          >
                            {webLoading ? 'Lisätään...' : 'Lisää URL'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="post-edit-field" style={{ gridColumn: '1 / -1' }}>
                <div className="calls-kb-warn">
                  Tietokantaa ei ole vielä luotu tälle organisaatiolle.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="edit-card-modal-footer">
          <button
            className="cancel-card-btn"
            onClick={onClose}
            disabled={loading || uploadLoading || webLoading}
          >
            Sulje
          </button>

          {!hasDatabase ? (
            <button
              className="save-card-btn"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'Luodaan...' : 'Luo tietokanta'}
            </button>
          ) : (
            <div className="calls-kb-footer-right">
              <button
                className="cancel-card-btn"
                onClick={fetchStatusAndList}
                disabled={loading || uploadLoading || webLoading}
              >
                Päivitä lista
              </button>
              <button
                className="save-card-btn"
                onClick={handleUpload}
                disabled={activeTab !== 'add' || addMode !== 'pdf' || loading || uploadLoading || pendingFiles.length === 0}
              >
                {uploadLoading ? 'Lähetetään...' : 'Lähetä tiedostot'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

