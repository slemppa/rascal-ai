import axios from 'axios'
import formidable from 'formidable'
import { put } from '@vercel/blob'
import { readFile } from 'fs/promises'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const N8N_URL = process.env.N8N_TESTIMONIALS_URL
  const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  try {
    const accessToken = req.headers['authorization']?.replace('Bearer ', '') || ''
    const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 })
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err)
        return res.status(400).json({ error: 'Invalid form data' })
      }

      const getField = (key, def = '') => {
        const v = fields[key]
        if (Array.isArray(v)) return v[0] ?? def
        return v ?? def
      }

      let avatarUrl = getField('avatar_url', '')
      let avatarOriginalFilename = ''
      let avatarStoredPath = ''
      let avatarMimeType = ''
      let avatarSize = 0

      // Binary avatar → upload to Vercel Blob
      const rawAvatar = files.avatar
      const avatarFile = Array.isArray(rawAvatar) ? rawAvatar[0] : rawAvatar
      if (avatarFile && avatarFile.filepath) {
        try {
          // Lataa Supabase Storageen samaan tapaan kuin /api/content-media-management
          if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error('Supabase envs missing for storage upload')
            return res.status(500).json({ error: 'Supabase envs missing' })
          }
          const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}
          })
          const fileExt = (avatarFile.originalFilename?.split('.').pop() || 'jpg').toLowerCase()
          const fileName = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.${fileExt}`
          const filePath = `testimonials/${fileName}`
          const buffer = fs.readFileSync(avatarFile.filepath)
          const { error: uploadError } = await supabase.storage
            .from('content-media')
            .upload(filePath, buffer, {
              contentType: avatarFile.mimetype || `image/${fileExt}`,
              upsert: false
            })
          if (uploadError) {
            console.error('Supabase storage upload error:', uploadError)
            return res.status(500).json({ error: 'Image upload failed', details: uploadError.message })
          }
          const { data: urlData } = supabase.storage.from('content-media').getPublicUrl(filePath)
          avatarUrl = urlData.publicUrl
          avatarStoredPath = filePath
          avatarOriginalFilename = avatarFile.originalFilename || avatarFile.newFilename || 'avatar.jpg'
          avatarMimeType = avatarFile.mimetype || ''
          avatarSize = avatarFile.size || 0
          // Poista tilapäistiedosto
          try { fs.unlinkSync(avatarFile.filepath) } catch {}
        } catch (e) {
          console.error('Avatar upload failed:', e)
          return res.status(500).json({ error: 'Avatar upload failed', details: e?.message })
        }
      }

      const payload = {
        action: String(getField('action') || 'create'),
        id: getField('id') ? String(getField('id')) : null,
        name: String(getField('name') || ''),
        title: String(getField('title') || ''),
        company: String(getField('company') || ''),
        quote: String(getField('quote') || ''),
        avatar_url: avatarUrl,
        avatar_filename: avatarOriginalFilename,
        avatar_path: avatarStoredPath,
        avatar_mime: avatarMimeType,
        avatar_size: avatarSize,
        published: String(getField('published', 'true')) === 'true'
      }

      try {
        // Päivitys suoraan Supabaseen (ei N8N) jos action=update ja id annettu
        if (payload.action === 'update' && payload.id) {
          if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Env missing for Supabase update', { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_SERVICE_ROLE_KEY })
            return res.status(500).json({ error: 'Supabase service credentials missing' })
          }
          const supabaseSrv = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
          const updateFields = {
            name: payload.name,
            title: payload.title,
            company: payload.company,
            quote: payload.quote,
            avatar_url: payload.avatar_url,
            published: payload.published
          }
          const { data, error } = await supabaseSrv
            .from('testimonials')
            .update(updateFields)
            .eq('id', isNaN(Number(payload.id)) ? payload.id : Number(payload.id))
            .select()
            .single()
          if (error) {
            console.error('Supabase update error (testimonials):', error)
            return res.status(500).json({ error: 'Supabase update failed', details: error.message })
          }
          return res.status(200).json({ success: true, data })
        }

        // Luonti: jos N8N_URL on asetettu ja halutaan käyttää työnkulkua, käytä sitä
        if (payload.action === 'create' && N8N_URL) {
          const response = await axios.post(N8N_URL, payload, {
          headers: {
            'Content-Type': 'application/json',
            ...(N8N_SECRET_KEY ? { 'x-api-key': N8N_SECRET_KEY } : {})
          }
          })
          return res.status(200).json(response.data)
        }

        // Luonti suoraan Supabaseen (fallback)
        if (payload.action === 'create') {
          if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return res.status(500).json({ error: 'Supabase service credentials missing' })
          }
          const supabaseSrv = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
          const insertFields = {
            name: payload.name,
            title: payload.title,
            company: payload.company,
            quote: payload.quote,
            avatar_url: payload.avatar_url,
            published: payload.published
          }
          const { data, error } = await supabaseSrv
            .from('testimonials')
            .insert([insertFields])
            .select()
            .single()
          if (error) {
            console.error('Supabase insert error (testimonials):', error)
            return res.status(500).json({ error: 'Supabase insert failed', details: error.message })
          }
          return res.status(200).json({ success: true, data })
        }
      } catch (error) {
        const status = error.response?.status || 500
        const data = error.response?.data || { message: error.message }
        console.error('testimonials-management proxy error:', status, data)
        return res.status(status).json({ error: 'Proxy error', status, details: data })
      }
    })
  } catch (error) {
    console.error('Unhandled testimonials-management error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


