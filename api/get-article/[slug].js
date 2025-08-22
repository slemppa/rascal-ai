import { createClient } from '@supabase/supabase-js'

// Env fallbacks similar to /api/get-articles
const supabaseUrl = process.env.SUPABASE_URL 
	|| process.env.VITE_SUPABASE_URL 
	|| process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
	|| process.env.VITE_SUPABASE_ANON_KEY 
	|| process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
	res.setHeader('Content-Type', 'application/json; charset=utf-8')

	if (req.method === 'OPTIONS') {
		return res.status(204).end()
	}

	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' })
	}

	if (!supabaseUrl || !supabaseKey) {
		return res.status(500).json({ 
			error: 'Supabase config missing',
			hasUrl: Boolean(supabaseUrl),
			hasKey: Boolean(supabaseKey)
		})
	}

	// Robust slug extraction: query -> params -> path segment
	let slug = (req.query && req.query.slug) || (req.params && req.params.slug) || ''
	if (!slug && req.url) {
		const match = req.url.match(/\/api\/get-article\/([^/?#]+)/)
		if (match && match[1]) slug = decodeURIComponent(match[1])
	}

	if (!slug) {
		return res.status(400).json({ error: 'Slug is required' })
	}

	try {
		const { data: article, error } = await supabase
			.from('blog_posts')
			.select('id,title,slug,excerpt,content,category,image_url,published_at,published,created_at,updated_at')
			.eq('slug', slug)
			.eq('published', true)
			.single()

		if (error) {
			// PGRST116: No rows
			if (error.code === 'PGRST116') {
				return res.status(404).json({ error: 'Article not found' })
			}
			console.error('Error fetching article:', error)
			return res.status(500).json({ error: 'Failed to fetch article', details: error.message })
		}

		return res.status(200).json(article)
	} catch (error) {
		console.error('Unhandled error /api/get-article:', error)
		return res.status(500).json({ error: 'Internal server error', details: error.message })
	}
}
