import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Tarkista että anon key on saatavilla
  if (!supabaseAnonKey) {
    console.error('SUPABASE_ANON_KEY puuttuu ympäristömuuttujista')
    return res.status(500).json({ 
      error: 'Palvelinvirhe', 
      details: 'supabaseKey is required.' 
    })
  }

  try {
    const access_token = req.headers['authorization']?.replace('Bearer ', '')
    if (!access_token) {
      return res.status(401).json({ error: 'Unauthorized: access token puuttuu' })
    }

    // Luo Supabase-yhteys käyttäjän tokenilla (kuten muissa endpointissa)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${access_token}` } }
    })

    if (req.method === 'POST') {
      // Kuvan lisäys
      const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFields: 5,
        timeout: 30000, // 30 sekuntia timeout
        keepExtensions: true,
        allowEmptyFiles: false,
        minFileSize: 1
      })

      console.log('DEBUG - Starting form parse...')
      const [fields, files] = await form.parse(req)
      console.log('DEBUG - Form parsed successfully')
      
      const file = files.image?.[0]
      const contentId = fields.contentId?.[0]
      const userId = fields.userId?.[0]
      const replaceMode = fields.replaceMode?.[0] === 'true'

      console.log('DEBUG - Form data:', { 
        hasFile: !!file, 
        contentId, 
        userId, 
        replaceMode,
        fileName: file?.originalFilename,
        fileSize: file?.size
      })

      if (!file || !contentId || !userId) {
        console.error('DEBUG - Missing required fields:', { file: !!file, contentId, userId })
        return res.status(400).json({ 
          error: 'Missing fields: image, contentId, userId' 
        })
      }

      // Generate unique filename with timestamp
      const fileExtension = file.originalFilename?.split('.').pop() || 'jpg'
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substr(2, 6)
      const fileName = `${timestamp}_${randomSuffix}.${fileExtension}`

      // Lataa kuva bucket:iin suoraan images kansioon
      const filePath = `images/${fileName}`
      
      if (!file.filepath || !fs.existsSync(file.filepath)) {
        return res.status(400).json({ 
          error: 'File processing failed: file path not found' 
        })
      }
      
      const fileBuffer = fs.readFileSync(file.filepath)
      console.log('DEBUG - About to upload to storage:', { filePath, fileSize: fileBuffer.length })
      
      const { data, error: uploadError } = await supabase.storage
        .from('content-media')
        .upload(filePath, fileBuffer, {
          contentType: `image/${fileExtension}`,
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return res.status(500).json({ 
          error: 'Image upload failed', 
          details: uploadError.message 
        })
      }
      
      console.log('DEBUG - Upload successful:', data)

      // Hae julkinen URL käyttäen samaa polkua kuin upload
      const { data: urlData } = supabase.storage
        .from('content-media')
        .getPublicUrl(filePath)

      // Lisää URL content.media_urls array:hin
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .select('media_urls')
        .eq('id', contentId)
        .eq('user_id', userId)
        .single()

      if (contentError) {
        // Remove uploaded image if content fetch failed
        await supabase.storage.from('content-media').remove([filePath])
        return res.status(400).json({ 
          error: 'Content not found', 
          details: contentError.message 
        })
      }

      const currentMediaUrls = contentData.media_urls || []
      const newMediaUrls = replaceMode ? [urlData.publicUrl] : [...currentMediaUrls, urlData.publicUrl]

      const { error: updateError } = await supabase
        .from('content')
        .update({
          media_urls: newMediaUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)
        .eq('user_id', userId)

      if (updateError) {
        // Remove uploaded image if update failed
        await supabase.storage.from('content-media').remove([filePath])
        return res.status(500).json({ 
          error: 'Image addition failed', 
          details: updateError.message 
        })
      }

      // Remove temporary file
      fs.unlinkSync(file.filepath)

      return res.status(200).json({
        success: true,
        message: 'Image added successfully',
        fileName,
        publicUrl: urlData.publicUrl,
        mediaUrls: newMediaUrls
      })

    } else if (req.method === 'DELETE') {
      // Kuvan poisto
      const { contentId, imageUrl } = req.body

      console.log('DEBUG - DELETE request:', { contentId, imageUrl });

      if (!contentId || !imageUrl) {
        return res.status(400).json({ 
          error: 'Missing fields: contentId, imageUrl' 
        })
      }

      // Hae nykyinen content data
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .select('media_urls, user_id')
        .eq('id', contentId)
        .single()

      console.log('DEBUG - Content data:', contentData);
      console.log('DEBUG - Current media_urls:', contentData?.media_urls);

      if (contentError) {
        return res.status(400).json({ 
          error: 'Content not found', 
          details: contentError.message 
        })
      }

      const currentMediaUrls = contentData.media_urls || []
      
      // Poista URL array:sta
      const newMediaUrls = currentMediaUrls.filter(url => url !== imageUrl)
      
      console.log('DEBUG - Filtered URLs:', { currentMediaUrls, newMediaUrls, imageUrl });
      
      if (newMediaUrls.length === currentMediaUrls.length) {
        return res.status(400).json({ 
          error: 'Image not found in media_urls list' 
        })
      }

      // Poista tiedosto bucket:ista
      console.log('DEBUG - imageUrl:', imageUrl);
      
      // Poimi tiedostonimi URL:sta ja muodosta polku
      const fileName = imageUrl.split('/').pop()
      console.log('DEBUG - fileName:', fileName);
      
      // Muodosta polku tiedostolle images kansiossa
      const filePath = `images/${fileName}`
      console.log('DEBUG - filePath:', filePath);
      
      // Poista tiedosto images kansiosta
      const { error: storageError } = await supabase.storage
        .from('content-media')
        .remove([filePath])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Jatka silti tietokannan päivitystä
      }

      // Päivitä content.media_urls
      const { error: updateError } = await supabase
        .from('content')
        .update({
          media_urls: newMediaUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)

      if (updateError) {
        return res.status(500).json({ 
          error: 'Image deletion failed', 
          details: updateError.message 
        })
      }

      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
        fileName,
        mediaUrls: newMediaUrls
      })
    }

  } catch (error) {
    console.error('Content media management error:', error)
    return res.status(500).json({ 
      error: 'Palvelinvirhe', 
      details: error.message 
    })
  }
}
