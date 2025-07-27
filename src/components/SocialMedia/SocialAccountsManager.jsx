import React, { useState, useEffect } from 'react';
import { Loader2, Check, Plus, X } from 'lucide-react';

const SocialAccountsManager = ({ userEmail, workspaceUuid, apiToken }) => {
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);

  // Tuetut sosiaalisen median alustat
  const supportedPlatforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '👤',
      color: 'bg-blue-600',
      description: 'Yhdistä Facebook-sivusi'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      description: 'Yhdistä Instagram-tilisi'
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: '🐦',
      color: 'bg-black',
      description: 'Yhdistä X/Twitter-tilisi'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700',
      description: 'Yhdistä LinkedIn-profiilisi'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      color: 'bg-black',
      description: 'Yhdistä TikTok-tilisi'
    }
  ];

  // Lataa yhdistetyt sometilit
  useEffect(() => {
    if (workspaceUuid && apiToken) {
      loadSocialAccounts();
    }
  }, [workspaceUuid, apiToken]);

  const loadSocialAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://mixpost.mak8r.fi/mixpost/api/${workspaceUuid}/accounts`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSocialAccounts(data.data || []);
      } else {
        console.error('Failed to load social accounts');
      }
    } catch (error) {
      console.error('Error loading social accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Yhdistä sosiaalisen median tili
  const connectAccount = (platform) => {
    setConnecting(platform);
    
    // Luo OAuth-URL Mixpostiin
    const connectUrl = `https://mixpost.mak8r.fi/mixpost/${workspaceUuid}/accounts/auth/${platform}`;
    
    // Avaa popup-ikkuna OAuth-prosessille
    const popup = window.open(
      connectUrl,
      'mixpost-oauth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // Kuuntele kun popup sulkeutuu
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setConnecting(null);
        // Päivitä sometilit kun OAuth on valmis
        setTimeout(() => {
          loadSocialAccounts();
        }, 1000);
      }
    }, 1000);

    // Timeout 5 minuutin kuluttua
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
        setConnecting(null);
        alert('Yhdistäminen keskeytettiin - popup oli auki liian kauan');
      }
    }, 300000); // 5 minuuttia
  };

  // Poista yhdistetty tili
  const disconnectAccount = async (accountId) => {
    if (!confirm('Haluatko varmasti poistaa tämän tilin yhdistämisen?')) {
      return;
    }

    try {
      const response = await fetch(`https://mixpost.mak8r.fi/mixpost/api/${workspaceUuid}/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        loadSocialAccounts(); // Päivitä lista
      } else {
        alert('Tilin poistaminen epäonnistui');
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      alert('Virhe tilin poistamisessa');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Yhdistetyt sometilit</h2>
        <div className="text-sm text-gray-500">
          {socialAccounts.length} tiliä yhdistetty
        </div>
      </div>

      {/* Yhdistetyt tilit */}
      {socialAccounts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Aktiiviset yhteydet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialAccounts.map((account) => (
              <div key={account.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {supportedPlatforms.find(p => p.id === account.provider)?.icon || '📱'}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{account.name}</h4>
                      <p className="text-sm text-gray-600">@{account.username}</p>
                      <p className="text-xs text-green-600 capitalize">{account.provider}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => disconnectAccount(account.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Poista
                  </button>
                </div>
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    ✓ Yhdistetty
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yhdistettävissä olevat alustat */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Yhdistä uusi tili</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supportedPlatforms.map((platform) => {
            const isConnected = socialAccounts.some(acc => acc.provider === platform.id);
            const isConnecting = connecting === platform.id;

            return (
              <button
                key={platform.id}
                onClick={() => !isConnected && !isConnecting && connectAccount(platform.id)}
                disabled={isConnected || isConnecting}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isConnected 
                    ? 'border-green-200 bg-green-50 cursor-not-allowed'
                    : isConnecting
                    ? 'border-blue-200 bg-blue-50 cursor-wait'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                }`}
              >
                <div className="text-center">
                  <span className="text-3xl mb-2 block">{platform.icon}</span>
                  <h4 className="font-medium text-gray-900">{platform.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
                  
                  <div className="mt-3">
                    {isConnected ? (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        ✓ Yhdistetty
                      </span>
                    ) : isConnecting ? (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        🔄 Yhdistää...
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                        + Yhdistä
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ohjeteksti */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Vinkkejä sometiilien yhdistämiseen:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Varmista että olet kirjautunut haluamaasi sometiliin toisessa välilehdessä</li>
          <li>• Instagram vaatii Facebook-yhteyden (Meta Business Manager)</li>
          <li>• LinkedIn vaatii Company Page -admin-oikeudet</li>
          <li>• Yhdistämisen jälkeen voit julkaista sisältöä suoraan Rascal AI:sta</li>
        </ul>
      </div>

      {socialAccounts.length === 0 && (
        <div className="text-center py-8">
          <span className="text-6xl mb-4 block">📱</span>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Ei vielä yhdistettyjä tilejä</h3>
          <p className="text-gray-600">Yhdistä ensimmäinen sometilisi aloittaaksesi sisällön julkaisemisen!</p>
        </div>
      )}
    </div>
  );
};

export default SocialAccountsManager;