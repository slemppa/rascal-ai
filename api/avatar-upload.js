import { put } from '@vercel/blob'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Käsittele multipart/form-data
    const formData = await req.formData()
    const file = formData.get('file')
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Lataa Vercel Blobiin
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    return res.status(200).json(blob)
  } catch (error) {
    console.error('Avatar upload failed', error)
    return res.status(500).json({ error: 'Upload failed', details: error.message })
  }
}