import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    let body = {}
    try { body = req.body && Object.keys(req.body).length ? req.body : JSON.parse(await readReqBody(req)) } catch {}
    const { userId, filename, contentType } = body || {}
    if (!userId || !filename) return res.status(400).json({ error: 'userId ja filename vaaditaan' })

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) return res.status(500).json({ error: 'Supabase asetukset puuttuvat (URL tai ANON_KEY)' })

    // Käytä käyttäjän JWT:tä, jotta createSignedUploadUrl ajetaan käyttäjän kontekstissa
    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} }
    })
    const bucket = 'temp-ingest'

    const sanitized = sanitizeFilename(filename)
    const path = `${userId}/${Date.now()}-${sanitized}`

    // TTL toive 1h – jos API ei tue TTL:iä upload-tokeneille, tämä sivuutetaan.
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)
    if (error) return res.status(500).json({ error: 'createSignedUploadUrl epäonnistui', details: error.message })

    return res.status(200).json({ bucket, path, token: data?.token || data?.signedUrl || null, contentType: contentType || 'application/octet-stream' })
  } catch (e) {
    return res.status(500).json({ error: 'Virhe storage-upload-url endpointissa', details: e?.message || String(e) })
  }
}

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

function readReqBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}


