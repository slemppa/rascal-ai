const N8N_GET_POSTS_URL = process.env.N8N_GET_POSTS_URL || 'https://samikiias.app.n8n.cloud/webhook/get-rascalai-posts123890'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { companyId } = req.query
  const url = companyId
    ? `${N8N_GET_POSTS_URL}?companyId=${companyId}`
    : N8N_GET_POSTS_URL
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': process.env.N8N_SECRET_KEY
      }
    })
    const data = await response.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: 'Virhe haussa' })
  }
} 