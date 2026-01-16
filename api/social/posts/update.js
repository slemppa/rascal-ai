import { sendToN8N } from '../../_lib/n8n-client.js'

const N8N_UPDATE_POST_URL = process.env.N8N_UPDATE_POST_URL || 'https://samikiias.app.n8n.cloud/webhook/update-post1233214'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const data = await sendToN8N(N8N_UPDATE_POST_URL, req.body)
    res.status(200).json(data)
  } catch (e) {
    // Jos N8N workflow ei ole aktiivinen, palauta tyhjä vastaus
    if (e.message && (e.message.includes('404') || e.message.includes('failed'))) {
      return res.status(200).json({ success: false, message: 'N8N workflow not active' })
    }
    res.status(500).json({ error: 'Virhe päivityksessä', details: e.message })
  }
} 