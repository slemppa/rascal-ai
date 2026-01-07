import axios from 'axios';
import { withOrganization } from '../../middleware/with-organization.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.organization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const organizationId = req.organization.id;

  try {
    // Hae konfiguraatio tietokannasta
    const { data: config, error: configError } = await req.supabase
      .from('user_mixpost_config')
      .select('mixpost_workspace_uuid, mixpost_api_token')
      .eq('user_id', organizationId)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching mixpost config:', configError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!config || !config.mixpost_workspace_uuid || !config.mixpost_api_token) {
      return res.status(404).json({ error: 'Mixpost configuration not found' });
    }

    const { mixpost_workspace_uuid, mixpost_api_token } = config;
    // Käytä ympäristömuuttujaa tai oletusarvoa
    const mixpostApiUrl = process.env.MIXPOST_API_URL || 'https://mixpost.mak8r.fi';
    
    const baseUrl = mixpostApiUrl.endsWith('/') ? mixpostApiUrl.slice(0, -1) : mixpostApiUrl;
    
    // Poistettu automaattinen /mixpost lisäys, oletetaan että base URL on oikein
    const url = `${baseUrl}/api/${mixpost_workspace_uuid}/accounts`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${mixpost_api_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in mixpost/accounts:', error.message);
    return res.status(error.response?.status || 500).json({
      error: 'Failed to fetch accounts',
      details: error.response?.data || error.message
    });
  }
}

export default withOrganization(handler); 