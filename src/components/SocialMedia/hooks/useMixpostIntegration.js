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
        setError('Mixpost-konfiguraatiota ei löytynyt. Ota yhteyttä tukeen.');
        return;
      }

      setMixpostConfig(data);
      setError(null); // Tyhjennä virhe jos konfiguraatio löytyi
    } catch (error) {
      console.error('Error fetching Mixpost config:', error);
      setError('Virhe Mixpost-konfiguraation haussa.');
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
      console.log('Mixpost config puuttuu, käytetään tallennettuja tilejä');
      return [];
    }

    try {
      console.log('Haetaan sometilit Mixpostista...');
      const response = await fetch(`/api/mixpost-accounts?workspace_uuid=${mixpostConfig.mixpost_workspace_uuid}&api_token=${mixpostConfig.mixpost_api_token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Mixpost API error:', errorData);
        throw new Error(`Mixpost API virhe: ${response.status} - ${errorData.error || 'Tuntematon virhe'}`);
      }

      const result = await response.json();
      console.log('Mixpost API vastaus:', result);

      if (result.data && Array.isArray(result.data)) {
        setSocialAccounts(result.data);
        return result.data;
      } else {
        console.log('Mixpost API palautti tyhjän tai virheellisen datan');
        setSocialAccounts([]);
        return [];
      }
    } catch (error) {
      console.error('Error fetching social accounts from Mixpost:', error);
      setError(`Virhe sometilien haussa: ${error.message}`);
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
      console.log(`Yhdistetään ${platform}...`);
      
      // Käytä suoraa OAuth URL:ia platformin mukaan
      let oauthUrl;
      if (platform === 'facebook') {
        oauthUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=4061580827451364&redirect_uri=${encodeURIComponent('https://mixpost.mak8r.fi/mixpost/callback/instagram')}&scope=business_management%2Cpages_show_list%2Cread_insights%2Cpages_manage_posts%2Cpages_read_engagement%2Cpages_manage_engagement%2Cinstagram_basic%2Cinstagram_content_publish%2Cinstagram_manage_insights%2Cinstagram_manage_comments&response_type=code&state=${Math.random().toString(36).substring(2, 15)}`;
      } else {
        // Käytä Mixpost OAuth proxy:tä muille platformeille
        oauthUrl = `https://mixpost.mak8r.fi/mixpost/accounts/add/${platform}`;
      }
      
      console.log('OAuth URL:', oauthUrl);
      
      const popup = window.open(oauthUrl, 'oauth', 'width=600,height=600,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        reject(new Error('Popup estetty. Salli popup-ikkunat tälle sivustolle.'));
        return;
      }

      const checkClosed = setInterval(async () => {
        if (popup.closed) {
          clearInterval(checkClosed);
          
          try {
            console.log('OAuth popup suljettu, päivitetään tilejä...');
            await refreshSocialAccounts();
            await saveSocialAccountToSupabase(platform);
            resolve();
          } catch (error) {
            console.error('Virhe OAuth-prosessin jälkeen:', error);
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
        reject(new Error('OAuth-yhdistys aikakatkaistiin. Yritä uudelleen.'));
      }, 300000);
    });
  };

  // Tallenna sometili Supabaseen
  const saveSocialAccountToSupabase = async (platform) => {
    try {
      console.log('Tallennetaan sometili Supabaseen...');
      
      // Etsi uusin tili kyseiseltä platformilta
      const latestAccount = socialAccounts.find(account => 
        account.provider === platform && 
        account.created_at && 
        new Date(account.created_at) > new Date(Date.now() - 60000)
      );

      if (!latestAccount) {
        console.log('Uutta tiliä ei löytynyt tallennettavaksi');
        return;
      }

      console.log('Tallennetaan tili:', latestAccount);

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
        console.error('Virhe sometilin tallennuksessa:', error);
        throw error;
      }
      
      console.log('Sometili tallennettu onnistuneesti');
      await fetchSavedSocialAccounts(); // Päivitä tallennetut tilit
    } catch (error) {
      console.error('Virhe sometilin tallennuksessa:', error);
      // Älä heitä virhettä, koska tili voi olla jo tallennettu
    }
  };

  // Julkaise sisältö
  const publishContent = async (content, selectedAccounts) => {
    if (!mixpostConfig?.mixpost_workspace_uuid || !mixpostConfig?.mixpost_api_token) {
      throw new Error('Mixpost-konfiguraatio puuttuu. Ota yhteyttä tukeen.');
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Julkaisu epäonnistui: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Virhe sisällön julkaisussa:', error);
      throw error;
    }
  };

  // Alustus
  useEffect(() => {
    if (userId) {
      const initialize = async () => {
        setLoading(true);
        setError(null);
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
    fetchSocialAccounts,
    isSetupComplete
  };
};