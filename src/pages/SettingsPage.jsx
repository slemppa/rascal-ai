import React from 'react'
import PageHeader from '../components/PageHeader'
import CarouselTemplateSelector from '../components/CarouselTemplateSelector'

export default function SettingsPage() {
  let user = null
  let assistantId = null
  let companyId = null
  let companyName = null
  let email = null
  let name = null
  let exp = null
  try {
    // Jos user on objektin sisällä (esim. {token, user}), poimi user
    const raw = JSON.parse(localStorage.getItem('user') || 'null')
    if (raw && raw.user) {
      user = raw.user
    } else {
      user = raw
    }
  } catch (e) {}
  if (user) {
    assistantId = user.assistantId || null
    companyId = user.companyId || null
    companyName = user.companyName || null
    email = user.email || null
    name = user.name || null
    exp = user.exp || null
  }

  return (
    <>
      <PageHeader title="Asetukset" />
      <div className="bento-container">
        <div className="bento-grid">
          {/* Vasen sarake - 1/3 */}
          <div className="bento-column-left">
            <div className="bento-card">
              <h2>Käyttäjätiedot</h2>
              <div className="form-group">
                <label>Nimi</label>
                <input type="text" value={name || ''} readOnly className="form-input readonly" />
              </div>
              <div className="form-group">
                <label>Sähköposti</label>
                <input type="email" value={email || ''} readOnly className="form-input readonly" />
              </div>
              <div className="form-group">
                <label>Yritys</label>
                <input type="text" value={companyName || ''} readOnly className="form-input readonly" />
              </div>
            </div>
            
            <div className="bento-card">
              <h2>Tekniset tiedot</h2>
              <div className="form-group">
                <label>Company ID</label>
                <input type="text" value={companyId || ''} readOnly className="form-input readonly" style={{fontFamily: 'monospace'}} />
              </div>
              <div className="form-group">
                <label>Assistant ID</label>
                <input type="text" value={assistantId || ''} readOnly className="form-input readonly" style={{fontFamily: 'monospace'}} />
              </div>
              <div className="form-group">
                <label>Token vanhenee</label>
                <input type="text" value={exp ? new Date(exp * 1000).toLocaleString('fi-FI') : ''} readOnly className="form-input readonly" />
              </div>
            </div>
            
            
          </div>
          
          {/* Oikea sarake - 2/3 */}
          <div className="bento-column-right">
            <div className="bento-card">
              <CarouselTemplateSelector />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bento-container {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .bento-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 32px;
          align-items: start;
        }

        .bento-column-left {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .bento-column-right {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .bento-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          border: 1px solid #e5e7eb;
        }

        .bento-card h2 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-input.readonly {
          background: #f9fafb;
          color: #6b7280;
        }



        @media (max-width: 1024px) {
          .bento-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          
          .bento-container {
            padding: 24px;
          }
        }

        @media (max-width: 768px) {
          .bento-container {
            padding: 16px;
          }
          
          .bento-card {
            padding: 20px;
          }
        }
      `}</style>
    </>
  )
} 