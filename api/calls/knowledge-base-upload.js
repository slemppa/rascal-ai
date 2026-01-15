import formidable from 'formidable'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import { withOrganization } from '../_middleware/with-organization.js'
import { sendToN8N } from '../_lib/n8n-client.js'

export const config = {
  api: { bodyParser: false },
}

/**
 * POST /api/calls/knowledge-base/upload
 * Multipart upload for Synthflow calls knowledge base.
 *
 * - Requires Authorization Bearer token (withOrganization)
 * - Uploads files to Supabase Storage temp bucket (temp-ingest)
 * - Sends URL payload to N8N_SYNTHFLOW_DATABASE (HMAC via sendToN8N)
 * - Writes upload metadata to public.calls_knowledge_files
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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

    if (!orgData.vector_store_id) {
      return res.status(400).json({ error: 'Tietokantaa ei ole luotu (vector_store_id puuttuu)' })
    }

    const bucket = 'temp-ingest'
    const supabaseSrv = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const form = formidable({ maxFileSize: 100 * 1024 * 1024, maxFields: 50 })
    const [fields, files] = await form.parse(req)
    const uploadedFiles = files.files || []

    if (!uploadedFiles.length) return res.status(400).json({ error: 'Ei tiedostoja annettu' })

    const fileNamesField = fields.fileNames?.[0]
    const providedNames = (() => {
      try { return JSON.parse(fileNamesField || '[]') } catch { return [] }
    })()

    const sanitizedNames = uploadedFiles.map((f, idx) => sanitizeFilename(providedNames[idx] || f.originalFilename || `file_${idx}`))
    const storagePaths = uploadedFiles.map((_, idx) => `${orgId}/${Date.now()}-${idx}-${sanitizedNames[idx]}`)

    // Insert rows to Supabase table (tracking)
    const rows = uploadedFiles.map((f, idx) => ({
      org_id: orgId,
      created_by: req.authUser.id,
      vector_store_id: orgData.vector_store_id,
      source_type: 'file',
      file_name: providedNames[idx] || f.originalFilename || `file_${idx}`,
      mime_type: f.mimetype || null,
      file_size: f.size || null,
      status: 'uploading_to_temp',
      storage_bucket: bucket,
      storage_path: storagePaths[idx],
      file_url: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePaths[idx]}`,
    }))

    const { data: inserted, error: insertErr } = await req.supabase
      .from('calls_knowledge_files')
      .insert(rows)
      .select('id, file_name, storage_path, file_url')

    if (insertErr) {
      return res.status(500).json({ error: 'Tiedostometadatan tallennus epäonnistui', details: insertErr.message })
    }

    // Upload to Supabase temp bucket
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i]
      const buffer = await fs.promises.readFile(file.filepath)

      const { error: upErr } = await supabaseSrv.storage
        .from(bucket)
        .upload(storagePaths[i], buffer, {
          contentType: file.mimetype || 'application/octet-stream',
          upsert: true,
        })

      try { fs.unlinkSync(file.filepath) } catch {}

      if (upErr) {
        const ids = (inserted || []).map(r => r.id)
        try {
          await req.supabase
            .from('calls_knowledge_files')
            .update({ status: 'failed', error: upErr.message })
            .in('id', ids)
        } catch {}
        return res.status(500).json({ error: 'Tiedoston tallennus temp-bucketiin epäonnistui', details: upErr.message })
      }
    }

    // Mark rows temp-upload completed
    const ids = (inserted || []).map(r => r.id)
    try {
      await req.supabase
        .from('calls_knowledge_files')
        .update({ status: 'uploaded_to_temp', error: null })
        .in('id', ids)
    } catch {}

    // Send URL payload to N8N (HMAC)
    const payloadFiles = (inserted || []).map((r, idx) => ({
      id: r.id,
      filename: r.file_name,
      url: r.file_url,
      bucket,
      path: r.storage_path,
      mimeType: uploadedFiles[idx]?.mimetype || null,
      size: uploadedFiles[idx]?.size || null,
    }))

    let n8nResp
    try {
      n8nResp = await sendToN8N(webhookUrl, {
        action: 'feed',
        orgId,
        vector_store_id: orgData.vector_store_id,
        files: payloadFiles,
        uploadedAt: new Date().toISOString(),
      })
    } catch (e) {
      try {
        await req.supabase
          .from('calls_knowledge_files')
          .update({ status: 'failed', error: e.message })
          .in('id', ids)
      } catch {}
      return res.status(500).json({ error: 'N8N webhook virhe', details: e.message })
    }

    try {
      await req.supabase
        .from('calls_knowledge_files')
        .update({ status: 'sent_to_webhook', error: null })
        .in('id', ids)
    } catch {}

    return res.status(200).json({ success: true, uploaded: inserted?.length || 0, webhookResponse: n8nResp })
  } catch (e) {
    return res.status(500).json({ error: 'Virhe knowledge-base uploadissa', details: e.message })
  }
}

export default withOrganization(handler)

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

