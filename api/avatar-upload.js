import { put } from '@vercel/blob'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('Request URL:', req.url)
  console.log('Request query:', req.query)
  console.log('Request headers:', req.headers)

  // Kokeillaan eri tapoja hakea filename
  const { filename } = req.query || {}
  const urlFilename = req.url ? new URL(req.url, `http://${req.headers.host}`).searchParams.get('filename') : null
  
  const finalFilename = filename || urlFilename
  
  if (!finalFilename) {
    return res.status(400).json({ 
      error: 'filename query param required',
      debug: {
        reqQuery: req.query,
        urlFilename,
        finalFilename,
        url: req.url
      }
    })
  }

  try {
    // Lataa Vercel Blobiin. Parametrina suoraan request-streami.
    const blob = await put(finalFilename, req, {
      access: 'public',
      multipart: true, // käytä multipart-uploadia suurille tiedostoille
    })

    return res.status(200).json(blob)
  } catch (error) {
    console.error('Avatar upload failed', error)
    return res.status(500).json({ error: 'Upload failed', details: error.message })
  }
}