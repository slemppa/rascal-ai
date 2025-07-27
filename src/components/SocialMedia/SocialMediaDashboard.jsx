// src/components/SocialMedia/SocialMediaDashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMixpostIntegration } from './hooks/useMixpostIntegration';
import { supabase } from '../../lib/supabase';
import PageMeta from '../PageMeta';

const SocialMediaDashboard = () => {
  const { user } = useAuth();
  const {
    mixpostConfig,
    socialAccounts,
    loading,
    error,
    publishContent,
    refreshSocialAccounts,
    isSetupComplete
  } = useMixpostIntegration(user?.id);

  const [aiContent, setAiContent] = useState("Tässä on AI-generoitua sisältöä! 🤖 #AI #content #automation");
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!selectedAccounts.length) {
      alert('Valitse vähintään yksi tili julkaistavaksi');
      return;
    }

    if (!aiContent.trim()) {
      alert('Sisältö ei voi olla tyhjä');
      return;
    }

    setIsPublishing(true);

    try {
      const scheduledAt = isScheduled && scheduleTime ? new Date(scheduleTime).toISOString() : null;
      
      await publishContent(aiContent, selectedAccounts, scheduledAt);
      
      alert('Sisältö julkaistu onnistuneesti!');
      setAiContent('');
      setSelectedAccounts([]);
      setIsScheduled(false);
      setScheduleTime('');
      
      // Päivitä tilit
      await refreshSocialAccounts();
      
    } catch (error) {
      console.error('Julkaisu epäonnistui:', error);
      alert(`Julkaisu epäonnistui: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAccountToggle = (accountId) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  if (!isSetupComplete) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '12px' }}>
          Sosiaalisen median julkaisu ei ole käytössä
        </div>
        <div style={{ fontSize: '14px', color: '#9ca3af' }}>
          Mixpost-konfiguraatio puuttuu. Ota yhteyttä tukeen.
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta 
        title="Sosiaalisen median julkaisu - Rascal AI"
        description="Julkaise sisältöä sosiaaliseen mediaan automaattisesti"
        image="/hero.png"
      />
      
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' }}>
            Sosiaalisen median julkaisu
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
            Julkaise sisältöä yhdistettyihin sosiaalisen median tileihin
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Vasen sarake: Sisältö ja julkaisu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Sisältö */}
            <div style={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px 0', color: '#1f2937' }}>
                Julkaistava sisältö
              </h2>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Sisältö
                </label>
                <textarea
                  value={aiContent}
                  onChange={(e) => setAiContent(e.target.value)}
                  placeholder="Kirjoita julkaistava sisältö..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Aikataulutus */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Aikatauluta julkaisu
                </label>
                
                {isScheduled && (
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                )}
              </div>

              {/* Julkaisu-nappi */}
              <button
                onClick={handlePublish}
                disabled={isPublishing || !selectedAccounts.length || !aiContent.trim()}
                style={{
                  width: '100%',
                  backgroundColor: isPublishing || !selectedAccounts.length || !aiContent.trim() ? '#9ca3af' : '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: isPublishing || !selectedAccounts.length || !aiContent.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {isPublishing ? 'Julkaistaan...' : 'Julkaise sisältö'}
              </button>
            </div>
          </div>

          {/* Oikea sarake: Yhdistetyt tilit */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                Yhdistetyt sometilit
              </h2>
              <button
                onClick={() => refreshSocialAccounts()}
                style={{
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Päivitä
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                Ladataan tilejä...
              </div>
            ) : socialAccounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '12px' }}>
                  Ei yhdistettyjä tilejä
                </div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
                  Yhdistä tilejä julkaistaaksesi sisältöä
                </div>
                <a
                  href="/settings"
                  style={{
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Yhdistä tilejä
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {socialAccounts.map((account, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: selectedAccounts.includes(account.id) ? '#f0f9ff' : '#ffffff'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={() => handleAccountToggle(account.id)}
                      style={{ marginRight: '12px' }}
                    />
                    <span style={{ marginRight: '8px', fontSize: '18px' }}>
                      {account.provider === 'instagram' ? '📷' : '👤'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        {account.name || account.username || account.provider}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {account.provider}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SocialMediaDashboard;