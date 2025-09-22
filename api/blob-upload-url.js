import { generateUploadURL } from '@vercel/blob'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    let body = {}
    try { body = req.body && Object.keys(req.body).length ? req.body : JSON.parse(await readReqBody(req)) } catch {}
    const { filename, contentType } = body || {}
    if (!filename || !contentType) return res.status(400).json({ error: 'filename ja contentType vaaditaan' })
    // Huom: vaatii BLOB_READ_WRITE_TOKEN ympäristöön (Vercel asettaa automaattisesti projektissa, lokaaliin lisää .env)
    const { url } = await generateUploadURL({ contentType, access: 'public', expires: '15m' })
    return res.status(200).json({ uploadUrl: url })
  } catch (e) {
    console.error('blob-upload-url error:', e)
    return res.status(500).json({ error: 'Upload URL generointi epäonnistui', details: e?.message || String(e) })
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


