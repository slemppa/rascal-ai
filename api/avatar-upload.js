import { put } from '@vercel/blob'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { filename } = req.query
  if (!filename) {
    return res.status(400).json({ error: 'filename query param required' })
  }

  try {
    // Lataa Vercel Blobiin. Parametrina suoraan request-streami.
    const blob = await put(filename, req, {
      access: 'public',
      multipart: true, // käytä multipart-uploadia suurille tiedostoille
    })

    return res.status(200).json(blob)
  } catch (error) {
    console.error('Avatar upload failed', error)
    return res.status(500).json({ error: 'Upload failed', details: error.message })
  }
}