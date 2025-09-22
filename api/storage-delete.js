import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS' || req.method === 'HEAD') return res.status(204).end()
  if (req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })
  try {
    let body = {}
    try { body = req.body && Object.keys(req.body).length ? req.body : JSON.parse(await readReqBody(req)) } catch {}
    const { bucket = 'temp-ingest', paths = [], files = [] } = body || {}
    const list = Array.isArray(paths) && paths.length ? paths : (Array.isArray(files) ? files.map(f => f.path).filter(Boolean) : [])
    if (!list.length) return res.status(400).json({ error: 'paths vaaditaan' })

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) return res.status(500).json({ error: 'Supabase asetukset puuttuvat' })
    const supabase = createClient(supabaseUrl, anonKey)

    const { error } = await supabase.storage.from(bucket).remove(list)
    if (error) return res.status(500).json({ error: 'remove epäonnistui', details: error.message })
    return res.status(200).json({ success: true, deleted: list.length })
  } catch (e) {
    return res.status(500).json({ error: 'Virhe storage-delete endpointissa', details: e?.message || String(e) })
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


