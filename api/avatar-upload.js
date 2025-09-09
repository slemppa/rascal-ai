import { put } from '@vercel/blob'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB - riittävä avatar-kuville
      maxFields: 10,
      maxFieldsSize: 1024 * 1024, // 1MB metadata
    })

    const [fields, files] = await form.parse(req)
    const file = files.file?.[0]
    const companyId = fields.companyId?.[0] // Hae companyId FormDatasta
    
    console.log('Avatar upload debug:')
    console.log('- Fields:', Object.keys(fields))
    console.log('- Files:', Object.keys(files))
    console.log('- CompanyId:', companyId)
    console.log('- File:', file ? file.originalFilename : 'No file')
    
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
    
    console.log('- File type detected:', fileType, 'from extension:', fileExtension)

    // Lue tiedosto
    const fileBuffer = fs.readFileSync(file.filepath)
    
    // Lataa Vercel Blobiin
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      addRandomSuffix: true,
    })

    // Poista väliaikainen tiedosto
    fs.unlinkSync(file.filepath)

    // Lähetä webhook N8N:ään
    const N8N_AVATAR_UPLOAD_URL = process.env.N8N_AVATAR_UPLOAD_URL || 'https://samikiias.app.n8n.cloud/webhook/avatar-upload'
    const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY
    
    try {
      console.log('Sending webhook to N8N:', N8N_AVATAR_UPLOAD_URL)
      
      const webhookResponse = await fetch(N8N_AVATAR_UPLOAD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': N8N_SECRET_KEY
        },
        body: JSON.stringify({
          type: fileType === 'audio' ? 'voice-upload' : 'avatar-upload',
          fileType: fileType,
          blob: blob,
          filename: filename,
          uploadedAt: new Date().toISOString(),
          companyId: companyId || null,
        }),
      })
      
      if (webhookResponse.ok) {
        console.log('N8N webhook sent successfully')
      } else {
        console.error('N8N webhook failed:', webhookResponse.status, webhookResponse.statusText)
      }
    } catch (webhookError) {
      console.error('Webhook processing failed:', webhookError)
      // Älä kaada koko uploadia webhook-virheen takia
    }

    return res.status(200).json({
      ...blob,
      fileType: fileType
    })
  } catch (error) {
    console.error('Avatar upload failed', error)
    return res.status(500).json({ error: 'Upload failed', details: error.message })
  }
}