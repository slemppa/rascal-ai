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
      maxFileSize: 50 * 1024 * 1024, // 50MB
    })

    const [fields, files] = await form.parse(req)
    const file = files.file?.[0]
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Lue tiedosto
    const fileBuffer = fs.readFileSync(file.filepath)
    
    // Lataa Vercel Blobiin
    const blob = await put(file.originalFilename || file.newFilename, fileBuffer, {
      access: 'public',
      addRandomSuffix: true,
    })

    // Poista väliaikainen tiedosto
    fs.unlinkSync(file.filepath)

    return res.status(200).json(blob)
  } catch (error) {
    console.error('Avatar upload failed', error)
    return res.status(500).json({ error: 'Upload failed', details: error.message })
  }
}