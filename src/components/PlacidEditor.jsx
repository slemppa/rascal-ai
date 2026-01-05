import React, { useEffect, useState, useRef } from 'react'
import styles from './PlacidEditor.module.css'

export default function PlacidEditor({ placidId, onClose }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const containerRef = useRef(null)
  const editorInstanceRef = useRef(null)

  // 1. Load Placid SDK Script
  useEffect(() => {
    // Aseta SDK konfiguraatio ennen SDK:n lataamista
    window.EditorSDKConfig = {
      theme: {
        primary_color: '#ff6600',   // Rascal AI oranssi
        secondary_color: '#cea78d'  // Rascal AI beige/kulta
      }
    }

    const scriptId = 'placid-sdk'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://sdk.placid.app/editor-sdk@latest/sdk.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  // 2. Initialize Editor
  useEffect(() => {
    let checkSdkInterval = null;

    const initEditor = async () => {
      if (!placidId) return

      try {
        setLoading(true)
        setError(null)

        // Odota että SDK on latautunut
        checkSdkInterval = setInterval(async () => {
          if (window.EditorSDK) {
            clearInterval(checkSdkInterval)
            
            try {
              // Hae Auth Token backendistä
              const response = await fetch('/api/placid/auth')
              const data = await response.json()
              
              if (!response.ok) {
                  if (data.error === 'CONFIGURATION_ERROR') {
                    throw new Error(data.message)
                  }
                  throw new Error(data.message || data.error || 'Autentikaatio epäonnistui')
              }
              
              const { token } = data

              // Alusta editori
              if (containerRef.current) {
                  // Tyhjennä container ja tuhoa vanha instanssi jos on
                  if (editorInstanceRef.current) {
                      try {
                          editorInstanceRef.current.destroy();
                      } catch (e) { console.warn('Old editor destroy failed', e) }
                  }
                  containerRef.current.innerHTML = ''
                  
                  // Luo uusi instanssi
                  const instance = await window.EditorSDK.editor.create(containerRef.current, {
                      access_token: token,
                      template_uuid: placidId,
                      prefill_layers: {}
                  })

                  editorInstanceRef.current = instance;

                  // Kuuntele eventtejä
                  instance.on('editor:closed', () => {
                      console.log('Editor closed via internal button');
                      onClose();
                  });

                  instance.on('editor:template:saved', () => {
                      console.log('Template saved');
                      // Tässä voisi näyttää toastin tai päivittää listan
                  });
              }
              setLoading(false)
            } catch (err) {
              console.error('Editor initialization error:', err)
              setError(err.message)
              setLoading(false)
            }
          }
        }, 100)

      } catch (err) {
        console.error('Error initializing Placid Editor:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    initEditor()

    // Cleanup function
    return () => {
        if (checkSdkInterval) clearInterval(checkSdkInterval);
        
        // Timeout cleanup varmuuden vuoksi, koska destroy voi olla async
        if (editorInstanceRef.current) {
            try {
                // Dokumentaation mukaan destroy() on metodi
                editorInstanceRef.current.destroy(); 
                editorInstanceRef.current = null;
            } catch (e) {
                console.warn('Editor cleanup error:', e);
            }
        }
    }
  }, [placidId, onClose]) // Lisätty onClose dependencyyn

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
            <h3>Muokkaa mallia</h3>
            <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        {error ? (
          <div className="p-8 text-center">
            <div style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 500 }}>
              Virhe editorin latauksessa
            </div>
            <div style={{ color: '#374151', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
              {error}
            </div>
          </div>
        ) : (
          <div className={styles.editorWrapper}>
            {loading && <div className="p-8 text-center text-gray-500 absolute inset-0 flex items-center justify-center bg-white z-10">Ladataan editoria...</div>}
            <div id="editor" ref={containerRef} className={styles.editorFrame}></div>
          </div>
        )}
      </div>
    </div>
  )
}
