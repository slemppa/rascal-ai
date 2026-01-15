import { sendToN8N } from '../_lib/n8n-client.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST sallittu' });
  }

  const { templateId, companyId, backgroundColor, textColor, color } = req.body;
  
  if (!templateId) {
    return res.status(400).json({ error: 'templateId vaaditaan' });
  }

  const webhookUrl = process.env.N8N_CAROUSEL_UPDATE;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Webhook-osoitetta ei ole määritelty (.env N8N_CAROUSEL_UPDATE)' });
  }

  try {
    const safePayload = { 
      templateId: String(templateId), 
      companyId: companyId ? String(companyId) : null, 
      backgroundColor: backgroundColor ? String(backgroundColor) : null, 
      textColor: textColor ? String(textColor) : null,
      // Takaisin yhteensopivuus vanhan API:n kanssa
      color: backgroundColor ? String(backgroundColor) : null
    };
    
    const webhookData = await sendToN8N(webhookUrl, safePayload)
    
    return res.status(200).json({ 
      success: true, 
      message: 'Valinta vastaanotettu ja välitetty webhookiin', 
      templateId,
      webhookResponse: webhookData
    });
  } catch (err) {
    return res.status(500).json({ 
      error: 'Webhook-kutsu epäonnistui', 
      details: err.message 
    });
  }
} 