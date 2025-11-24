import React from 'react'

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
  'Leads'
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
    'Dev': 'Kehitys'
  }
  return labels[feature] || feature
}

export default function FeaturesTab({
  features = [],
  isSaving,
  onFeatureToggle
}) {
  // Varmista että features on aina array
  const enabledFeatures = React.useMemo(() => {
    if (!features) return []
    if (!Array.isArray(features)) {
      console.warn('Features is not an array:', features)
      return []
    }
    return features
  }, [features])

  // Debug-logitus
  React.useEffect(() => {
    console.log('FeaturesTab - received features:', features, 'enabledFeatures:', enabledFeatures)
  }, [features, enabledFeatures])

  return (
    <div className="features-tab-container">
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
                    console.log('Feature toggle:', feature, 'checked:', e.target.checked, 'current:', current, 'next:', next)
                    onFeatureToggle(next)
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

