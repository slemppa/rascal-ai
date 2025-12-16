import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { file, fileName } = req.body

    if (!file || !fileName) {
      return res.status(400).json({ error: 'File and fileName are required' })
    }

    // Generate unique filename
    const fileExtension = fileName.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(file.replace(/^data:image\/\w+;base64,/, ''), 'base64')

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('blog-covers')
      .upload(uniqueFileName, fileBuffer, {
        contentType: `image/${fileExtension}`,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return res.status(500).json({ error: 'Failed to upload image', details: error.message })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('blog-covers')
      .getPublicUrl(uniqueFileName)

    return res.status(200).json({
      success: true,
      fileName: uniqueFileName,
      publicUrl: urlData.publicUrl
    })

  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
