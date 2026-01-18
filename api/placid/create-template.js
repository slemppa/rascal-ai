import { withOrganization } from '../_middleware/with-organization.js';
import { sendToN8N } from '../_lib/n8n-client.js';

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

    // Tarkista action: 'create' tai 'update_template_ready'
    const action = req.body.action || 'create';

    let payload;

    if (action === 'update_template_ready') {
      // Päivitä template_ready tila Airtableen
      const { templateId, templateReady } = req.body;

      if (!templateId) {
        return res.status(400).json({ 
          error: 'Missing templateId',
          message: 'templateId is required when action is update_template_ready' 
        });
      }

      payload = {
        action: 'update_template_ready',
        userId: authUserId,
        orgId: orgId,
        templateId: templateId,
        templateReady: Boolean(templateReady)
      };

      console.log('Updating template ready status via N8N:', payload);
    } else {
      // Oletus: luo uusi template
      payload = {
        action: 'create_placid_template',
        userId: authUserId,
        orgId: orgId,
        templateData: req.body.templateData || {}
      };

      console.log('Creating Placid template via N8N:', payload);
    }

    const result = await sendToN8N(webhookUrl, payload);

    const successMessage = action === 'update_template_ready' 
      ? 'Template ready status update started'
      : 'Template creation started';

    return res.status(200).json({ 
      success: true, 
      message: successMessage,
      data: result 
    });

  } catch (error) {
    console.error('Error in placid template endpoint:', error);
    return res.status(500).json({ 
      error: 'Template operation failed',
      message: error.message 
    });
  }
}

export default withOrganization(handler);

