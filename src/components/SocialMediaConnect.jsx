import React, { useState } from 'react';
import { useMixpostIntegration } from './SocialMedia/hooks/useMixpostIntegration';

// CSS-animaatio spin-efektille
const spinAnimation = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const SocialMediaConnect = () => {
  const {
    socialAccounts,
    savedSocialAccounts,
    loading,
    error,
    connectSocialAccount,
    fetchSavedSocialAccounts,
    fetchSocialAccounts
  } = useMixpostIntegration();

  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'facebook', name: 'Facebook', icon: '📘' }
  ];

  const handleConnectAccount = async (platform) => {
    try {
      setConnecting(platform);
      setConnectionError(null);
      console.log(`🔄 Yhdistetään ${platform}...`);
      
      await connectSocialAccount(platform);
      console.log(`✅ ${platform} yhdistetty onnistuneesti!`);
      
      // Päivitä tallennetut tilit
      await fetchSavedSocialAccounts();
      
    } catch (error) {
      setConnectionError(error.message);
      const errorMessage = `Virhe yhdistettäessä ${platform}: ${error.message}`;
      alert(errorMessage);
    } finally {
      setConnecting(null);
    }
  };

  // Käytä Mixpostista haettuja tilejä oletuksena
  const connectedAccounts = socialAccounts || [];

  // Apufunktio profiilikuvan URL:n luomiseen
  const getProfileImageUrl = (account) => {
    // Jos tilillä on suora profile_image_url, käytä sitä
    if (account.profile_image_url) {
      return account.profile_image_url;
    }
    
    // Jos tilillä on image-kenttä, käytä sitä
    if (account.image) {
      return account.image;
    }
    
    // Jos tilillä on picture-kenttä, käytä sitä
    if (account.picture) {
      return account.picture;
    }
    
    return null;
  };

  const handleRefreshAccounts = async () => {
    try {
      await fetchSocialAccounts();
    } catch (error) {
      setConnectionError('Virhe päivittäessä tilejä: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-block',
          width: '20px',
          height: '20px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ margin: '8px 0 0 0', color: '#6b7280' }}>Ladataan sometilejä...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
        <p>Virhe sometilien haussa: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <style>{spinAnimation}</style>
      
      <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
        Sosiaalisen median yhdistäminen
      </h2>
      
      {error && (
        <div style={{ 
          padding: '8px 12px', 
          borderRadius: '6px', 
          marginBottom: '12px',
          fontSize: '14px',
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Yhdistetyt tilit - Mixpost-tyylinen kortti */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>
            Yhdistetyt sometilit ({connectedAccounts.length})
          </h3>
          <button
            onClick={handleRefreshAccounts}
            disabled={loading}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Päivitetään...' : '🔄 Päivitä'}
          </button>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          {/* Yhdistetyt tilit */}
          {connectedAccounts.map((account, index) => (
            <div key={index} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Profiilikuva */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '600',
                color: '#6b7280'
              }}>
                {getProfileImageUrl(account) ? (
                  <img 
                    src={getProfileImageUrl(account)} 
                    alt={account.name || account.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div style={{ 
                  display: getProfileImageUrl(account) ? 'none' : 'flex',
                  width: '100%', 
                  height: '100%', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  {(account.name || account.username || '?').charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Tilin tiedot */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#111827',
                  marginBottom: '2px'
                }}>
                  {account.name || account.username}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  @{account.username}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#9ca3af'
                }}>
                  Lisätty {account.created_at ? new Date(account.created_at).toLocaleDateString('fi-FI') : 'tuntematon'}
                </div>
              </div>

              {/* Platform-ikoni */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: account.provider === 'instagram' ? '#E4405F' : '#1877F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: 'white'
              }}>
                {account.provider === 'instagram' ? '📷' : '📘'}
              </div>
            </div>
          ))}

          {/* "Lisää tili" -kortti */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px dashed #d1d5db',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minHeight: '80px'
          }}
          onMouseEnter={(e) => e.target.style.borderColor = '#9ca3af'}
          onMouseLeave={(e) => e.target.style.borderColor = '#d1d5db'}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>➕</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Lisää tili</div>
            </div>
          </div>
        </div>
      </div>

      {/* Yhdistä tilit -osio */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
          Yhdistä uusi tili
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {platforms.map((platform) => {
            const isConnected = connectedAccounts.some(account => 
              account.provider === platform.id
            );
            const isConnecting = connecting === platform.id;
            
            return (
              <button
                key={platform.id}
                onClick={() => handleConnectAccount(platform.id)}
                disabled={isConnected || isConnecting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: isConnected ? '#f3f4f6' : '#ffffff',
                  border: `1px solid ${isConnected ? '#d1d5db' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: isConnected || isConnecting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isConnected ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isConnected && !isConnecting) {
                    e.target.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isConnected && !isConnecting) {
                    e.target.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                <div style={{ fontSize: '20px' }}>{platform.icon}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    {platform.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {isConnected ? 'Yhdistetty' : isConnecting ? 'Yhdistetään...' : 'Klikkaa yhdistääksesi'}
                  </div>
                </div>
                {isConnecting && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #e5e7eb',
                    borderTop: '2px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
                {isConnected && (
                  <div style={{ fontSize: '16px', color: '#10b981' }}>✅</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {connectionError && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px'
        }}>
          {connectionError}
        </div>
      )}
    </div>
  );
};

export default SocialMediaConnect; 