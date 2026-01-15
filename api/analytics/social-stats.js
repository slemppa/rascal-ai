import axios from 'axios';
import { withOrganization } from '../_middleware/with-organization.js';

async function handler(req, res) {
  // Salli vain GET-pyynnöt
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { from, to } = req.query;
  
  if (!req.organization) {
    console.error('Organization missing in request');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const organizationId = req.organization.id;

  try {
    // Hae mixpost workspace id
    // Käytä req.supabase joka on autentikoitu middlewaren kautta
    const { data: config, error: configError } = await req.supabase
      .from('user_mixpost_config')
      .select('mixpost_workspace_uuid, mixpost_api_token')
      .eq('user_id', organizationId)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching mixpost config:', configError);
      return res.status(500).json({ error: 'Database error', details: configError.message });
    }

    if (!config || !config.mixpost_workspace_uuid || !config.mixpost_api_token) {
      // Ei konfiguraatiota -> palautetaan tyhjä tai virhe. 
      return res.status(404).json({ error: 'No Mixpost workspace or API token configured' });
    }

    const workspaceId = config.mixpost_workspace_uuid;
    const mixpostApiUrl = process.env.MIXPOST_API_URL || 'https://mixpost.mak8r.fi';
    
    const baseUrl = mixpostApiUrl.endsWith('/') ? mixpostApiUrl.slice(0, -1) : mixpostApiUrl;
    
    // Käytä annettua endpoint-rakennetta suoraan (ei /mixpost -lisäystä)
    const url = from && to
      ? `${baseUrl}/api/custom/${workspaceId}/analytics?from=${from}&to=${to}`
      : `${baseUrl}/api/custom/${workspaceId}/analytics`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${config.mixpost_api_token}`,
        'Content-Type': 'application/json'
      }
    });
    const mixpostData = response.data || {};

    // Laske metriikat backendissä
    // Varmista että taulukot ovat olemassa ennen operaatioita
    const fbEngagements = Array.isArray(mixpostData.facebook_insights) 
      ? mixpostData.facebook_insights
          .filter(i => i.metric === 'page_post_engagements')
          .reduce((sum, i) => sum + Number(i.value), 0)
      : 0;

    const fbImpressions = Array.isArray(mixpostData.facebook_insights)
      ? mixpostData.facebook_insights
          .filter(i => i.metric === 'page_posts_impressions')
          .reduce((sum, i) => sum + Number(i.value), 0)
      : 0;

    const igReach = Array.isArray(mixpostData.instagram_insights)
      ? mixpostData.instagram_insights
          .filter(i => i.metric === 'reach')
          .reduce((sum, i) => sum + Number(i.value), 0)
      : 0;

    // Followers logic: Sum of latest count per account
    let igFollowers = 0;
    if (Array.isArray(mixpostData.instagram_insights)) {
      const accounts = {};
      mixpostData.instagram_insights.forEach(i => {
        if (i.metric === 'follower_count') {
          // Tallenna uusin arvo per account_id
          if (!accounts[i.account_id] || new Date(i.date) > new Date(accounts[i.account_id].date)) {
            accounts[i.account_id] = i;
          }
        }
      });
      // Summaa kaikkien tilien uusimmat arvot
      igFollowers = Object.values(accounts).reduce((sum, i) => sum + Number(i.value), 0);
    }

    const igImpressions = Array.isArray(mixpostData.instagram_insights)
      ? mixpostData.instagram_insights
          .filter(i => i.metric === 'impressions')
          .reduce((sum, i) => sum + Number(i.value), 0)
      : 0;

    const metrics = {
      fbEngagements,
      fbImpressions,
      igReach,
      igFollowers,
      igImpressions
    };

    return res.status(200).json(metrics);

  } catch (error) {
    console.error('Error fetching Mixpost analytics:', error.message);
    if (error.response?.status === 404) {
         return res.status(404).json({ error: 'Workspace not found or no analytics available' });
    }
    // Return detailed error for debugging
    return res.status(500).json({ error: 'Failed to fetch analytics', details: error.message, stack: error.stack });
  }
}

export default withOrganization(handler);
