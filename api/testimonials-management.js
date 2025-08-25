import axios from 'axios'
import formidable from 'formidable'
import { put } from '@vercel/blob'
import { readFile } from 'fs/promises'

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
  if (!N8N_URL) {
    return res.status(500).json({ error: 'N8N_TESTIMONIALS_URL not set' })
  }

  try {
    const form = formidable({ multiples: false })
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
          const buffer = await readFile(avatarFile.filepath)
          const originalName = avatarFile.originalFilename || avatarFile.newFilename || 'avatar.jpg'
          const filename = `testimonials/${Date.now()}-${originalName}`
          const blob = await put(filename, buffer, {
            access: 'public',
            contentType: avatarFile.mimetype || 'application/octet-stream',
            addRandomSuffix: true
          })
          avatarUrl = blob.url
          avatarStoredPath = blob.pathname || filename
          avatarOriginalFilename = originalName
          avatarMimeType = avatarFile.mimetype || ''
          avatarSize = avatarFile.size || 0
        } catch (e) {
          console.error('Blob upload failed:', e)
          return res.status(500).json({ error: 'Blob upload failed', details: e?.message })
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
        const response = await axios.post(N8N_URL, payload, {
          headers: {
            'Content-Type': 'application/json',
            ...(N8N_SECRET_KEY ? { 'x-api-key': N8N_SECRET_KEY } : {})
          }
        })
        return res.status(200).json(response.data)
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


