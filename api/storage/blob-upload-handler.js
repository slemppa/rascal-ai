import { handleUpload } from '@vercel/blob/client'
import { withOrganization } from '../_middleware/with-organization.js'

async function handler(req, res) {
  const allowedOrigin = process.env.APP_URL || 'https://app.rascalai.fi'
  
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, HEAD')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    return res.status(204).end()
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  // Tarkista että käyttäjän rooli on 'owner' tai 'admin'
  const userRole = req.organization?.role
  if (!['owner', 'admin'].includes(userRole)) {
    return res.status(403).json({ 
      error: 'Vain organisaation omistaja tai admin voi ladata tiedostoja',
      hint: 'Tiedostojen lataus vaatii owner- tai admin-roolin'
    })
  }
  try {
    let body = {}
    try { body = req.body && Object.keys(req.body).length ? req.body : JSON.parse(await readReqBody(req)) } catch {}

    const request = new Request('https://blob-upload-handler.local', {
      method: 'POST',
      headers: new Headers({ 'content-type': 'application/json' }),
      body: JSON.stringify(body)
    })

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            'image/*',
            'audio/*',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown',
            'application/rtf'
          ],
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {
        // Ei riippuvuutta callbackista; ingest hoidetaan erikseen
      }
    })

    res.setHeader('Content-Type', 'application/json')
    return res.status(200).end(JSON.stringify(jsonResponse))
  } catch (e) {
    return res.status(400).json({ error: e?.message || String(e) })
  }
}

function readReqBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default withOrganization(handler)
