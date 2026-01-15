import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

export default function TestTokenPage() {
  const { t } = useTranslation('common')
  const [token, setToken] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function getToken() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(sessionError.message)
          return
        }

        if (!session?.access_token) {
          setError('Ei aktiivista sessiota. Kirjaudu ensin sisään.')
          return
        }

        setToken(session.access_token)
      } catch (err) {
        setError(err.message)
      }
    }

    getToken()
  }, [])

  const copyToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      alert(t('alerts.success.tokenCopied'))
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test Token Page</h1>
      
      {error && (
        <div style={{ 
          padding: '1rem', 
          background: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <strong>Virhe:</strong> {error}
        </div>
      )}

      {token ? (
        <div>
          <h2>Token löytyi!</h2>
          <button 
            onClick={copyToClipboard}
            style={{
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            Kopioi token
          </button>
          
          <div style={{
            background: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            wordBreak: 'break-all',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {token}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3>Curl-kutsu:</h3>
            <pre style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              overflow: 'auto'
            }}>
{`# HUOM: /api/test/* on poistettu käytöstä (api/_test ei reitity Vercelissä)
# Käytä oikeaa endpointia tai aja dev/testit paikallisesti.
#
# Esimerkki (korvaa oikealla endpointilla):
# curl -X POST http://localhost:3000/api/<endpoint> \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token.substring(0, 50)}..." \\
  -d '{
    "data": {
      "test": "value"
    }
  }'`}
            </pre>
          </div>
        </div>
      ) : (
        <div>
          <p>Ladataan tokenia...</p>
        </div>
      )}
    </div>
  )
}
