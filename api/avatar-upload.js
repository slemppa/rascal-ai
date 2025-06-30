import { handleUpload } from '@vercel/blob/client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = await req.json()
    
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Tarkista käyttäjän oikeudet tässä jos tarpeen
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp3'],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            // Voi sisältää käyttäjän ID:n tai muuta metadataa
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Tiedosto ladattu onnistuneesti
        console.log('Avatar upload completed:', blob.url)
        
        // Tässä voi päivittää tietokantaa blob.url:lla
        // const { userId } = JSON.parse(tokenPayload)
        // await db.update({ avatar: blob.url, userId })
      },
    })

    return res.status(200).json(jsonResponse)
  } catch (error) {
    console.error('Avatar upload failed:', error)
    return res.status(500).json({ error: 'Upload failed', details: error.message })
  }
}