import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './CallPanel.css'
import CallStats from './CallStats'
import { Trans, t } from '@lingui/macro'

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
    if (!polling) return
    pollingRef.current = setInterval(async () => {
      try {
        // Placeholder URL
        const res = await axios.post('https://oma-n8n-url.fi/webhook/call-status', { sheetUrl })
        setCallStatus(res.data)
      } catch (e) {
        setError('Soittojen tilan haku epäonnistui')
      }
    }, 5000)
    return () => clearInterval(pollingRef.current)
  }, [polling, sheetUrl])

  return (
    <>
      <div style={{
        background: 'var(--brand-dark)',
        color: '#fff',
        borderBottom: '1px solid #e2e8f0',
        paddingTop: 32,
        paddingBottom: 24
      }}>
        <h1 style={{margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1.2}}><Trans>Soita osallistujille</Trans></h1>
      </div>
      <div style={{maxWidth: 900, padding: '0 8px'}}>
        <CallStats stats={stats} />
        <div className="callpanel-root" style={{maxWidth: 480, margin: '2rem 0 0 32px', background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', border: '1px solid #e1e8ed', padding: 32}}>
          <h1 style={{fontSize: 26, fontWeight: 800, marginBottom: 24}}><Trans>Soita osallistujille</Trans></h1>
          <label style={{display: 'block', fontWeight: 600, marginBottom: 8}}><Trans>Google Sheets -linkki:</Trans></label>
          <input
            type="text"
            value={sheetUrl}
            onChange={e => setSheetUrl(e.target.value)}
            placeholder={t`Liitä Google Sheets -linkki...`}
            style={{width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #e1e8ed', fontSize: 16, marginBottom: 16, background: '#f7fafc'}}
          />
          <button
            onClick={handleValidate}
            disabled={validating || !sheetUrl}
            style={{background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, fontSize: 17, cursor: validating ? 'not-allowed' : 'pointer', marginBottom: 18}}
          >
            {validating ? <Trans>Tarkistetaan...</Trans> : <Trans>Tarkista osallistujat</Trans>}
          </button>
          {error && <div style={{color: '#e53e3e', fontWeight: 600, marginBottom: 12}}>{error}</div>}
          {validationResult && (
            <div style={{marginBottom: 18, fontSize: 16, color: '#2563eb', fontWeight: 600}}>
              <Trans>Puhelinnumeroita löytyi:</Trans> {validationResult.phoneCount || 0}
            </div>
          )}
          {validationResult && (
            <button
              onClick={handleStartCalls}
              disabled={starting}
              style={{background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, fontSize: 17, cursor: starting ? 'not-allowed' : 'pointer', marginBottom: 18}}
            >
              {starting ? <Trans>Käynnistetään...</Trans> : <Trans>Käynnistä soitot</Trans>}
            </button>
          )}
          {callStatus && (
            <div style={{marginTop: 18, fontSize: 16}}>
              <div style={{marginBottom: 6}}><b>Soitettu:</b> {callStatus.completed || 0}</div>
              <div style={{marginBottom: 6}}><b>Epäonnistunut:</b> {callStatus.failed || 0}</div>
              <div style={{marginBottom: 6}}><b>Jäljellä:</b> {callStatus.remaining || 0}</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 