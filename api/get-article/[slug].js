import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { slug } = req.query

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' })
  }

  try {
    const { data: article, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Article not found' })
      }
      console.error('Error fetching article:', error)
      return res.status(500).json({ error: 'Failed to fetch article' })
    }

    res.status(200).json(article)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
