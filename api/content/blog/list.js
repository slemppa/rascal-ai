import { createClient } from '@supabase/supabase-js'

// Fallbackit paikalliseen deviin: käytä palvelinenv > VITE_ > NEXT_PUBLIC_
const supabaseUrl = process.env.SUPABASE_URL 
	|| process.env.NEXT_PUBLIC_SUPABASE_URL
	|| process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
	|| process.env.SUPABASE_ANON_KEY
	|| process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
	|| process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

import { setCorsHeaders, handlePreflight } from '../../_lib/cors.js'

export default async function handler(req, res) {
	setCorsHeaders(res, ['GET', 'OPTIONS'], ['Content-Type', 'Authorization'])
	res.setHeader('Content-Type', 'application/json; charset=utf-8')

	if (handlePreflight(req, res)) {
		return
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

	try {
		const { data: articles, error } = await supabase
			.from('blog_posts')
			.select('id,title,slug,excerpt,content,category,image_url,published_at,published')
			.eq('published', true)
			.order('published_at', { ascending: false })

		if (error) {
			console.error('Error fetching articles:', error)
			return res.status(500).json({ error: 'Failed to fetch articles', details: error.message })
		}

		res.status(200).json(articles || [])
	} catch (error) {
		console.error('Unhandled error /api/get-articles:', error)
		res.status(500).json({ error: 'Internal server error', details: error.message })
	}
}
