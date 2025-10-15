import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'
import axios from 'axios'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Lue ympäristömuuttujat handler-funktion sisällä (kuten muissa endpointeissa)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const n8nUrl = process.env.N8N_TICKETING_URL
  const n8nSecretKey = process.env.N8N_SECRET_KEY

  // Tarkista että tarvittavat ympäristömuuttujat on asetettu
  if (!n8nUrl || !n8nSecretKey) {
    console.error('N8N_TICKETING_URL tai N8N_SECRET_KEY puuttuu ympäristömuuttujista')
    return res.status(500).json({ 
      error: 'Palvelinvirhe', 
      details: 'Tiketöintisysteemi ei ole konfiguroitu oikein' 
    })
  }

  if (!supabaseAnonKey) {
    console.error('SUPABASE_ANON_KEY puuttuu ympäristömuuttujista')
    return res.status(500).json({ 
      error: 'Palvelinvirhe', 
      details: 'Supabase konfiguraatio puuttuu' 
    })
  }

  try {
    const access_token = req.headers['authorization']?.replace('Bearer ', '')
    if (!access_token) {
      return res.status(401).json({ error: 'Unauthorized: access token puuttuu' })
    }

    // Luo Supabase-yhteys käyttäjän tokenilla
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${access_token}` } }
    })

    // Parse form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB per file
      maxFields: 10,
      timeout: 30000, // 30 sekuntia timeout
      keepExtensions: true,
      allowEmptyFiles: false,
      minFileSize: 1
    })

    console.log('DEBUG - Parsing ticket form...')
    const [fields, files] = await form.parse(req)
    console.log('DEBUG - Form parsed successfully')

    const page = fields.page?.[0]
    const description = fields.description?.[0]
    const userEmail = fields.userEmail?.[0]
    const companyId = fields.companyId?.[0]
    const timestamp = fields.timestamp?.[0]
    const userAgent = fields.userAgent?.[0]

    console.log('DEBUG - Form fields:', { 
      page, 
      description: description?.substring(0, 100) + '...', 
      userEmail, 
      companyId,
      hasFiles: Object.keys(files).length > 0
    })

    if (!page || !description) {
      return res.status(400).json({ 
        error: 'Pakolliset kentät puuttuvat: page, description' 
      })
    }

    // Hae käyttäjän tiedot
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user?.id) {
      return res.status(401).json({ 
        error: 'User authentication failed', 
        details: userError?.message 
      })
    }

    // Hae käyttäjän tiedot public.users taulusta
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id, company_name, contact_email, role, auth_user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userDataError) {
      console.error('Error fetching user data:', userDataError)
      // Jatka silti, mutta käytä auth.users tietoja
    }

    console.log('DEBUG - User data:', { 
      authUserId: user.id, 
      userEmail: user.email,
      publicUserId: userData?.id,
      companyName: userData?.company_name
    })

    // Käsittele liitteet
    const attachmentUrls = []
    const attachmentFiles = Object.values(files).flat()

    if (attachmentFiles.length > 0) {
      console.log('DEBUG - Processing attachments:', attachmentFiles.length)

      // Lataa tiedostot Supabase temp-ingest bucket:iin
      for (let i = 0; i < attachmentFiles.length; i++) {
        const file = attachmentFiles[i]
        
        if (!file.filepath || !fs.existsSync(file.filepath)) {
          console.error('DEBUG - File not found:', file.filepath)
          continue
        }

        try {
          // Generate unique filename
          const fileExtension = file.originalFilename?.split('.').pop() || 'bin'
          const timestamp = Date.now()
          const randomSuffix = Math.random().toString(36).substr(2, 6)
          const fileName = `${timestamp}_${randomSuffix}.${fileExtension}`
          const filePath = `${user.id}/tickets/${fileName}`

          console.log('DEBUG - Uploading file to temp-ingest:', filePath)

          const fileBuffer = fs.readFileSync(file.filepath)
          const { data, error: uploadError } = await supabase.storage
            .from('temp-ingest')
            .upload(filePath, fileBuffer, {
              contentType: file.mimetype,
              upsert: false
            })

          if (uploadError) {
            console.error('Storage upload error:', uploadError)
            continue // Jatka muiden tiedostojen kanssa
          }

          // Hae julkinen URL
          const { data: urlData } = supabase.storage
            .from('temp-ingest')
            .getPublicUrl(filePath)

          attachmentUrls.push({
            fileName: file.originalFilename,
            url: urlData.publicUrl,
            size: file.size,
            type: file.mimetype
          })

          console.log('DEBUG - File uploaded successfully:', urlData.publicUrl)

          // Remove temporary file
          fs.unlinkSync(file.filepath)

        } catch (fileError) {
          console.error('File processing error:', fileError)
          // Jatka muiden tiedostojen kanssa
        }
      }
    }

    // Valmistele N8N webhook data
    const ticketData = {
      page,
      description,
      userEmail: userEmail || 'Unknown',
      companyId: companyId || 'Unknown',
      userId: userData?.id || user?.id || 'Unknown', // public.users.id tai auth.users.id
      authUserId: user?.id || 'Unknown', // auth.users.id
      companyName: userData?.company_name || 'Unknown',
      userRole: userData?.role || 'user',
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent || 'Unknown',
      attachments: attachmentUrls,
      source: 'rascal-ai-web'
    }

    console.log('DEBUG - Sending ticket to N8N:', {
      url: n8nUrl,
      hasAttachments: attachmentUrls.length > 0,
      ticketData: { ...ticketData, description: ticketData.description.substring(0, 100) + '...' }
    })

    // Lähetä N8N webhookiin
    const response = await axios.post(n8nUrl, ticketData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': n8nSecretKey
      },
      timeout: 30000 // 30s timeout
    })

    console.log('DEBUG - N8N response:', response.status)

    if (response.status === 200 || response.status === 201) {
      return res.status(200).json({
        success: true,
        message: 'Tiketti lähetetty onnistuneesti',
        ticketId: response.data?.id || 'unknown',
        attachmentsCount: attachmentUrls.length
      })
    } else {
      throw new Error(`Unexpected N8N response status: ${response.status}`)
    }

  } catch (error) {
    console.error('Ticket submission error:', error)
    
    let errorMessage = 'Tiketin lähettäminen epäonnistui'
    let errorDetails = error.message

    if (error.response) {
      // N8N API error
      errorMessage = 'N8N API virhe'
      errorDetails = error.response.data?.message || error.response.statusText
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Aikakatkaisu'
      errorDetails = 'N8N webhook ei vastannut 30 sekunnissa'
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Yhteysvirhe'
      errorDetails = 'Ei yhteyttä N8N webhookiin'
    }

    return res.status(500).json({ 
      error: errorMessage,
      details: errorDetails
    })
  }
}
