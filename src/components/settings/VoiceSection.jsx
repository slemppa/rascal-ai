import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// Äänitiedostojen upload-komponentti
export default function VoiceSection({ companyId }) {
  const { t } = useTranslation('common')
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = React.useRef(null);

  // Apufunktio: poimi äänitiedostot N8N/Airtable-rakenteesta
  function extractAudioFiles(apiData) {
    if (!Array.isArray(apiData)) return [];
    
    // Etsi äänitiedostot Voice ID -kentästä
    const audioFiles = [];
    for (const record of apiData) {
      // Tarkista onko Voice ID -kenttää
      if (record['Voice ID']) {
        // Voice ID voi olla string tai array
        const voiceIds = Array.isArray(record['Voice ID']) ? record['Voice ID'] : [record['Voice ID']];
        
        for (const voiceId of voiceIds) {
          if (voiceId) {
            audioFiles.push({ 
              url: null, 
              id: voiceId, 
              filename: 'Voice Clone',
              fileType: 'audio',
              voiceId: record["Variable ID"] || record.id,
              isPlaceholder: true
            });
          }
        }
      }
      if (audioFiles.length >= 1) break; // Max 1 äänitiedosto
    }
    return audioFiles.slice(0, 1);
  }

  // Hae äänitiedostot N8N/Airtable-rakenteesta
  const fetchAudioFiles = async () => {
    if (!companyId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/avatars/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });
      
      if (res.ok) {
        const data = await res.json();
        const extractedAudioFiles = extractAudioFiles(data);
        setAudioFiles(extractedAudioFiles);
      } else {
        setError(t('settings.voice.fetchError'));
      }
    } catch (error) {
      setError(t('settings.voice.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Hae äänitiedostot kun komponentti latautuu
  useEffect(() => {
    fetchAudioFiles();
  }, [companyId]);

  // Lisää uusi äänitiedosto (lähetä backendiin)
  const handleAddAudio = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (audioFiles.length >= 1) return; // Max 1 äänitiedosto

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', companyId);

      const res = await fetch('/api/avatars/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        // Odota että äänitiedosto ilmestyy N8N/Airtable-rakenteeseen
        setTimeout(() => {
          fetchAudioFiles();
        }, 3000); // 3 sekunnin viive
        
        // Näytä väliaikainen tila
        setAudioFiles([{
          id: `uploading-${Date.now()}`,
          filename: file.name,
          fileType: data.fileType,
          status: 'uploading'
        }]);
      } else {
        const errorData = await res.json();
        setError(errorData.error || t('settings.voice.uploadError'));
      }
    } catch (e) {
      setError(t('settings.voice.uploadError'));
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleReplaceAudio = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    // Poista vanha äänitiedosto ja lisää uusi
    setAudioFiles([]);
    
    handleAddAudio(e);
  };

  const openFileDialog = () => {
    if (audioFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Tarkista onko ääni löytynyt (placeholder tai oikea)
  const hasAudio = audioFiles.length > 0;
  
  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{t('settings.voice.title')}</h2>
      {loading ? (
        <div style={{ color: '#6b7280', fontSize: 14 }}>{t('settings.voice.loading')}</div>
      ) : hasAudio ? (
        // Ääni löytyi - näytä samanlainen laatikko kuin Avatar-kohdassa
        <div style={{ 
          padding: '32px', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
          borderRadius: '12px',
          border: '2px dashed #cbd5e1',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Dekoratiivinen gradient */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          {/* Sisältö */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Mikrofonikuvake */}
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="2"
              style={{ margin: '0 auto 16px', display: 'block' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <div style={{
              color: '#334155',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '8px'
            }}>
              {t('settings.voice.cloned')}
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              {t('settings.voice.clonedDescription')}
            </div>
          </div>
        </div>
      ) : (
        // Ääntä ei löydy - näytä "Lisää tiedosto" -laatikko
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '12px',
            border: '2px dashed #cbd5e1',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          onClick={openFileDialog}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
          }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openFileDialog();
          }}
          role="button"
          aria-label={t('settings.voice.addNewAria')}
        >
          {/* Dekoratiivinen gradient */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          {/* Sisältö */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#9ca3af" 
              strokeWidth="2"
              style={{ margin: '0 auto 16px', display: 'block' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <div style={{
              color: '#334155',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '8px'
            }}>
              {t('settings.voice.addAudioFile')}
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              {t('settings.voice.dragOrSelect')}
            </div>
          </div>
        </div>
      )}
      {/* Piilotettu file input */}
      <input
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleAddAudio}
        disabled={audioFiles.length >= 1}
      />
      {/* Info-teksti - näytetään vain jos ei ole ääntä */}
      {audioFiles.length === 0 && (
        <div style={{ color: '#6b7280', fontSize: 11, marginTop: 8 }}>
          {t('settings.voice.infoNone', { count: audioFiles.length })}
        </div>
      )}
      {error && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
