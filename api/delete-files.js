export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST sallittu' });
  }
  const { assistantId, companyId, fileId } = req.body;
  if (!assistantId || !companyId || !fileId) {
    return res.status(400).json({ error: 'assistantId, companyId ja fileId vaaditaan' });
  }
  try {
    const webhookUrl = process.env.N8N_DELETE_FILES_URL;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        assistantId,
        companyId,
        fileId
      })
    });
    if (!response.ok) {
      throw new Error('Webhook epäonnistui');
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Tiedoston poisto epäonnistui' });
  }
} 