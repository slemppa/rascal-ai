import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Article ID is required' })
  }

  try {
    // Delete article
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting article:', error)
      return res.status(500).json({ error: 'Failed to delete article' })
    }

    res.status(200).json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
