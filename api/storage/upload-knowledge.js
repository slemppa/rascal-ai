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
    console.log('=== upload-knowledge endpoint kutsuttu ===')
    console.log('Method:', req.method)
    console.log('Content-Type:', req.headers['content-type'])

    const N8N_ASSISTANT_KNOWLEDGE_URL = process.env.N8N_ASSISTANT_KNOWLEDGE_URL
    const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

    console.log('N8N_ASSISTANT_KNOWLEDGE_URL:', N8N_ASSISTANT_KNOWLEDGE_URL ? 'asetettu' : 'PUUTTUU')
    console.log('N8N_SECRET_KEY:', N8N_SECRET_KEY ? 'asetettu' : 'PUUTTUU')

    if (!N8N_ASSISTANT_KNOWLEDGE_URL) {
      console.error('N8N_ASSISTANT_KNOWLEDGE_URL puuttuu')
      return res.status(500).json({ error: 'Webhook URL ei ole konfiguroitu' })
    }

    if (!N8N_SECRET_KEY) {
      console.error('N8N_SECRET_KEY puuttuu')
      return res.status(500).json({ error: 'API-avain ei ole konfiguroitu' })
    }

    // Jos kyseessä on multipart/form-data, käsittele tiedostot
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      console.log('Käsitellään multipart/form-data tiedostot')

      const form = formidable({
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxFields: 10,
      })

      const [fields, files] = await form.parse(req)
      const uploadedFiles = files.files || []
      const userId = fields.userId?.[0]
      const action = fields.action?.[0] || 'feed'

      console.log('Knowledge upload debug:')
      console.log('- Fields:', Object.keys(fields))
      console.log('- Files count:', uploadedFiles.length)
      console.log('- UserId:', userId)
      console.log('- Action:', action)

      if (uploadedFiles.length === 0) {
        return res.status(400).json({ error: 'Ei tiedostoja annettu' })
      }

      if (!userId) {
        return res.status(400).json({ error: 'UserId puuttuu' })
      }

      // Käsittele kaikki tiedostot
      const blobResults = []
      
      for (const file of uploadedFiles) {
        console.log('Käsitellään tiedosto:', file.originalFilename)
        
        try {
          // Lue tiedosto
          const fileBuffer = fs.readFileSync(file.filepath)
          
          // Lataa Vercel Blobiin
          const blob = await put(file.originalFilename, fileBuffer, {
            access: 'public',
            addRandomSuffix: true,
          })

          // Poista väliaikainen tiedosto
          fs.unlinkSync(file.filepath)

          blobResults.push({
            filename: file.originalFilename,
            blob: blob,
            size: file.size,
          })

          console.log('Tiedosto ladattu blob:iin:', file.originalFilename, blob.url)
        } catch (fileError) {
          console.error('Virhe tiedoston käsittelyssä:', file.originalFilename, fileError)
          // Poista väliaikainen tiedosto jos se on olemassa
          if (fs.existsSync(file.filepath)) {
            fs.unlinkSync(file.filepath)
          }
          throw fileError
        }
      }

      // Lähetä webhook N8N:ään
      console.log('Lähetetään webhook N8N:ään:', N8N_ASSISTANT_KNOWLEDGE_URL)
      
      try {
        const webhookResponse = await fetch(N8N_ASSISTANT_KNOWLEDGE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': N8N_SECRET_KEY
          },
          body: JSON.stringify({
            action: action,
            userId: userId,
            files: blobResults,
            uploadedAt: new Date().toISOString(),
          }),
        })

        console.log('N8N webhook vastaus status:', webhookResponse.status)

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text()
          console.error('N8N webhook vastasi virheellä:', webhookResponse.status, webhookResponse.statusText, errorText)
          return res.status(500).json({ 
            error: 'N8N webhook virhe', 
            details: errorText,
            suggestion: 'Tarkista N8N workflowin konfiguraatio'
          })
        }

        const webhookData = await webhookResponse.json()
        console.log('N8N webhook vastaus data:', webhookData)

        return res.status(200).json({
          success: true,
          message: `${blobResults.length} tiedosto(a) ladattu onnistuneesti`,
          files: blobResults,
          webhookResponse: webhookData
        })
      } catch (webhookError) {
        console.error('Webhook käsittely epäonnistui:', webhookError)
        return res.status(500).json({ 
          error: 'Webhook käsittely epäonnistui', 
          details: webhookError.message
        })
      }
    } else {
      // JSON-payload (esim. action feed)
      console.log('Käsitellään JSON-payload')
      
      const response = await fetch(N8N_ASSISTANT_KNOWLEDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': N8N_SECRET_KEY
        },
        body: JSON.stringify(req.body)
      })

      console.log('N8N vastaus status:', response.status)

      if (!response.ok) {
        console.error('N8N webhook vastasi virheellä:', response.status, response.statusText)
        return res.status(response.status).json({ 
          error: 'Webhook-virhe', 
          status: response.status,
          statusText: response.statusText
        })
      }

      const data = await response.json()
      console.log('N8N vastaus data:', data)
      return res.status(response.status).json(data)
    }
  } catch (error) {
    console.error('Virhe upload-knowledge endpointissa:', error)
    console.error('Virheen stack:', error.stack)

    return res.status(500).json({ 
      error: 'Virhe tiedostojen käsittelyssä', 
      details: error.message,
      suggestion: 'Tarkista palvelimen lokit lisätietoja varten'
    })
  }
} 