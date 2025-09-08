export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST sallittu' });
  }

  const { templateId, companyId, color } = req.body;
  
  console.log('Backend vastaanotti:', { templateId, companyId, color });
  console.log('color arvo:', color, 'tyyppi:', typeof color);
  
  if (!templateId) {
    return res.status(400).json({ error: 'templateId vaaditaan' });
  }

  const webhookUrl = process.env.N8N_CAROUSEL_UPDATE;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Webhook-osoitetta ei ole määritelty (.env N8N_CAROUSEL_UPDATE)' });
  }

  try {
    console.log('Lähetetään webhook:', { templateId, companyId, color });
    
    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_SECRET_KEY
      },
      body: JSON.stringify({ templateId, companyId, color })
    });
    
    console.log('Webhook vastaus status:', webhookRes.status);
    
    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      console.error('Webhook virhe:', text);
      return res.status(502).json({ 
        error: 'Webhook epäonnistui', 
        webhookStatus: webhookRes.status, 
        webhookBody: text 
      });
    }
    
    // Yritä lukea JSON-vastaus, mutta älä kaadu jos se epäonnistuu
    let webhookData;
    try {
      const responseText = await webhookRes.text();
      webhookData = responseText ? JSON.parse(responseText) : null;
    } catch (parseErr) {
      console.log('Webhook ei palauttanut JSON-vastausta, mutta status oli OK');
      webhookData = null;
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Valinta vastaanotettu ja välitetty webhookiin', 
      templateId,
      webhookResponse: webhookData
    });
  } catch (err) {
    console.error('Webhook-kutsu epäonnistui:', err);
    return res.status(500).json({ 
      error: 'Webhook-kutsu epäonnistui', 
      details: err.message 
    });
  }
} 