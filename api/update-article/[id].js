import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Article ID is required' })
  }

  try {
    const { title, slug, excerpt, content, category, image_url, published_at } = req.body

    // Validate required fields
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' })
    }

    // Check if slug already exists for another article
    const { data: existingArticle } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single()

    if (existingArticle) {
      return res.status(400).json({ error: 'Article with this slug already exists' })
    }

    // Update article
    const { data: article, error } = await supabase
      .from('blog_posts')
      .update({
        title,
        slug,
        excerpt,
        content,
        category,
        image_url,
        published_at: published_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        meta_description: excerpt
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating article:', error)
      return res.status(500).json({ error: 'Failed to update article' })
    }

    res.status(200).json(article)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
