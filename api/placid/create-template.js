import { withOrganization } from '../middleware/with-organization.js';
import { sendToN8N } from '../lib/n8n-client.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookUrl = process.env.N8N_PLACID_TEMPLATE_CREATE;

    if (!webhookUrl) {
      console.error('N8N_PLACID_TEMPLATE_CREATE missing from environment');
      return res.status(503).json({ 
        error: 'CONFIGURATION_ERROR',
        message: 'Server configuration error: N8N_PLACID_TEMPLATE_CREATE missing from environment.' 
      });
    }

    // req.organization.id = organisaation ID (withOrganization middleware)
    // req.authUser = authenticated user
    // req.supabase = authenticated Supabase client
    const orgId = req.organization.id;
    const authUserId = req.authUser.id;

    // Lähetä data N8N:lle
    const payload = {
      action: 'create_placid_template',
      userId: authUserId,
      orgId: orgId,
      templateData: req.body.templateData || {}
    };

    console.log('Creating Placid template via N8N:', payload);

    const result = await sendToN8N(webhookUrl, payload);

    return res.status(200).json({ 
      success: true, 
      message: 'Template creation started',
      data: result 
    });

  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json({ 
      error: 'Template creation failed',
      message: error.message 
    });
  }
}

export default withOrganization(handler);

