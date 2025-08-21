import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: { bodyParser: false }
}

const DEV_UPLOAD_WEBHOOK_URL = 'https://samikiias.app.n8n.cloud/webhook/vectorsupabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY || req.headers['x-api-key']
    if (!N8N_SECRET_KEY) return res.status(500).json({ error: 'API-avain ei ole konfiguroitu' })

    const form = formidable({ maxFileSize: 100 * 1024 * 1024, maxFields: 20 })
    const [fields, files] = await form.parse(req)
    const uploadedFiles = files.files || []
    const companyId = fields.companyId?.[0]
    const assistantId = fields.assistantId?.[0]
    const action = fields.action?.[0] || 'feed'
    const fileNamesField = fields.fileNames?.[0]
    const providedNames = (() => { try { return JSON.parse(fileNamesField || '[]') } catch { return [] } })()

    if (!companyId) return res.status(400).json({ error: 'CompanyId puuttuu' })
    if (!assistantId) return res.status(400).json({ error: 'AssistantId puuttuu' })
    if (uploadedFiles.length === 0) return res.status(400).json({ error: 'Ei tiedostoja annettu' })

    const fd = new FormData()
    fd.append('action', action)
    fd.append('companyId', companyId)
    fd.append('assistantId', assistantId)
    // Välitä nimet myös eksplisiittisesti payloadissa
    try {
      fd.append('fileNames', fileNamesField || JSON.stringify(providedNames))
    } catch {}

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i]
      const buffer = await fs.promises.readFile(file.filepath)
      const blob = new Blob([buffer], { type: file.mimetype || 'application/octet-stream' })
      const name = providedNames[i] || file.originalFilename || `file_${i}`
      fd.append('files', blob, name)
      try { fs.unlinkSync(file.filepath) } catch {}
    }

    const resp = await fetch(DEV_UPLOAD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'x-api-key': N8N_SECRET_KEY },
      body: fd
    })
    const text = await resp.text()
    let data
    try { data = JSON.parse(text) } catch { data = { message: text } }
    if (!resp.ok) return res.status(500).json({ error: 'N8N webhook virhe', details: data })
    return res.status(200).json({ success: true, webhookResponse: data })
  } catch (e) {
    return res.status(500).json({ error: 'Virhe dev-upload endpointissa', details: e.message })
  }
}


