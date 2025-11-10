import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './LeadMagnetPage.css'

export default function LeadMagnetPage() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchLeadMagnet = async () => {
      try {
        const response = await fetch(`/api/leadmagnet/${token}`)
        
        if (!response.ok) {
          throw new Error('Lead magnet not found')
        }

        const result = await response.json()
        setData(result)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching lead magnet:', err)
        setError('Videota ei löytynyt tai se ei ole vielä valmis.')
        setLoading(false)
      }
    }

    if (token) {
      fetchLeadMagnet()
    }
  }, [token])

  if (loading) {
    return (
      <div className="leadmagnet-page">
        <div className="leadmagnet-container">
          <div className="leadmagnet-loading">
            <div className="spinner"></div>
            <p>Ladataan videota...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="leadmagnet-page">
        <div className="leadmagnet-container">
          <div className="leadmagnet-error">
            <h1>❌ Videota ei löytynyt</h1>
            <p>{error || 'Tarkista linkki sähköpostistasi.'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (data.status === 'processing') {
    return (
      <div className="leadmagnet-page">
        <div className="leadmagnet-container">
          <div className="leadmagnet-processing">
            <div className="pulse-animation">⚙️</div>
            <h1>Videosi käsitellään</h1>
            <p>Videosi on parhaillaan työn alla ja valmistuu pian!</p>
            <p className="email-info">Lähetämme uuden linkin osoitteeseen <strong>{data.email}</strong> kun video on valmis.</p>
            <button 
              className="refresh-button"
              onClick={() => window.location.reload()}
            >
              🔄 Päivitä sivu
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="leadmagnet-page">
      <div className="leadmagnet-container">
        <div className="leadmagnet-header">
          <h1>Videosi on valmis! 🎉</h1>
          <p>Katso henkilökohtainen videosi alta</p>
        </div>

        <div className="leadmagnet-video-wrapper">
          <video 
            controls 
            className="leadmagnet-video"
            poster="/assets/video-poster.jpg"
          >
            <source src={data.videoUrl} type="video/mp4" />
            Selaimesi ei tue videoita.
          </video>
        </div>

        <div className="leadmagnet-info">
          <div className="info-card">
            <h2>💡 Mitä seuraavaksi?</h2>
            <p>
              Haluatko oppia lisää siitä, miten voimme auttaa yritystäsi kasvamaan 
              tekoälyn avulla? Varaa maksuton konsultaatio asiantuntijamme kanssa.
            </p>
            <a 
              href="https://calendar.app.google/LiXrLDnPEGMb4eoS9" 
              className="cta-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              📅 Varaa ilmainen konsultaatio
            </a>
          </div>

          <div className="info-card">
            <h2>🚀 Rascal AI - Tekoäly työkalukanava</h2>
            <p>
              Automaatiolla tehostamme asiakaspalveluasi, markkinointiasi ja 
              myyntiäsi. Rakennamme räätälöityjä tekoälyratkaisuja yrityksesi tarpeisiin.
            </p>
            <div className="features-list">
              <div className="feature-item">✅ AI-puhelinmyynti</div>
              <div className="feature-item">✅ Asiakaspalvelubotit</div>
              <div className="feature-item">✅ Markkinoinnin automaatio</div>
              <div className="feature-item">✅ Räätälöidyt AI-ratkaisut</div>
            </div>
          </div>

          <div className="info-card contact-card">
            <h2>📞 Ota yhteyttä</h2>
            <p>Kysyttävää? Autamme mielellämme!</p>
            <div className="contact-info">
              <a href="mailto:info@rascal.fi" className="contact-link">
                📧 info@rascal.fi
              </a>
              <a href="https://rascal.fi" className="contact-link" target="_blank" rel="noopener noreferrer">
                🌐 rascal.fi
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

