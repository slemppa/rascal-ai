import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function TestN8NPage() {
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [testData, setTestData] = useState('{"test": "value", "message": "Tämä on testidata"}')

  useEffect(() => {
    async function getToken() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError('Virhe session haussa: ' + sessionError.message)
          return
        }

        if (!session?.access_token) {
          setError('Ei aktiivista sessiota. Kirjaudu ensin sisään.')
          return
        }

        setToken(session.access_token)
      } catch (err) {
        setError('Virhe: ' + err.message)
      }
    }

    getToken()
  }, [])

  const handleTest = async () => {
    if (!token) {
      setError('Token puuttuu. Kirjaudu uudelleen sisään.')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      let parsedData
      try {
        parsedData = JSON.parse(testData)
      } catch (e) {
        setError('Virheellinen JSON: ' + e.message)
        setLoading(false)
        return
      }

      const response = await fetch('/api/test/n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: parsedData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(`HTTP ${response.status}: ${JSON.stringify(data, null, 2)}`)
      } else {
        setResponse(data)
      }
    } catch (err) {
      setError('Virhe: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      alert('Token kopioitu leikepöydälle!')
    }
  }

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '900px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ marginBottom: '1rem' }}>N8N Test Endpoint</h1>
      
      {/* Token status */}
      <div style={{ 
        padding: '1rem', 
        background: token ? '#d4edda' : '#f8d7da',
        border: `1px solid ${token ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px',
        marginBottom: '1.5rem'
      }}>
        <strong>Token status:</strong> {token ? (
          <span style={{ color: '#155724' }}>
            ✅ Löytyi ({token.length} merkkiä)
            <button 
              onClick={copyToken}
              style={{
                marginLeft: '1rem',
                padding: '0.25rem 0.5rem',
                fontSize: '12px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Kopioi token
            </button>
          </span>
        ) : (
          <span style={{ color: '#721c24' }}>❌ Ei tokenia</span>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div style={{ 
          padding: '1rem', 
          background: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '1rem',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          <strong>Virhe:</strong><br />
          {error}
        </div>
      )}

      {/* Test data input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Testidata (JSON):
        </label>
        <textarea
          value={testData}
          onChange={(e) => setTestData(e.target.value)}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px',
            resize: 'vertical'
          }}
          placeholder='{"test": "value"}'
        />
      </div>

      {/* Send button */}
      <button 
        onClick={handleTest}
        disabled={!token || loading}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '16px',
          background: token && !loading ? '#007bff' : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: token && !loading ? 'pointer' : 'not-allowed',
          fontWeight: 'bold',
          marginBottom: '1.5rem'
        }}
      >
        {loading ? 'Lähetetään...' : 'Lähetä POST-kutsu'}
      </button>

      {/* Response display */}
      {response && (
        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Vastaus:</h2>
          <pre style={{
            background: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      {/* Curl example */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#f8f9fa',
        borderRadius: '4px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginTop: 0 }}>Curl-kutsu:</h3>
        <pre style={{
          background: '#fff',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px',
          margin: 0
        }}>
{`curl -X POST http://localhost:3000/api/test/n8n \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token ? token.substring(0, 50) + '...' : 'YOUR_TOKEN_HERE'}" \\
  -d '{
    "data": ${testData}
  }'`}
        </pre>
      </div>
    </div>
  )
}
