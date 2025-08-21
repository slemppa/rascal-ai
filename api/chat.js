import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const N8N_CHAT_API_URL = process.env.N8N_CHAT_API_URL
  const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY
  if (!N8N_CHAT_API_URL) {
    return res.status(500).json({ error: 'N8N_CHAT_API_URL not set' })
  }

  try {
    const response = await axios.post(N8N_CHAT_API_URL, req.body, {
      headers: N8N_SECRET_KEY ? { 'x-api-key': N8N_SECRET_KEY } : {}
    })
    return res.status(200).json(response.data)
  } catch (error) {
    const status = error.response?.status || 500
    const data = error.response?.data || { message: error.message }
    return res.status(status).json({ error: 'Chat proxy error', status, details: data })
  }
} 