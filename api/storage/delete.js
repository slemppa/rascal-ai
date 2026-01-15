import { withOrganization } from '../_middleware/with-organization.js'
import logger from '../_lib/logger.js'

async function handler(req, res) {
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return res.status(204).end()
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Oleta, että body on parsittu (Next/Vercel). Fallback JSON.parseen jos ei ole.
    let body = {}
    try {
      body =
        req.body && Object.keys(req.body).length
          ? req.body
          : req.readable
          ? JSON.parse(await readReqBody(req))
          : {}
    } catch (parseErr) {
      logger.warn('storage/delete: Invalid JSON body', { message: parseErr.message })
      return res.status(400).json({ error: 'Virheellinen pyyntödata' })
    }

    const { bucket = 'temp-ingest', paths = [], files = [] } = body || {}
    const list =
      Array.isArray(paths) && paths.length
        ? paths
        : Array.isArray(files)
        ? files.map((f) => f.path).filter(Boolean)
        : []

    if (!list.length) {
      return res.status(400).json({ error: 'paths vaaditaan' })
    }

    // Käytä withOrganization-middlewarea luotua Supabase-clienttia,
    // jossa on käyttäjän Authorization-header -> RLS suojaa bucketit.
    const supabase = req.supabase
    if (!supabase) {
      logger.error('storage/delete: Supabase client missing on request')
      return res.status(500).json({ error: 'Sisäinen palvelinvirhe' })
    }

    const { error } = await supabase.storage.from(bucket).remove(list)
    if (error) {
      logger.error('storage/delete: remove epäonnistui', {
        message: error.message,
        code: error.code
      })
      return res.status(500).json({ error: 'Tiedostojen poistaminen epäonnistui' })
    }

    return res.status(200).json({ success: true, deleted: list.length })
  } catch (e) {
    logger.error('storage/delete: Virhe endpointissa', {
      message: e?.message,
      stack: e?.stack
    })
    return res.status(500).json({ error: 'Sisäinen palvelinvirhe' })
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

export default withOrganization(handler)
