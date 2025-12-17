import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
	|| process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
	|| process.env.SUPABASE_ANON_KEY
	|| process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' })
	}

	try {
		// Haetaan julkaistut blogi-artikkelit
		const { data: articles, error } = await supabase
			.from('blog_posts')
			.select('slug, updated_at')
			.eq('published', true)
			.order('updated_at', { ascending: false })

		if (error) {
			console.error('Error fetching articles for sitemap:', error)
			// Jos tietokanta ei ole saatavilla, palautetaan staattinen sitemap
			return res.status(200)
				.setHeader('Content-Type', 'application/xml')
				.send(generateStaticSitemap())
		}

		// Generoidaan dynaaminen sitemap
		const sitemap = generateDynamicSitemap(articles || [])
		
		res.status(200)
			.setHeader('Content-Type', 'application/xml')
			.setHeader('Cache-Control', 'public, max-age=3600') // 1 tunnin välimuisti
			.send(sitemap)

	} catch (error) {
		console.error('Error generating sitemap:', error)
		// Fallback staattiseen sitemapiin
		res.status(200)
			.setHeader('Content-Type', 'application/xml')
			.send(generateStaticSitemap())
	}
}

function generateDynamicSitemap(articles) {
	const baseUrl = 'https://rascal-ai.vercel.app'
	const currentDate = new Date().toISOString().split('T')[0]

	let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Etusivu - korkein prioriteetti -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Pääsivut -->

  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${baseUrl}/ai-due-diligence</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Blogi -->
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`

	// Lisätään blogi-artikkelit
	if (articles && articles.length > 0) {
		articles.forEach(article => {
			const lastmod = article.updated_at 
				? new Date(article.updated_at).toISOString().split('T')[0]
				: currentDate
			
			sitemap += `
  <url>
    <loc>${baseUrl}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
		})
	}

	sitemap += `

  <!-- Juridiset sivut -->
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Autentikaatio-sivut -->
  <url>
    <loc>${baseUrl}/signin</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>${baseUrl}/signup</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`

	return sitemap
}

function generateStaticSitemap() {
	const baseUrl = 'https://rascal-ai.vercel.app'
	const currentDate = new Date().toISOString().split('T')[0]

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Etusivu - korkein prioriteetti -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Pääsivut -->

  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${baseUrl}/ai-due-diligence</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Blogi -->
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Juridiset sivut -->
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Autentikaatio-sivut -->
  <url>
    <loc>${baseUrl}/signin</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>${baseUrl}/signup</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`
}
