import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, name, title, company, quote, avatar_url, published, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching testimonials:', error)
      return res.status(500).json({ error: 'Failed to fetch testimonials' })
    }

    return res.status(200).json({ data: data || [] })
  } catch (err) {
    console.error('Unhandled error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


