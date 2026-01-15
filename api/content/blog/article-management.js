import { sendToN8N } from '../../_lib/n8n-client.js'
import formidable from 'formidable'
import { put } from '@vercel/blob'
import { readFile } from 'fs/promises'
import { setCorsHeaders, handlePreflight } from '../../_lib/cors.js'

export const config = {
	api: {
		bodyParser: false
	}
}

export default async function handler(req, res) {
	setCorsHeaders(res, ['POST', 'OPTIONS'], ['Content-Type', 'x-api-key', 'Authorization'])

	if (handlePreflight(req, res)) {
		return
	}

	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' })
	}

	const N8N_URL = process.env.N8N_CMS_URL
	const N8N_UPDATE_URL = process.env.N8N_CMS_UPDATE
	
	if (!N8N_URL) {
		return res.status(500).json({ error: 'N8N_CMS_URL not set' })
	}

		try {
			const form = formidable({ multiples: false })
			form.parse(req, async (err, fields, files) => {
				if (err) {
					console.error('Form parse error:', err)
					return res.status(400).json({ error: 'Invalid form data' })
				}

				const getField = (key, def = '') => {
					const v = fields[key]
					if (Array.isArray(v)) return v[0] ?? def
					return v ?? def
				}

				// Valitse oikea URL action:in perusteella
				const action = String(getField('action') || 'create')
				const targetUrl = action === 'update' ? N8N_UPDATE_URL : N8N_URL
				
				if (!targetUrl) {
					return res.status(500).json({ error: `N8N URL not set for action: ${action}` })
				}

			let imageUrl = getField('image_url', '')
			let imageOriginalFilename = getField('image_filename', '')
			let imageStoredPath = getField('image_path', '')
			let imageMimeType = getField('image_mime', '')
			let imageSize = parseInt(getField('image_size', '0'))

			// Jos mukana on binary-kuva, lataa se Vercel Blobiin
			const rawImage = files.image
			const imgFile = Array.isArray(rawImage) ? rawImage[0] : rawImage
			if (imgFile && imgFile.filepath) {
				try {
					const buffer = await readFile(imgFile.filepath)
					const originalName = imgFile.originalFilename || imgFile.newFilename || 'cover.jpg'
					const filename = `blog-covers/${Date.now()}-${originalName}`
					const blob = await put(filename, buffer, {
						access: 'public',
						contentType: imgFile.mimetype || 'application/octet-stream',
						addRandomSuffix: true
					})
					imageUrl = blob.url
					imageStoredPath = blob.pathname || filename
					imageOriginalFilename = originalName
					imageMimeType = imgFile.mimetype || ''
					imageSize = imgFile.size || 0
				} catch (e) {
					console.error('Blob upload failed:', e)
					return res.status(500).json({ error: 'Blob upload failed', details: e?.message })
				}
			}

			// Rakenna JSON payload N8N:lle
			const payload = {
				action: String(getField('action') || 'create'),
				id: getField('articleId') ? String(getField('articleId')) : null, // Supabase ID (articleId = editingArticle.id)
				title: String(getField('title') || ''),
				slug: String(getField('slug') || ''),
				excerpt: String(getField('excerpt') || ''),
				content: String(getField('content') || ''),
				category: String(getField('category') || ''),
				image_url: imageUrl,
				image_filename: imageOriginalFilename,
				image_path: imageStoredPath,
				image_mime: imageMimeType,
				image_size: imageSize,
				published_at: String(getField('published_at') || ''),
				published: String(getField('published', 'true')) === 'true'
			}

			try {
				const safePayload = {
					action: String(payload.action),
					id: payload.id ? String(payload.id) : null,
					title: String(payload.title),
					slug: String(payload.slug),
					excerpt: String(payload.excerpt),
					content: String(payload.content),
					category: String(payload.category),
					image_url: String(payload.image_url),
					image_filename: String(payload.image_filename),
					image_path: String(payload.image_path),
					image_mime: String(payload.image_mime),
					image_size: Number(payload.image_size) || 0,
					published_at: String(payload.published_at),
					published: Boolean(payload.published)
				}
				const data = await sendToN8N(targetUrl, safePayload)
				return res.status(200).json(data)
			} catch (error) {
				return res.status(500).json({ error: 'Proxy error', details: error.message })
			}
		})
	} catch (error) {
		console.error('Unhandled blog-article-management error:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}
