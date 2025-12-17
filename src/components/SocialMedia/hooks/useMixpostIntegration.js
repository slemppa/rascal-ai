import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { getUserOrgId } from '../../../lib/getUserOrgId';

export const useMixpostIntegration = () => {
  const { user, organization } = useAuth();
  // Käytetään organisaation ID:tä (public.users.id) sen sijaan että käytetään auth.users.id
  const [orgId, setOrgId] = useState(null);
  
  const [mixpostConfig, setMixpostConfig] = useState(null);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [savedSocialAccounts, setSavedSocialAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hae organisaation ID kun user tai organization muuttuu
  useEffect(() => {
    const fetchOrgId = async () => {
      if (organization?.id) {
        // Jos organization contextista löytyy ID, käytä sitä
        setOrgId(organization.id);
      } else if (user?.id) {
        // Muuten hae getUserOrgId:llä
        const id = await getUserOrgId(user.id);
        setOrgId(id);
      } else {
        setOrgId(null);
      }
    };
    fetchOrgId();
  }, [user?.id, organization?.id]);

  // Hae Mixpost-konfiguraatio
  const fetchMixpostConfig = async () => {
    if (!orgId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_mixpost_config')
        .select('*')
        .eq('user_id', orgId)
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
  // Näytetään sekä public että private tilit (private vain omalle käyttäjälle)
  const fetchSavedSocialAccounts = async () => {
    if (!orgId) return [];
    
    try {
      // Hae kaikki organisaation sometilit (public + private)
      // RLS-politiikat varmistavat että käyttäjä näkee vain oikeat tilit
      const { data, error } = await supabase
        .from('user_social_accounts')
        .select('*')
        .eq('user_id', orgId)
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
      const response = await fetch(`/api/integrations/mixpost/accounts?workspace_uuid=${mixpostConfig.mixpost_workspace_uuid}&api_token=${mixpostConfig.mixpost_api_token}`, {
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

  // Yhdistä sometili OAuth:lla (useita endpoint-kandidaatteja ja parempi virheenkäsittely)
  const connectSocialAccount = async (platform) => {
    const MIXPOST_PROXY = '/api/integrations/mixpost/linkedin'

    const openPopup = (url) => {
      console.log('[useMixpostIntegration] Avataan popup:', url)
      const features = 'width=600,height=700,menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes,resizable=yes'
      return window.open(url, 'oauth', features)
    }

    const pollPopup = (popup) => {
      return new Promise((resolve, reject) => {
        let elapsed = 0
        const intervalMs = 1000
        const maxWaitMs = 5 * 60 * 1000
        const timer = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(timer)
              try {
                console.log('[useMixpostIntegration] Popup suljettu, päivitetään tilejä...')
                await refreshSocialAccounts()
                await saveSocialAccountToSupabase(platform)
                console.log('[useMixpostIntegration] OAuth-prosessi valmis')
                return resolve()
              } catch (afterError) {
                console.error('[useMixpostIntegration] Virhe OAuth-prosessin jälkeen:', afterError)
                return reject(afterError)
              }
            }
            elapsed += intervalMs
            if (elapsed >= maxWaitMs) {
              clearInterval(timer)
              if (!popup.closed) popup.close()
              return reject(new Error('OAuth-yhdistys aikakatkaistiin 5 minuutin jälkeen.'))
            }
          } catch (_) {
            // cross-origin; jatka pollingia
          }
        }, intervalMs)
      })
    }

    // LinkedIn: käytä aina backend-proxyä (GET/POST fallback & 302 Location)
    if (platform === 'linkedin') {
      const proxyUrl = mixpostConfig?.mixpost_workspace_uuid
        ? `${MIXPOST_PROXY}?workspace_uuid=${encodeURIComponent(mixpostConfig.mixpost_workspace_uuid)}`
        : MIXPOST_PROXY
      const popup = openPopup(proxyUrl)
      if (!popup) {
        throw new Error('Popup estetty. Salli popup-ikkunat tälle sivustolle.')
      }
      await pollPopup(popup)
      return
    }

    // Muut alustat: suora workspace-url jos saatavilla, muuten generinen reitti
    const otherPlatformUrl = mixpostConfig?.mixpost_workspace_uuid
      ? buildDirectProviderUrl(mixpostConfig.mixpost_workspace_uuid)
      : `https://mixpost.mak8r.fi/mixpost/accounts/add/${platform}`
    const popup = openPopup(otherPlatformUrl)
    if (!popup) {
      throw new Error('Popup estetty. Salli popup-ikkunat tälle sivustolle.')
    }
    await pollPopup(popup)
  }

  // Tallenna sometili Supabaseen
  const saveSocialAccountToSupabase = async (platform) => {
    try {
      console.log('Tallennetaan sometili Supabaseen...');
      
      // Etsi tili kyseiseltä platformilta: ensisijaisesti sellainen jota ei ole vielä tallennettu
      const existingIds = new Set((savedSocialAccounts || []).map(a => a.mixpost_account_uuid))
      let latestAccount = socialAccounts.find(account => account.provider === platform && !existingIds.has(account.id))
      if (!latestAccount) {
        // Fallback: ota ensimmäinen kyseisen platformin tili
        latestAccount = socialAccounts.find(account => account.provider === platform)
      }

      if (!latestAccount) {
        console.log('Tiliä ei löytynyt tallennettavaksi. Varmista, että yhdistäminen onnistui Mixpostissa.');
        return;
      }

      console.log('Tallennetaan tili:', latestAccount);

      if (!orgId) {
        console.error('Organisaation ID puuttuu, ei voida tallentaa sometiliä');
        return;
      }

      // Hae käyttäjän auth ID
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('user_social_accounts')
        .upsert({
          user_id: orgId,
          mixpost_account_uuid: latestAccount.id,
          provider: platform,
          account_name: latestAccount.name || latestAccount.username,
          username: latestAccount.username,
          profile_image_url: latestAccount.profile_image_url || latestAccount.image || latestAccount.picture,
          is_authorized: true,
          visibility: 'public', // Oletuksena public (organisaation sisäinen)
          created_by: authUser?.id || null, // Tallenna kuka loi tilin
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
      const response = await fetch('/api/social/posts/actions', {
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
    if (orgId) {
      const initialize = async () => {
        setLoading(true);
        setError(null);
        await fetchMixpostConfig();
        await fetchSavedSocialAccounts();
        setLoading(false);
      };
      initialize();
    } else {
      setLoading(false);
    }
  }, [orgId]);

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