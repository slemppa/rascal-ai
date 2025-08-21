import axios from 'axios'
import formidable from 'formidable'
import { put } from '@vercel/blob'
import { readFile } from 'fs/promises'

export const config = {
	api: {
		bodyParser: false
	}
}

export default async function handler(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key')

	if (req.method === 'OPTIONS') {
		return res.status(204).end()
	}

	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' })
	}

	const N8N_URL = process.env.N8N_CMS_URL
	const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY
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

			let imageUrl = getField('image_url', '')
			let imageOriginalFilename = ''
			let imageStoredPath = ''
			let imageMimeType = ''
			let imageSize = 0

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
				articleId: getField('articleId') ? String(getField('articleId')) : null,
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
				const response = await axios.post(N8N_URL, payload, {
					headers: {
						'Content-Type': 'application/json',
						...(N8N_SECRET_KEY ? { 'x-api-key': N8N_SECRET_KEY } : {})
					}
				})
				return res.status(200).json(response.data)
			} catch (error) {
				const status = error.response?.status || 500
				const data = error.response?.data || { message: error.message }
				console.error('blog-article-management proxy error:', status, data)
				return res.status(status).json({ error: 'Proxy error', status, details: data })
			}
		})
	} catch (error) {
		console.error('Unhandled blog-article-management error:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}
