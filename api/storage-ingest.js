import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    let body = {}
    try { body = req.body && Object.keys(req.body).length ? req.body : JSON.parse(await readReqBody(req)) } catch {}
    const { userId, files } = body || {}
    const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY || req.headers['x-api-key']
    if (!userId || !Array.isArray(files) || files.length === 0) return res.status(400).json({ error: 'userId ja files vaaditaan' })

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || (!serviceKey && !anonKey)) {
      return res.status(500).json({ error: 'Supabase asetukset puuttuvat (URL tai KEY)' })
    }
    // Käytä service rolea jos saatavilla, muuten anon (public bucketin julkinen URL ei vaadi service keytä)
    const supabase = createClient(supabaseUrl, serviceKey || anonKey)

    // Luo public URLit (bucket on public). Lisäksi voidaan luoda 1h signed URL tarvittaessa
    const enriched = []
    for (const f of files) {
      if (!f?.bucket || !f?.path) continue
      const { data: pub } = supabase.storage.from(f.bucket).getPublicUrl(f.path)
      let signedUrl = null
      try {
        if (serviceKey) {
          const { data: signed, error: signErr } = await supabase.storage.from(f.bucket).createSignedUrl(f.path, 3600)
          if (!signErr) signedUrl = signed?.signedUrl || null
        }
      } catch (_) {}
      enriched.push({ ...f, publicUrl: pub?.publicUrl || null, signedUrl })
    }

    // send to vectorsupabase webhook
    const DEV_UPLOAD_WEBHOOK_URL = 'https://samikiias.app.n8n.cloud/webhook/vectorsupabase'
    const resp = await fetch(DEV_UPLOAD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(N8N_SECRET_KEY ? { 'x-api-key': N8N_SECRET_KEY } : {}) },
      body: JSON.stringify({
        action: 'feed_supabase',
        userId,
        urls: enriched.map(e => e.publicUrl).filter(Boolean),
        files: enriched,
        uploadedAt: new Date().toISOString()
      })
    })
    const text = await resp.text()
    let data
    try { data = JSON.parse(text) } catch { data = { message: text } }
    if (!resp.ok) return res.status(500).json({ error: 'N8N webhook virhe', details: data })

    return res.status(200).json({ success: true, files: enriched, webhookResponse: data })
  } catch (e) {
    return res.status(500).json({ error: 'Virhe storage-ingest endpointissa', details: e?.message || String(e) })
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


