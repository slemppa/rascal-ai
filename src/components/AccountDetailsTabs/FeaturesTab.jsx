import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const ALL_FEATURES = [
  'Campaigns',
  'Segments',
  'CRM',
  'Phone Calls',
  'Social Media',
  'Marketing assistant',
  'Email marketing integration',
  'Dev',
  'Voicemail',
  'Leads',
  'UGC'
]

const getFeatureLabel = (feature) => {
  const labels = {
    'Voicemail': 'Vastaaja',
    'Leads': 'Liidit',
    'Marketing assistant': 'Markkinointiassistentti',
    'Email marketing integration': 'Sähköpostimarkkinoinnin integraatio',
    'Phone Calls': 'Puhelut',
    'Social Media': 'Sosiaalinen media',
    'Campaigns': 'Kampanjat',
    'Segments': 'Segmentit',
    'CRM': 'CRM',
    'Dev': 'Kehitys',
    'UGC': 'UGC'
  }
  return labels[feature] || feature
}

export default function FeaturesTab({
  features = [],
  isSaving,
  onFeatureToggle,
  userId // Käyttäjän/organisaation ID
}) {
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [onboardingLoading, setOnboardingLoading] = useState(true)
  const [onboardingSaving, setOnboardingSaving] = useState(false)
  const [onboardingMessage, setOnboardingMessage] = useState('')

  // Lataa onboarding_completed arvo
  useEffect(() => {
    if (!userId) {
      setOnboardingLoading(false)
      return
    }

    const loadOnboardingStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error loading onboarding status:', error)
        } else {
          setOnboardingCompleted(data?.onboarding_completed || false)
        }
      } catch (error) {
        console.error('Error in loadOnboardingStatus:', error)
      } finally {
        setOnboardingLoading(false)
      }
    }

    loadOnboardingStatus()
  }, [userId])

  // Tallenna onboarding_completed arvo
  const handleOnboardingToggle = async (newValue) => {
    if (!userId || onboardingSaving) return

    setOnboardingSaving(true)
    setOnboardingMessage('')

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          onboarding_completed: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw error
      }

      setOnboardingCompleted(newValue)
      setOnboardingMessage('Onboarding-status päivitetty onnistuneesti!')
      setTimeout(() => setOnboardingMessage(''), 3000)
    } catch (error) {
      console.error('Error saving onboarding status:', error)
      setOnboardingMessage('Virhe onboarding-statusin tallennuksessa')
      setTimeout(() => setOnboardingMessage(''), 5000)
    } finally {
      setOnboardingSaving(false)
    }
  }

  // Varmista että features on aina array
  const enabledFeatures = React.useMemo(() => {
    if (!features) return []
    if (!Array.isArray(features)) {
      console.warn('Features is not an array:', features)
      return []
    }
    return features
  }, [features])


  return (
    <div className="features-tab-container">
      {/* Onboarding-osio */}
      <div className="onboarding-section" style={{
        marginBottom: '32px',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '16px', 
          fontWeight: 600, 
          color: '#1f2937' 
        }}>
          Onboarding
        </h3>
        <p style={{ 
          margin: '0 0 16px 0', 
          fontSize: '14px', 
          color: '#6b7280' 
        }}>
          Onko käyttäjän onboarding suoritettu? Jos onboarding on valmis, onboarding-modaali ei näy käyttäjälle.
        </p>

        {onboardingMessage && (
          <div style={{
            padding: '8px 12px',
            marginBottom: '16px',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: onboardingMessage.includes('Virhe') ? '#fef2f2' : '#f0fdf4',
            color: onboardingMessage.includes('Virhe') ? '#dc2626' : '#16a34a',
            border: `1px solid ${onboardingMessage.includes('Virhe') ? '#fecaca' : '#bbf7d0'}`
          }}>
            {onboardingMessage}
          </div>
        )}

        {onboardingLoading ? (
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Ladataan...</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              color: !onboardingCompleted ? '#1f2937' : '#9ca3af',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}>
              Ei valmis
            </label>
            
            {/* Liukukytkin */}
            <button
              type="button"
              onClick={() => handleOnboardingToggle(!onboardingCompleted)}
              disabled={onboardingSaving}
              style={{
                position: 'relative',
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                cursor: onboardingSaving ? 'not-allowed' : 'pointer',
                backgroundColor: onboardingCompleted ? '#10b981' : '#6b7280',
                transition: 'background-color 0.3s',
                outline: 'none',
                padding: '2px'
              }}
              onMouseEnter={(e) => {
                if (!onboardingSaving) {
                  e.target.style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: onboardingCompleted ? '26px' : '2px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                transition: 'left 0.3s',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }} />
            </button>

            <label style={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              color: onboardingCompleted ? '#1f2937' : '#9ca3af',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}>
              Valmis
            </label>
          </div>
        )}
      </div>

      <div className="features-description">
        <p>Hallitse käyttäjän käytössä olevia ominaisuuksia. Ota ominaisuudet käyttöön tai poista ne käytöstä vaihtamalla kytkintä.</p>
      </div>

      <div className="features-list">
        {ALL_FEATURES.map(feature => {
          const isEnabled = enabledFeatures.includes(feature)
          
          return (
            <div key={feature} className="feature-item">
              <div className="feature-info">
                <span className="feature-name">{getFeatureLabel(feature)}</span>
                <span className="feature-key">{feature}</span>
              </div>
              <label className="feature-switch">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => {
                    const current = Array.isArray(features) ? features : []
                    const next = e.target.checked 
                      ? Array.from(new Set([...current, feature])) 
                      : current.filter(x => x !== feature)
                    if (onFeatureToggle) {
                      onFeatureToggle(next)
                    } else {
                      console.error('FeaturesTab - onFeatureToggle is not defined!')
                    }
                  }}
                  disabled={isSaving}
                  aria-label={getFeatureLabel(feature)}
                />
                <span className="switch-slider" />
              </label>
            </div>
          )
        })}
      </div>

      {enabledFeatures.length === 0 && (
        <div className="no-features-message">
          <p>Käyttäjällä ei ole yhtään aktiivista ominaisuutta.</p>
        </div>
      )}

      <div className="features-summary">
        <div className="summary-item">
          <span className="summary-label">Aktiivisia ominaisuuksia:</span>
          <span className="summary-value">{enabledFeatures.length} / {ALL_FEATURES.length}</span>
        </div>
      </div>
    </div>
  )
}

