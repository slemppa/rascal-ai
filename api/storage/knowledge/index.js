import formidable from 'formidable'
import fs from 'fs'
import { put } from '@vercel/blob'
import { sendToN8N } from '../../_lib/n8n-client.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

// Webhook osoite N8N:ään (käytä env-muuttujaa tai oletusta)
const DEV_KNOWLEDGE_WEBHOOK_URL =
  process.env.DEV_KNOWLEDGE_WEBHOOK_URL ||
  'https://samikiias.app.n8n.cloud/webhook/vectorsupabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY || req.headers['x-api-key']
    if (!N8N_SECRET_KEY) {
      return res
        .status(500)
        .json({ error: 'API-avain ei ole konfiguroitu (N8N_SECRET_KEY puuttuu)' })
    }

    const contentType = req.headers['content-type'] || ''

    // Multipart upload (feed)
    if (contentType.includes('multipart/form-data')) {
      const form = formidable({ maxFileSize: 100 * 1024 * 1024, maxFields: 20 })
      const [fields, files] = await form.parse(req)
      const uploadedFiles = files.files || []
      const userId = fields.userId?.[0]
      const action = fields.action?.[0] || 'feed'

      if (!userId) return res.status(400).json({ error: 'UserId puuttuu' })
      if (uploadedFiles.length === 0)
        return res.status(400).json({ error: 'Ei tiedostoja annettu' })

      // Rakenna uusi multipart-keho ja välitä binäärit suoraan N8N:ään
      console.log('[knowledge] multipart upload start')
      const fd = new FormData()
      fd.append('action', action)
      fd.append('userId', userId)

      const fileNamesField = fields.fileNames?.[0]
      const providedNames = (() => {
        try {
          return JSON.parse(fileNamesField || '[]')
        } catch {
          return []
        }
      })()

      let totalBytes = 0
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        const buffer = await fs.promises.readFile(file.filepath)
        const blob = new Blob([buffer], {
          type: file.mimetype || 'application/octet-stream',
        })
        const name = providedNames[i] || file.originalFilename || 'file'
        fd.append('files', blob, name)
        totalBytes += buffer.length
        try {
          fs.unlinkSync(file.filepath)
        } catch {}
      }
      console.log(
        '[knowledge] files count:',
        uploadedFiles.length,
        'totalBytes:',
        totalBytes
      )

      let webhookResponse
      try {
        webhookResponse = await fetch(DEV_KNOWLEDGE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'x-api-key': N8N_SECRET_KEY },
          body: fd,
        })
      } catch (err) {
        console.error('[knowledge] multipart forward failed:', err)
      }

      const text = await webhookResponse.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        data = { message: text }
      }

      if (!webhookResponse.ok) {
        console.warn(
          '[knowledge] multipart not ok, falling back to blob+JSON'
        )
        // Fallback: lataa blobit ja lähetä JSON
        const blobResults = []
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i]
          try {
            const fileBuffer = fs.readFileSync(file.filepath)
            const blobUpload = await put(
              file.originalFilename || `file_${i}`,
              fileBuffer,
              { access: 'public', addRandomSuffix: true }
            )
            blobResults.push({
              filename:
                providedNames[i] || file.originalFilename || `file_${i}`,
              url: blobUpload.url,
              size: file.size,
            })
          } catch (_) {}
          try {
            fs.unlinkSync(file.filepath)
          } catch {}
        }
        const jsonResp = await fetch(DEV_KNOWLEDGE_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': N8N_SECRET_KEY,
          },
          body: JSON.stringify({
            action,
            userId,
            files: blobResults,
            uploadedAt: new Date().toISOString(),
          }),
        })
        const jsonText = await jsonResp.text()
        let jsonData
        try {
          jsonData = JSON.parse(jsonText)
        } catch {
          jsonData = { message: jsonText }
        }
        if (!jsonResp.ok) {
          return res
            .status(500)
            .json({ error: 'N8N webhook virhe (fallback)', details: jsonData })
        }
        return res.status(200).json({
          success: true,
          webhookResponse: jsonData,
        })
      }

      return res.status(200).json({ success: true, webhookResponse: data })
    }

    // JSON: list/delete tms (käytetään HMAC-allekirjoitusta)
    let body = {}
    try {
      body =
        req.body && Object.keys(req.body).length
          ? req.body
          : JSON.parse(await readReqBody(req))
    } catch {}

    // Lähetetään N8N:ään HMAC-allekirjoituksella
    const data = await sendToN8N(DEV_KNOWLEDGE_WEBHOOK_URL, body)
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({
      error: 'Virhe knowledge endpointissa',
      details: error.message,
    })
  }
}

function readReqBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

