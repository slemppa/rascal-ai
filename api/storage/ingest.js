import { createClient } from '@supabase/supabase-js'
import { withOrganization } from '../middleware/with-organization.js'
import { sendToN8N } from '../lib/n8n-client.js'

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    // Tarkista että käyttäjän rooli on 'owner' tai 'admin'
    const userRole = req.organization?.role
    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Vain organisaation omistaja tai admin voi lisätä tiedostoja',
        hint: 'Tiedostojen lisääminen vaatii owner- tai admin-roolin'
      })
    }

    let body = {}
    try { body = req.body && Object.keys(req.body).length ? req.body : JSON.parse(await readReqBody(req)) } catch {}
    const { files } = body || {}
    
    // Käytetään organisaation ID:tä (req.organization.id) userId:nä
    // Tämä varmistaa että tiedostot tallennetaan organisaation alle, ei yksittäisen käyttäjän alle
    const userId = req.organization.id
    
    if (!userId || !Array.isArray(files) || files.length === 0) return res.status(400).json({ error: 'userId ja files vaaditaan' })

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) {
      return res.status(500).json({ error: 'Supabase asetukset puuttuvat' })
    }
    const supabase = createClient(supabaseUrl, anonKey)

    // Luo public URLit (bucket on public). Lisäksi voidaan luoda 1h signed URL tarvittaessa
    const enriched = []
    for (const f of files) {
      if (!f?.bucket || !f?.path) continue
      const { data: pub } = supabase.storage.from(f.bucket).getPublicUrl(f.path)
      enriched.push({ ...f, publicUrl: pub?.publicUrl || f.publicUrl || null })
    }

    // Lähetetään N8N:ään HMAC-allekirjoituksella käyttäen safePayload-rakennetta
    const DEV_UPLOAD_WEBHOOK_URL = process.env.DEV_UPLOAD_WEBHOOK_URL || 'https://samikiias.app.n8n.cloud/webhook/vectorsupabase'
    
    const safePayload = {
      userId: req.organization.id,  // Luotettu organisaation ID
      data: {
        action: 'feed_supabase',
        urls: enriched.map(e => e.publicUrl).filter(Boolean),
        files: enriched,
        uploadedAt: new Date().toISOString()
      }
    }

    console.log('[ingest] Sending to N8N:', {
      userId: safePayload.userId,
      filesCount: enriched.length,
      action: safePayload.data.action
    })

    const response = await sendToN8N(DEV_UPLOAD_WEBHOOK_URL, safePayload)
    
    return res.status(200).json({ success: true, files: enriched, webhookResponse: response })
  } catch (e) {
    console.error('[ingest] Error:', e)
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

export default withOrganization(handler)

