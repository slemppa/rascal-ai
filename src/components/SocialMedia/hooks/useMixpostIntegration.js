import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

export const useMixpostIntegration = () => {
  const { user } = useAuth();
  const userId = user?.id;
  
  const [mixpostConfig, setMixpostConfig] = useState(null);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [savedSocialAccounts, setSavedSocialAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hae Mixpost-konfiguraatio
  const fetchMixpostConfig = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_mixpost_config')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching Mixpost config:', error);
        setError(error.message);
        return;
      }

                        setMixpostConfig(data);
    } catch (error) {
      console.error('Error fetching Mixpost config:', error);
      setError(error.message);
    }
  };

  // Hae tallennetut sometilit Supabasesta
  const fetchSavedSocialAccounts = async () => {
    if (!userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_social_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_authorized', true)
        .order('last_synced_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved social accounts:', error);
        setSavedSocialAccounts([]);
        return [];
      }

                        setSavedSocialAccounts(data || []);
                  return data || [];
    } catch (error) {
      console.error('Error fetching saved social accounts:', error);
      setSavedSocialAccounts([]);
      return [];
    }
  };

  // Hae sometilit Mixpostista
  const fetchSocialAccounts = async () => {
    if (!mixpostConfig?.mixpost_workspace_uuid || !mixpostConfig?.mixpost_api_token) {
      return [];
    }

    try {
      const response = await fetch(`/api/mixpost-accounts?workspace_uuid=${mixpostConfig.mixpost_workspace_uuid}&api_token=${mixpostConfig.mixpost_api_token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        setSocialAccounts(result.data);
        return result.data;
      } else {
        setSocialAccounts([]);
        return [];
      }
                    } catch (error) {
                  setError(error.message);
                  setSocialAccounts([]);
                  return [];
                }
  };

  // Päivitä sometilit Mixpostista (vain kun tiliä yhdistetään)
  const refreshSocialAccounts = async () => {
    return await fetchSocialAccounts();
  };

                // Yhdistä sometili OAuth:lla
              const connectSocialAccount = async (platform) => {
                return new Promise((resolve, reject) => {
      
      // Facebook OAuth URL (Meta)
      const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_FACEBOOK_APP_ID&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_posts,publish_to_groups&response_type=code&state=${platform}`;
      
      const popup = window.open(oauthUrl, 'oauth', 'width=600,height=600,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        reject(new Error('Popup estetty'));
        return;
      }

      const checkClosed = setInterval(async () => {
        if (popup.closed) {
          clearInterval(checkClosed);
          
          try {
            await refreshSocialAccounts();
            await saveSocialAccountToSupabase(platform);
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      }, 1000);

      // Timeout 5 minuutissa
      setTimeout(() => {
        clearInterval(checkClosed);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('OAuth timeout'));
      }, 300000);
    });
  };

  // Tallenna sometili Supabaseen
  const saveSocialAccountToSupabase = async (platform) => {
    try {
      const latestAccount = socialAccounts.find(account => 
        account.provider === platform && 
        account.created_at && 
        new Date(account.created_at) > new Date(Date.now() - 60000)
      );

                        if (!latestAccount) {
                    return;
                  }

      const { error } = await supabase
        .from('user_social_accounts')
        .upsert({
          user_id: userId,
          mixpost_account_uuid: latestAccount.id,
          provider: platform,
          account_name: latestAccount.name || latestAccount.username,
          username: latestAccount.username,
          profile_image_url: latestAccount.profile_image_url || latestAccount.image || latestAccount.picture,
          is_authorized: true,
          account_data: latestAccount,
          last_synced_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,mixpost_account_uuid'
        });

      if (error) {
        throw error;
      }
      await fetchSavedSocialAccounts(); // Päivitä tallennetut tilit
                    } catch (error) {
                  // Handle error silently
                }
  };

  // Julkaise sisältö
  const publishContent = async (content, selectedAccounts) => {
    if (!mixpostConfig?.mixpost_workspace_uuid || !mixpostConfig?.mixpost_api_token) {
      throw new Error('Mixpost config puuttuu');
    }

    try {
      const response = await fetch('/api/mixpost-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_uuid: mixpostConfig.mixpost_workspace_uuid,
          api_token: mixpostConfig.mixpost_api_token,
          content,
          accounts: selectedAccounts,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

                        const result = await response.json();
                  return result;
                    } catch (error) {
                  throw error;
                }
  };

  // Alustus
  useEffect(() => {
    if (userId) {
      const initialize = async () => {
        setLoading(true);
        await fetchMixpostConfig();
        await fetchSavedSocialAccounts();
        setLoading(false);
      };
      initialize();
    }
  }, [userId]);

  // Hae sometilit kun konfiguraatio on saatavilla
  useEffect(() => {
    if (mixpostConfig?.mixpost_workspace_uuid && mixpostConfig?.mixpost_api_token) {
      fetchSocialAccounts();
    }
  }, [mixpostConfig]);

  const isSetupComplete = mixpostConfig?.mixpost_setup_complete;

  return {
    mixpostConfig,
    socialAccounts, // Käytä Mixpostista haettuja tilejä
    savedSocialAccounts,
    loading,
    error,
    publishContent,
    refreshSocialAccounts,
    connectSocialAccount,
    fetchSavedSocialAccounts,
    fetchSocialAccounts, // Lisää tämä funktio
    isSetupComplete
  };
};