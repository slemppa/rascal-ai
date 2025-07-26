export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST sallittu' });
  }

  const { templateId, companyId } = req.body;
  if (!templateId) {
    return res.status(400).json({ error: 'templateId vaaditaan' });
  }

  const webhookUrl = process.env.N8N_CAROUSEL_UPDATE;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Webhook-osoitetta ei ole määritelty (.env N8N_CAROUSEL_UPDATE)' });
  }

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_SECRET_KEY
      },
      body: JSON.stringify({ templateId, companyId })
    });
    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      return res.status(502).json({ error: 'Webhook epäonnistui', webhookStatus: webhookRes.status, webhookBody: text });
    }
    return res.status(200).json({ success: true, message: 'Valinta vastaanotettu ja välitetty webhookiin', templateId });
  } catch (err) {
    return res.status(500).json({ error: 'Webhook-kutsu epäonnistui', details: err.message });
  }
} 