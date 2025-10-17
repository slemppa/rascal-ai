import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { supabase } from '../lib/supabase'

const TicketModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    page: '',
    description: ''
  })
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null
  const [dragActive, setDragActive] = useState(false)
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef(null)


  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

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
    addFiles(files)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    addFiles(files)
  }

  const addFiles = (files) => {
    setFileError('') // Tyhjennä edelliset virheet
    
    const validFiles = []
    const errors = []
    
    files.forEach(file => {
      const validTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg'
      ]
      
      if (!validTypes.includes(file.type)) {
        errors.push(`Tiedostotyyppi "${file.type}" ei ole tuettu tiedostossa "${file.name}"`)
        return
      }
      
      validFiles.push(file)
    })

    if (errors.length > 0) {
      setFileError(errors.join('. '))
    }

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)) // Max 5 files
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.page || !formData.description.trim()) {
      alert('Täytä kaikki pakolliset kentät')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // Hae käyttäjätiedot ja session
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const companyId = user?.companyId || user?.user?.companyId || 'Unknown'

      // Hae session token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error('Session expired or invalid. Please log in again.')
      }

      // Luo FormData
      const formDataToSend = new FormData()
      formDataToSend.append('page', formData.page)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('userEmail', user?.email || 'Unknown')
      formDataToSend.append('companyId', companyId)
      formDataToSend.append('timestamp', new Date().toISOString())
      formDataToSend.append('userAgent', navigator.userAgent)

      // Lisää tiedostot
      selectedFiles.forEach((file, index) => {
        formDataToSend.append(`attachment_${index}`, file)
      })

      console.log('DEBUG - Sending ticket request:', { 
        page: formData.page, 
        filesCount: selectedFiles.length,
        userEmail: user?.email 
      })

      // Lähetä API endpointiin (ei suoraan N8N:ään)
      const response = await axios.post('/api/submit-ticket', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        timeout: 60000 // 60s timeout (tiedostojen käsittely voi kestää)
      })

      if (response.status === 200 || response.status === 201) {
        setSubmitStatus('success')
        setFormData({ page: '', description: '' })
        setSelectedFiles([])
        
        // Sulje modal 3 sekunnin kuluttua
        setTimeout(() => {
          onClose()
          setSubmitStatus(null)
        }, 3000)
      } else {
        throw new Error('Unexpected response status')
      }

    } catch (error) {
      console.error('Ticket submission error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      // Näytä tarkempi virheviesti käyttäjälle
      if (error.response?.data?.details) {
        alert('Virhe: ' + error.response.data.details)
      }
      
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay modal-overlay--light" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Raportoi ongelma</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {submitStatus === 'success' && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              Tiketti lähetetty onnistuneesti! Vastaamme sinulle pian.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              Virhe tiketin lähettämisessä. Yritä uudelleen tai ota yhteyttä suoraan tukeen.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="page">
                Sivu * <span style={{ fontSize: '12px', color: '#666' }}>(Missä ongelma tapahtui?)</span>
              </label>
              <input
                type="text"
                id="page"
                name="page"
                value={formData.page}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Esimerkki: Posts-sivu, Dashboard, AI Chat..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Kuvaile ongelmaa * <span style={{ fontSize: '12px', color: '#666' }}>(Kerro mahdollisimman yksityiskohtaisesti)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                rows="4"
                placeholder="Esimerkki: Kun yritän lisätä kuvia posts-sivulla, sain virheen 'Kuvan lataus epäonnistui'. Tapahtuu joka kerta kun..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Liitteet <span style={{ fontSize: '12px', color: '#666' }}>(Kuvat, videot tai äänitiedostot)</span>
              </label>
              
              <div
                className={`drag-drop-zone ${dragActive ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: dragActive ? '#f0f8ff' : '#fafafa',
                  transition: 'all 0.3s ease'
                }}
              >
                <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>
                  Vedä ja pudota tiedostoja tähän tai klikkaa valitaksesi
                </p>
                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                  Tuetut: Kuvat (JPG, PNG, GIF), Videot (MP4, WebM), Ääni (MP3, WAV)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {fileError && (
                <div style={{ 
                  color: '#ef4444', 
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚠️</span>
                    <span>{fileError}</span>
                  </div>
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Valitut tiedostot:</h4>
                  {selectedFiles.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>{file.name}</span>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          ({(file.size / 1024 / 1024).toFixed(1)}MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '4px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {selectedFiles.length >= 5 && (
                    <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0 0' }}>
                      Maksimi 5 tiedostoa
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Peruuta
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !formData.page || !formData.description.trim()}
                style={{ minWidth: '120px' }}
              >
                {isSubmitting ? 'Lähetetään...' : 'Lähetä tiketti'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TicketModal
