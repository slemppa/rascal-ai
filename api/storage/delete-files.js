import { sendToN8N } from '../lib/n8n-client.js'

const N8N_DELETE_FILES_URL = process.env.N8N_DELETE_FILES_URL || 'https://samikiias.app.n8n.cloud/webhook/unfeed-assistant'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST sallittu' });
  }

  const { userId, fileId } = req.body;
  if (!userId || !fileId) {
    return res.status(400).json({ error: 'userId ja fileId vaaditaan' });
  }

  try {
    if (!N8N_DELETE_FILES_URL) {
      return res.status(500).json({ error: 'Webhook URL ei ole konfiguroitu' })
    }

    const safePayload = {
      action: 'delete',
      userId: String(userId),
      fileId: String(fileId)
    }

    const data = await sendToN8N(N8N_DELETE_FILES_URL, safePayload)
    return res.status(200).json(data)
  } catch (e) {
    return res.status(500).json({ error: 'Tiedoston poisto epäonnistui', details: e.message });
  }
} 