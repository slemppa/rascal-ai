import { createClient } from '@supabase/supabase-js'
import { withOrganization } from '../_middleware/with-organization.js'
import { sendToN8N } from '../_lib/n8n-client.js'

/**
 * POST /api/calls/knowledge-base-ingest
 * JSON endpoint for adding web URL to the calls knowledge base.
 *
 * Body:
 * - type: 'web'
 * - title?: string
 * - url?: string  (when type='web')
 */
async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const webhookUrl = process.env.N8N_SYNTHFLOW_DATABASE
    if (!webhookUrl) return res.status(500).json({ error: 'N8N_SYNTHFLOW_DATABASE puuttuu' })

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Supabase service asetukset puuttuvat (SUPABASE_URL tai SUPABASE_SERVICE_ROLE_KEY)' })
    }

    const { data: orgData } = req.organization
    const orgId = orgData?.id
    if (!orgId) return res.status(400).json({ error: 'Organisaatiota ei löytynyt' })
    if (!orgData.vector_store_id) return res.status(400).json({ error: 'Tietokantaa ei ole luotu (vector_store_id puuttuu)' })

    const body = req.body || {}
    const type = body.type
    const title = (body.title || '').toString().trim()

    if (type !== 'web') {
      return res.status(400).json({ error: 'type pitää olla web' })
    }

    const url = (body.url || '').toString().trim()
    if (!url) return res.status(400).json({ error: 'url vaaditaan' })

    let parsed
    try { parsed = new URL(url) } catch { return res.status(400).json({ error: 'Virheellinen URL' }) }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({ error: 'URL:n pitää alkaa http:// tai https://' })
    }

    const displayName = title || url
    const { data: inserted, error: insErr } = await req.supabase
      .from('calls_knowledge_files')
      .insert({
        org_id: orgId,
        created_by: req.authUser.id,
        vector_store_id: orgData.vector_store_id,
        source_type: 'web',
        source_url: url,
        file_name: displayName,
        status: 'sent_to_webhook',
      })
      .select('id, file_name, source_url')
      .single()

    if (insErr) return res.status(500).json({ error: 'Metadatan tallennus epäonnistui', details: insErr.message })

    await sendToN8N(webhookUrl, {
      action: 'feed',
      orgId,
      vector_store_id: orgData.vector_store_id,
      files: [{
        id: inserted.id,
        type: 'web',
        url: inserted.source_url,
        title: inserted.file_name,
      }],
      uploadedAt: new Date().toISOString(),
    })

    return res.status(200).json({ success: true, id: inserted.id })
  } catch (e) {
    return res.status(500).json({ error: 'Virhe ingest-endpointissa', details: e.message })
  }
}

export default withOrganization(handler)
