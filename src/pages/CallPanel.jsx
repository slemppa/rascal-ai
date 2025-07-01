import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './CallPanel.css'
import CallStats from './CallStats'
import PageHeader from '../components/PageHeader'

export default function CallPanel() {
  const [sheetUrl, setSheetUrl] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [callStatus, setCallStatus] = useState(null)
  const [polling, setPolling] = useState(false)
  const pollingRef = useRef(null)
  const [stats, setStats] = useState({ totalCount: 0, calledCount: 0, failedCount: 0 })

  const handleValidate = async () => {
    setValidating(true)
    setError('')
    setValidationResult(null)
    try {
      // Placeholder URL
      const res = await axios.post('https://oma-n8n-url.fi/webhook/validate-sheet', { sheetUrl })
      setValidationResult(res.data)
      setStats({
        totalCount: res.data.phoneCount || 0,
        calledCount: 0,
        failedCount: 0
      })
    } catch (e) {
      setError('Validointi epäonnistui')
    } finally {
      setValidating(false)
    }
  }

  const handleStartCalls = async () => {
    setStarting(true)
    setError('')
    try {
      // Placeholder URL
      await axios.post('https://oma-n8n-url.fi/webhook/start-calls', { sheetUrl })
      setPolling(true)
    } catch (e) {
      setError('Soittojen käynnistys epäonnistui')
    } finally {
      setStarting(false)
    }
  }

  // Pollaa soittojen tilaa 5s välein
  useEffect(() => {
    if (polling) {
    pollingRef.current = setInterval(async () => {
      try {
          const res = await axios.get('https://oma-n8n-url.fi/webhook/call-status')
        setCallStatus(res.data)
          setStats(res.data.stats || stats)
          
          // Pysäytä polling jos kaikki soittot on tehty
          if (res.data.status === 'completed') {
            setPolling(false)
          }
      } catch (e) {
          console.error('Polling error:', e)
      }
    }, 5000)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [polling])

  return (
    <>
      <PageHeader title="Puhelut" />
      <div style={{ padding: 32 }}>
        {/* Kehitysvaroitus */}
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>
            🚧 Tätä työstetään
          </div>
          <div style={{ color: '#a16207', fontSize: 14 }}>
            Puheluominaisuus on kehityksessä. Toiminnot eivät ole vielä käytettävissä.
          </div>
        </div>
        
        <div style={{ marginTop: 24, maxWidth: 600 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 600 }}>
              Aloita puhelut
            </h2>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Google Sheets URL
              </label>
            <input
                type="url"
              value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleValidate}
              disabled={validating || !sheetUrl}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: validating || !sheetUrl ? 'not-allowed' : 'pointer',
                  opacity: validating || !sheetUrl ? 0.6 : 1
                }}
            >
                {validating ? 'Validoitaan...' : 'Validoi'}
            </button>
              
              <button
                onClick={handleStartCalls}
                disabled={starting || !validationResult}
                style={{
                  padding: '12px 24px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: starting || !validationResult ? 'not-allowed' : 'pointer',
                  opacity: starting || !validationResult ? 0.6 : 1
                }}
              >
                {starting ? 'Käynnistetään...' : 'Aloita soittot'}
              </button>
            </div>
            
            {error && (
              <div style={{
                marginTop: 16,
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626'
              }}>
                {error}
              </div>
            )}
            
            {validationResult && (
              <div style={{
                marginTop: 16,
                padding: '12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                color: '#16a34a'
              }}>
                <strong>Validointi onnistui!</strong><br/>
                Löydetty {validationResult.phoneCount} puhelinnumeroa.
              </div>
            )}
          </div>
          
          {callStatus && (
            <CallStats 
              status={callStatus.status}
              stats={stats}
              calls={callStatus.calls || []}
            />
          )}
        </div>
      </div>
    </>
  )
} 