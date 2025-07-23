import React, { useState, useEffect } from 'react'
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
          {/* Vasen sarake: Käyttäjätiedot */}
          <div className="bento-card bento-column-left">
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
          {/* Oikea sarake: Avatar + Karuselli samassa kortissa */}
          <div className="bento-card bento-column-right">
            <AvatarSectionMulti companyId={companyId} />
            <div style={{ marginTop: 32 }}>
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
      `}</style>
    </>
  )
} 

// Moderni monikuvakomponentti Tailwindilla, hakee kuvat backendistä companyId:lla
function AvatarSectionMulti({ companyId }) {
  const [images, setImages] = useState([]); // [{url, id}]
  const fileInputRef = React.useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Apufunktio: poimi avatar-kuvat N8N/Airtable-rakenteesta
  function extractAvatarImages(apiData) {
    if (!Array.isArray(apiData)) return [];
    // Etsi kaikki Media[] url:t, käytä thumb/full/large jos löytyy
    const images = [];
    for (const record of apiData) {
      if (Array.isArray(record.Media)) {
        for (const media of record.Media) {
          let url = null;
          if (media.thumbnails?.full?.url) url = media.thumbnails.full.url;
          else if (media.thumbnails?.large?.url) url = media.thumbnails.large.url;
          else if (media.url) url = media.url;
          if (url) {
            images.push({ url, id: media.id || url, variableId: record["Variable ID"] || record.id });
          }
        }
      }
      if (images.length >= 4) break;
    }
    return images.slice(0, 4);
  }

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError('');
    fetch('/api/avatar-status.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId })
    })
      .then(res => res.json())
      .then(data => {
        // data voi olla array (Airtable/N8N), poimi Media[] url:t
        setImages(extractAvatarImages(data));
      })
      .catch(() => setError('Kuvien haku epäonnistui'))
      .finally(() => setLoading(false));
  }, [companyId]);

  // Lisää uusi kuva (vain local stateen, ei backend)
  const handleAddImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (images.length >= 4) return;
    const url = URL.createObjectURL(file);
    setImages((prev) => [...prev, { url, id: `local-${Date.now()}` }]);
    e.target.value = "";
  };

  // Poista kuva backendistä (avatar-delete)
  const handleDeleteAvatar = async (avatarId) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/avatar-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, avatarId })
      })
      const data = await res.json()
      if (data.success) {
        setImages((prev) => prev.filter(img => img.id !== avatarId))
      } else {
        setError(data.error || 'Poisto epäonnistui')
      }
    } catch (e) {
      setError('Poisto epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  // Poista kuva (vain local stateesta)
  const handleRemoveImage = (idx) => {
    setImages((prev) => {
      if (prev[idx]?.url?.startsWith('blob:')) URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const openFileDialog = () => {
    if (images.length < 4 && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bento-card p-6 mb-6 avatar-card-equal-height">
      <h2 className="text-lg font-semibold mb-4">Avatar-kuvat</h2>
      {loading ? (
        <div className="text-gray-400 text-sm">Ladataan kuvia...</div>
      ) : (
        <div className="avatar-grid">
          {[0, 1, 2, 3].map((slot) => {
            const img = images[slot];
            return img ? (
              <div
                key={img.id || slot}
                className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white transition hover:shadow-lg flex items-center justify-center aspect-square w-32 h-32 md:w-40 md:h-40 mx-auto"
              >
                <img
                  src={img.url}
                  alt={`Avatar ${slot + 1}`}
                  className="w-full h-full object-cover rounded-xl mx-auto transition-transform duration-200 group-hover:scale-105"
                  style={{maxWidth: '100%', maxHeight: '100%'}}
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition opacity-100 z-20 shadow"
                  onClick={() => handleDeleteAvatar(img.variableId)}
                  aria-label="Poista kuva"
                  tabIndex={-1}
                >
                  {/* Selkeä punainen raksi */}
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="#fff"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                    style={{ filter: 'drop-shadow(0 0 2px #b91c1c)' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                key={slot}
                className="bg-gray-100 rounded-xl flex flex-col items-center justify-center aspect-square w-32 h-32 md:w-40 md:h-40 border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition group relative mx-auto"
                onClick={openFileDialog}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openFileDialog();
                }}
                role="button"
                aria-label="Lisää uusi kuva"
              >
                <svg
                  className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="mt-2 text-gray-500 text-sm group-hover:text-blue-500 transition text-center">
                  Lisää uusi
                </span>
              </div>
            );
          })}
        </div>
      )}
      {/* Piilotettu file input */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleAddImage}
        disabled={images.length >= 4}
      />
      {/* Info-teksti */}
      <div className="text-xs text-gray-400 mt-3">
        {images.length}/4 kuvaa lisätty. Voit lisätä max 4 kuvaa.
      </div>
      {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
      <style jsx>{`
        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 16px;
          justify-items: center;
          align-items: center;
        }
        /* Sama korkeus avatar-kortille kuin vasemman sarakkeen kortille desktopilla */
        @media (min-width: 1025px) {
          .avatar-card-equal-height {
            height: 100%;
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
} 