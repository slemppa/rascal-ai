import React, { useState } from 'react';
import { useMixpostIntegration } from './SocialMedia/hooks/useMixpostIntegration';
import './SocialMediaConnect.css';

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
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' }
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

  const handleRefreshAccounts = async () => {
    try {
      await fetchSocialAccounts();
      await fetchSavedSocialAccounts();
    } catch (error) {
      console.error('Virhe päivitettäessä tilejä:', error);
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

  return (
    <div className="social-media-connect">
      <style>{spinAnimation}</style>
      
      <h2 className="social-media-title">
        Sosiaalisen median yhdistäminen
      </h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Yhdistetyt tilit - Mixpost-tyylinen kortti */}
      <div className="connected-accounts-section">
        <div className="accounts-header">
          <h3 className="accounts-title">
            Yhdistetyt sometilit ({connectedAccounts.length})
          </h3>
          <button
            onClick={handleRefreshAccounts}
            disabled={loading}
            className="refresh-button"
          >
            {loading ? 'Päivitetään...' : '🔄 Päivitä'}
          </button>
        </div>
        
        <div className="accounts-grid">
          {/* Yhdistetyt tilit */}
          {connectedAccounts.map((account, index) => (
            <div key={index} className="account-card">
              {/* Profiilikuva */}
              <div className={`profile-image ${account.provider}`}>
                {getProfileImageUrl(account) ? (
                  <img 
                    src={getProfileImageUrl(account)} 
                    alt={account.name || account.username}
                    className="profile-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="profile-fallback">
                  {(account.name || account.username || '?').charAt(0).toUpperCase()}
                </div>
                                {/* Platform-ikoni profiilikuvan alaosassa */}
                <div className="profile-platform-icon">
                  {account.provider === 'instagram' ? '📷' :
                   account.provider === 'facebook' ? '📘' :
                   account.provider === 'linkedin' ? '💼' : '?'}
                </div>
              </div>

              {/* Tilin tiedot */}
              <div className="account-info">
                <div className="account-name">
                  {account.name || account.username}
                </div>
                <div className="account-username">
                  @{account.username}
                </div>
                <div className="account-date">
                  Lisätty {account.created_at ? new Date(account.created_at).toLocaleDateString('fi-FI') : 'tuntematon'}
                </div>
              </div>


            </div>
          ))}

          {/* "Lisää tili" -kortti */}
          <div className="add-account-card">
            <div className="add-account-content">
              <div className="add-icon">➕</div>
              <div className="add-text">Lisää tili</div>
            </div>
          </div>
        </div>
      </div>

      {/* Yhdistä tilit -osio */}
      <div className="connect-section">
        <h3 className="connect-title">
          Yhdistä uusi tili
        </h3>
        
        <div className="platforms-list">
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
                className={`platform-button ${isConnected ? 'connected' : ''} ${isConnecting ? 'connecting' : ''}`}
              >
                <div className="platform-icon-large">{platform.icon}</div>
                <div className="platform-info">
                  <div className="platform-name">
                    {platform.name}
                  </div>
                  <div className="platform-status">
                    {isConnected ? 'Yhdistetty' : isConnecting ? 'Yhdistetään...' : 'Klikkaa yhdistääksesi'}
                  </div>
                </div>
                {isConnecting && (
                  <div className="loading-spinner"></div>
                )}
                {isConnected && (
                  <div className="connected-check">✅</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {connectionError && (
        <div className="connection-error">
          {connectionError}
        </div>
      )}
    </div>
  );
};

export default SocialMediaConnect; 