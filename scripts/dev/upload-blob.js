import formidable from 'formidable'
import fs from 'fs'
import { put, del } from '@vercel/blob'

export const config = {
  api: { bodyParser: false }
}

// Lähetä tiedot tähän webhookiin (vectorsupabase)
const DEV_UPLOAD_WEBHOOK_URL = 'https://samikiias.app.n8n.cloud/webhook/vectorsupabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY || req.headers['x-api-key']
    if (!N8N_SECRET_KEY) return res.status(500).json({ error: 'API-avain ei ole konfiguroitu (puuttuu N8N_SECRET_KEY tai x-api-key)' })

    const form = formidable({ maxFileSize: 50 * 1024 * 1024, maxFields: 20 })
    const [fields, files] = await form.parse(req)
    const uploadedFiles = files.files || files.file || []
    const filesArr = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]
    const userId = fields.userId?.[0]
    if (!userId) return res.status(400).json({ error: 'userId puuttuu' })
    if (filesArr.length === 0) return res.status(400).json({ error: 'Ei tiedostoja annettu' })

    const blobResults = []

    // Unicode-normalisointi: poista diakriitit (ä->a, ö->o, å->a myös yhdistelmämerkkeinä)
    function sanitizeFilename(inputName) {
      const trimmed = (inputName || '').trim()
      const justName = trimmed.split('\\').pop().split('/').pop()
      const dotIdx = justName.lastIndexOf('.')
      const ext = dotIdx >= 0 ? justName.slice(dotIdx) : ''
      const base = dotIdx >= 0 ? justName.slice(0, dotIdx) : justName
      const withoutDiacritics = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const asciiSafe = withoutDiacritics.replace(/[^a-zA-Z0-9._-]+/g, '-')
      const collapsed = asciiSafe.replace(/-+/g, '-').replace(/^[.-]+|[.-]+$/g, '')
      return (collapsed || 'file') + ext
    }
    for (let i = 0; i < filesArr.length; i++) {
      const file = filesArr[i]
      const buffer = await fs.promises.readFile(file.filepath)
      const originalName = file.originalFilename || `file_${Date.now()}_${i}`
      const sanitizedName = sanitizeFilename(originalName)
      const blob = await put(sanitizedName, buffer, { access: 'public', addRandomSuffix: true })
      blobResults.push({ url: blob.url, filename: sanitizedName, size: file.size, contentType: file.mimetype || 'application/octet-stream' })
      try { fs.unlinkSync(file.filepath) } catch {}
    }

    // Ingestaa URLit N8N:lle
    const resp = await fetch(DEV_UPLOAD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': N8N_SECRET_KEY },
      body: JSON.stringify({ action: 'feed_urls', userId, files: blobResults, uploadedAt: new Date().toISOString() })
    })
    const text = await resp.text()
    let data
    try { data = JSON.parse(text) } catch { data = { message: text } }
    if (!resp.ok) {
      console.error('dev-upload-blob webhook error:', data)
      return res.status(500).json({ error: 'N8N webhook virhe', details: data })
    }

    // Käynnistä poistot asynkronisesti N8N:stä webhookin jälkeen
    // N8N voi kutsua /api/blob-delete x-api-key -headerilla ja listalla url:eja

    return res.status(200).json({ success: true, files: blobResults, webhookResponse: data })
  } catch (e) {
    console.error('dev-upload-blob error:', e)
    return res.status(500).json({ error: 'Virhe dev-upload-blob endpointissa', details: e?.message || String(e) })
  }
}


