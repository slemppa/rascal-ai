import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'
import { sendToN8N } from '../lib/n8n-client.js'

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB - Supabase sallii suurempia tiedostoja
      maxFields: 10,
      maxFieldsSize: 1024 * 1024, // 1MB metadata
    })

    const [fields, files] = await form.parse(req)
    const file = files.file?.[0]
    const companyId = fields.companyId?.[0] // Hae companyId FormDatasta
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Tarkista tiedoston koko
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 10MB for avatar images.' 
      })
    }

    // Tunnista tiedostotyyppi
    const filename = file.originalFilename || file.newFilename
    const fileExtension = filename.split('.').pop()?.toLowerCase()
    let fileType = 'unknown'
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      fileType = 'image'
    } else if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(fileExtension)) {
      fileType = 'audio'
    }

    // Supabase Storage setup
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase envs missing for storage upload')
      return res.status(500).json({ error: 'Supabase configuration missing' })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Lue tiedosto
    const fileBuffer = fs.readFileSync(file.filepath)
    
    // Luo uniikki tiedostonimi
    const fileExt = fileExtension || 'jpg'
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.${fileExt}`
    const filePath = `avatars/${uniqueFileName}`
    
    // Lataa Supabase Storageen
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('content-media')
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype || `image/${fileExt}`,
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return res.status(500).json({ error: 'Upload failed', details: uploadError.message })
    }

    // Hae julkinen URL
    const { data: urlData } = supabase.storage
      .from('content-media')
      .getPublicUrl(filePath)

    // Poista väliaikainen tiedosto
    fs.unlinkSync(file.filepath)

    // Lähetä webhook N8N:ään HMAC-allekirjoituksella
    const N8N_AVATAR_UPLOAD_URL = process.env.N8N_AVATAR_UPLOAD_URL || 'https://samikiias.app.n8n.cloud/webhook/avatar-upload'
    
    try {
      await sendToN8N(N8N_AVATAR_UPLOAD_URL, {
        type: fileType === 'audio' ? 'voice-upload' : 'avatar-upload',
        fileType: fileType,
        url: urlData.publicUrl,
        path: filePath,
        filename: uniqueFileName,
        uploadedAt: new Date().toISOString(),
        companyId: companyId || null,
      })
    } catch (webhookError) {
      console.error('Webhook processing failed:', webhookError)
      // Älä kaada koko uploadia webhook-virheen takia
    }

    return res.status(200).json({
      url: urlData.publicUrl,
      path: filePath,
      filename: uniqueFileName,
      fileType: fileType
    })
  } catch (error) {
    console.error('Avatar upload failed', error)
    return res.status(500).json({ error: 'Upload failed', details: error.message })
  }
}