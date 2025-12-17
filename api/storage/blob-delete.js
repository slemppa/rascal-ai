import { del } from '@vercel/blob'
import { setCorsHeaders, handlePreflight } from '../lib/cors.js'

export default async function handler(req, res) {
  // CORS
  setCorsHeaders(res, ['POST', 'DELETE', 'GET', 'OPTIONS', 'HEAD'], ['Content-Type', 'x-api-key', 'Authorization'])
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    if (handlePreflight(req, res)) {
      return
    }
    return res.status(204).end()
  }
  if (req.method !== 'POST' && req.method !== 'DELETE' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', method: req.method })
  }
  try {
    const apiKey = req.headers['x-api-key'] || ''
    const secret = process.env.N8N_SECRET_KEY || ''
    if (!secret || apiKey !== secret) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    let urls = []
    if (req.method === 'GET') {
      // Salli myös GET ?url=... tai ?urls=comma,separated
      const { url, urls: urlsParam } = req.query || {}
      if (typeof url === 'string') urls.push(url)
      if (typeof urlsParam === 'string') urls = urls.concat(urlsParam.split(',').map(s => s.trim()).filter(Boolean))
    } else {
      let body = {}
      try { body = req.body && Object.keys(req.body).length ? req.body : JSON.parse(await readReqBody(req)) } catch {}
      urls = Array.isArray(body.urls) ? body.urls : Array.isArray(body.files) ? body.files.map(f => f.url).filter(Boolean) : []
    }
    if (!urls.length) return res.status(400).json({ error: 'urls vaaditaan' })

    await Promise.all(urls.map(u => del(u).catch(() => null)))

    return res.status(200).json({ success: true, deleted: urls.length })
  } catch (e) {
    return res.status(500).json({ error: 'Virhe blob-delete endpointissa', details: e?.message || String(e) })
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


