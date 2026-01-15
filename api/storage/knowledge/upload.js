import formidable from 'formidable'
import fs from 'fs'
import { withOrganization } from '../../_middleware/with-organization.js'
import { generateHmacSignature } from '../../_lib/crypto.js'

export const config = {
  api: { bodyParser: false },
}

const DEV_UPLOAD_WEBHOOK_URL =
  'https://samikiias.app.n8n.cloud/webhook/vectorsupabase'

async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  try {
    const authUser = req.authUser
    if (!authUser)
      return res
        .status(401)
        .json({ error: 'Käyttäjä ei ole kirjautunut' })

    const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY
    if (!N8N_SECRET_KEY)
      return res
        .status(500)
        .json({ error: 'API-avain ei ole konfiguroitu' })

    const form = formidable({ maxFileSize: 100 * 1024 * 1024, maxFields: 20 })
    const [fields, files] = await form.parse(req)
    const uploadedFiles = files.files || []
    const action = fields.action?.[0] || 'feed'
    const fileNamesField = fields.fileNames?.[0]
    const providedNames = (() => {
      try {
        return JSON.parse(fileNamesField || '[]')
      } catch {
        return []
      }
    })()

    if (uploadedFiles.length === 0)
      return res.status(400).json({ error: 'Ei tiedostoja annettu' })

    const fd = new FormData()
    fd.append('action', action)
    fd.append('userId', authUser.id)
    // Välitä nimet myös eksplisiittisesti payloadissa
    try {
      fd.append('fileNames', fileNamesField || JSON.stringify(providedNames))
    } catch {}

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i]
      const buffer = await fs.promises.readFile(file.filepath)
      const blob = new Blob([buffer], {
        type: file.mimetype || 'application/octet-stream',
      })
      const name = providedNames[i] || file.originalFilename || `file_${i}`
      fd.append('files', blob, name)
      try {
        fs.unlinkSync(file.filepath)
      } catch {}
    }

    // FormData-lähetys vaatii erityiskohtelua HMAC:in kanssa
    // Muodostetaan HMAC-signature metadata-kentistä (ei tiedostoista)
    const metadataString = JSON.stringify({
      action,
      userId: authUser.id,
      fileNames: providedNames,
      fileCount: uploadedFiles.length
    })
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = generateHmacSignature(metadataString, N8N_SECRET_KEY, timestamp)
    
    const resp = await fetch(DEV_UPLOAD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'x-rascal-timestamp': timestamp,
        'x-rascal-signature': signature
      },
      body: fd,
    })
    const text = await resp.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
    if (!resp.ok)
      return res
        .status(500)
        .json({ error: 'N8N webhook virhe', details: data })
    return res.status(200).json({ success: true, webhookResponse: data })
  } catch (e) {
    return res.status(500).json({
      error: 'Virhe knowledge-upload endpointissa',
      details: e.message,
    })
  }
}

export default withOrganization(handler)

