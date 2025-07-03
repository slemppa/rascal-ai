import React from 'react'

export default function VersionUpdateModal({ isOpen, onClose, version, changes }) {
  if (!isOpen) return null

  // Suodatetaan vain käyttäjälle relevantit muutokset
  const userRelevantChanges = changes.filter(change => {
    const type = change.type?.toLowerCase() || ''
    // Näytetään vain features, fixes ja styles - teknisiä muutoksia ei näytetä
    return ['feat', 'fix', 'style'].includes(type)
  })

  const formatChangeType = (type) => {
    const types = {
      'feat': '✨ Uusi ominaisuus',
      'fix': '🐛 Korjaus',
      'style': '💄 Ulkoasu'
    }
    return types[type] || type
  }

  const formatChangeDescription = (description) => {
    // Poistetaan teknistä sanastoa ja tehdään ystävällisemmäksi
    return description
      .replace(/^[a-z]/, (match) => match.toUpperCase()) // Ensimmäinen kirjain isoksi
      .replace(/\[.*?\]/g, '') // Poistetaan hakasulkeet ja niiden sisältö
      .replace(/\(.*?\)/g, '') // Poistetaan sulkeet ja niiden sisältö
      .replace(/commit [a-f0-9]+/gi, '') // Poistetaan commit-hashit
      .replace(/\s+/g, ' ') // Poistetaan ylimääräiset välilyönnit
      .trim()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: 32,
        maxWidth: 500,
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '1px solid #e5e7eb'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img 
              src="/favicon.png" 
              alt="Rascal AI" 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10,
                background: '#f8fafc'
              }} 
            />
            <div>
              <h2 style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: '#1f2937'
              }}>
                Uusi versio saatavilla!
              </h2>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: 14,
                color: '#6b7280'
              }}>
                Versio {version}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#9ca3af',
              padding: 4,
              borderRadius: 8,
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#6b7280'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: 16,
            fontWeight: 600,
            color: '#374151'
          }}>
            Mitä uutta tässä versiossa:
          </h3>
          
          {userRelevantChanges.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {userRelevantChanges.map((change, index) => (
                <div 
                  key={index}
                  style={{
                    padding: 12,
                    background: '#f9fafb',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8
                  }}>
                    <span style={{
                      fontSize: 16,
                      lineHeight: 1
                    }}>
                      {change.type === 'feat' ? '✨' : 
                       change.type === 'fix' ? '🐛' : 
                       change.type === 'style' ? '💄' : '📝'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: 4
                      }}>
                        {formatChangeType(change.type)}
                      </div>
                      <div style={{
                        fontSize: 14,
                        color: '#6b7280',
                        lineHeight: 1.4
                      }}>
                        {formatChangeDescription(change.description)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: 16,
              background: '#f0f9ff',
              borderRadius: 8,
              border: '1px solid #bae6fd',
              color: '#0369a1',
              fontSize: 14
            }}>
              Tässä versiossa on parannuksia ja optimointeja sovelluksen toimintaan.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.background = '#2563eb'}
          >
            Selvä!
          </button>
        </div>
      </div>
    </div>
  )
} 