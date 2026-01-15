import { withOrganization } from '../_middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../_lib/cors.js'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function handler(req, res) {
  // CORS headers
  setCorsHeaders(res, ['POST', 'OPTIONS'])
  
  // Handle preflight requests
  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Tarkista että organization on saatavilla (withOrganization middleware)
    if (!req.organization || !req.organization.id) {
      console.error('Import post error: Organization not found', {
        hasOrganization: !!req.organization,
        hasOrgId: !!req.organization?.id
      })
      return res.status(401).json({ 
        error: 'Unauthorized: Organization not found' 
      })
    }

    if (!req.supabase) {
      console.error('Import post error: Supabase client not found')
      return res.status(500).json({ 
        error: 'Internal server error: Supabase client missing' 
      })
    }

    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxFields: 10,
      timeout: 60000, // 60 sekuntia timeout
      keepExtensions: true,
      allowEmptyFiles: true, // Sallitaan tyhjät tiedostot koska media on valinnainen
      minFileSize: 0 // Sallitaan 0 koko koska media on valinnainen
    })

    console.log('Import post: Parsing form data...')
    const [fields, files] = await form.parse(req)
    
    const type = fields.type?.[0]
    const title = fields.title?.[0] || ''
    const caption = fields.caption?.[0] || ''
    const fileTypeFromFrontend = fields.fileType?.[0] // File.type frontendistä
    
    // Tarkista että tiedosto on olemassa ja validi
    // Media on valinnainen, joten tarkistetaan vain jos tiedosto on todella lähetetty
    let rawFile = null
    if (files.file && Array.isArray(files.file) && files.file.length > 0) {
      rawFile = files.file[0]
    } else if (files.media && Array.isArray(files.media) && files.media.length > 0) {
      rawFile = files.media[0]
    }
    
    // Tarkista että tiedosto on oikeasti olemassa ja validi
    const file = rawFile && 
                 rawFile.filepath && 
                 typeof rawFile.filepath === 'string' &&
                 fs.existsSync(rawFile.filepath) &&
                 rawFile.size > 0 ? rawFile : null
    
    console.log('Import post: Form data', {
      hasRawFile: !!rawFile,
      hasValidFile: !!file,
      type: type,
      fileTypeFromFrontend: fileTypeFromFrontend,
      rawFileMimetype: rawFile?.mimetype,
      rawFileSize: rawFile?.size,
      rawFilePath: rawFile?.filepath
    })

    if (!type) {
      console.error('Import post: Type is missing')
      return res.status(400).json({ 
        error: 'Tyyppi puuttuu',
        details: 'Valitse julkaisun tyyppi (Photo, Reels, LinkedIn)'
      })
    }

    // Käytetään organisaation ID:tä (req.organization.id) userId:nä
    const userId = req.organization.id
    const supabase = req.supabase

    // Yksinkertainen logiikka: jos tiedosto on annettu -> ladataan, muuten -> julkaisu ilman mediaa
    let mediaUrl = null
    let uploadedFilePath = null
    
    if (file) {
      // Tiedosto on annettu -> ladataan se
      const bucket = 'content-media'
      
      // Käytä frontendistä tullutta MIME-tyyppiä (File.type) tai formidable:n tunnistamaa
      let mimeType = fileTypeFromFrontend || file.mimetype
      
      console.log('Import post: MIME type detection', {
        fileTypeFromFrontend: fileTypeFromFrontend,
        fileMimetype: file.mimetype,
        finalMimeType: mimeType
      })
      
      // Jos MIME-tyyppi puuttuu tai on application/octet-stream, käytetään oletusta
      // Supabase Storage hyväksyy application/octet-stream, mutta yritetään tunnistaa parempi
      if (!mimeType || mimeType === 'application/octet-stream') {
        // Yritä tunnistaa tiedostotyyppi tiedostonimestä
        const originalFilename = file.originalFilename || file.newFilename || ''
        if (originalFilename) {
          const ext = originalFilename.split('.').pop()?.toLowerCase()
          if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg'
          else if (ext === 'png') mimeType = 'image/png'
          else if (ext === 'gif') mimeType = 'image/gif'
          else if (ext === 'webp') mimeType = 'image/webp'
          else if (ext === 'mp4') mimeType = 'video/mp4'
          else if (ext === 'mov') mimeType = 'video/quicktime'
          else if (ext === 'webm') mimeType = 'video/webm'
        }
      }
      
      // Jos edelleen application/octet-stream, käytetään sitä (Supabase voi hyväksyä sen)
      if (!mimeType) {
        mimeType = 'application/octet-stream'
      }

      // Päättele tiedostopääte MIME-tyypistä
      let fileExt = 'jpg'
      if (mimeType.startsWith('image/')) {
        if (mimeType.includes('jpeg')) fileExt = 'jpg'
        else if (mimeType.includes('png')) fileExt = 'png'
        else if (mimeType.includes('gif')) fileExt = 'gif'
        else if (mimeType.includes('webp')) fileExt = 'webp'
      } else if (mimeType.startsWith('video/')) {
        if (mimeType.includes('mp4')) fileExt = 'mp4'
        else if (mimeType.includes('quicktime')) fileExt = 'mov'
        else if (mimeType.includes('webm')) fileExt = 'webm'
      }
      
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${userId}/${fileName}`
      uploadedFilePath = filePath

      const fileBuffer = fs.readFileSync(file.filepath)
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: mimeType
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return res.status(500).json({ 
          error: 'Tiedoston lataus epäonnistui', 
          details: uploadError.message
        })
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      mediaUrl = urlData.publicUrl
      
      // Poista väliaikainen tiedosto
      try {
        fs.unlinkSync(file.filepath)
      } catch (unlinkError) {
        console.warn('Failed to delete temp file:', unlinkError)
      }
    }
    // Jos tiedostoa ei ole -> mediaUrl pysyy null, luodaan julkaisu ilman mediaa

    // Tallenna content-tauluun
    const mediaUrls = mediaUrl ? [mediaUrl] : []
    
    const { data: insertedData, error: insertError } = await supabase
      .from('content')
      .insert({
        user_id: userId,
        type: type,
        idea: title || 'Tuotu julkaisu',
        caption: caption || '',
        media_urls: mediaUrls,
        status: 'In Progress',
        is_generated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      // Poista ladattu tiedosto jos insert epäonnistui
      if (uploadedFilePath && mediaUrl) {
        const bucket = 'content-media'
        await supabase.storage.from(bucket).remove([uploadedFilePath])
      }
      console.error('Content insert error:', insertError)
      return res.status(500).json({ 
        error: 'Tallennus epäonnistui', 
        details: insertError.message 
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Julkaisu tuotu onnistuneesti',
      data: insertedData
    })

  } catch (error) {
    console.error('Import post error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    })
    return res.status(500).json({ 
      error: 'Palvelinvirhe', 
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
  }
}

export default withOrganization(handler)
