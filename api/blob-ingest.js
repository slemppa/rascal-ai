import { del } from '@vercel/blob'

const DEV_KNOWLEDGE_WEBHOOK_URL = 'https://samikiias.app.n8n.cloud/webhook/dev-knowledge'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY || req.headers['x-api-key']
    if (!N8N_SECRET_KEY) return res.status(500).json({ error: 'API-avain ei ole konfiguroitu' })

    const { userId, files } = req.body || {}
    // files: [{ url, filename, size, contentType }]
    if (!userId || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'userId ja files vaaditaan' })
    }

    // Välitä N8N:lle vain URLit ja metatiedot
    const resp = await fetch(DEV_KNOWLEDGE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': N8N_SECRET_KEY },
      body: JSON.stringify({ action: 'feed_urls', userId, files })
    })
    const text = await resp.text()
    let data
    try { data = JSON.parse(text) } catch { data = { message: text } }
    if (!resp.ok) return res.status(500).json({ error: 'N8N virhe', details: data })

    // Kun ingest onnistuu, poista blobit heti
    const urls = files.map(f => f.url)
    try {
      await Promise.all(urls.map(url => del(url).catch(() => null)))
    } catch (_) {}

    return res.status(200).json({ success: true, result: data })
  } catch (e) {
    return res.status(500).json({ error: 'Virhe blob-ingestissä', details: e.message })
  }
}


