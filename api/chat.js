import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const N8N_CHAT_API_URL = process.env.N8N_CHAT_API_URL
  if (!N8N_CHAT_API_URL) {
    return res.status(500).json({ error: 'N8N_CHAT_API_URL not set' })
  }

  try {
    const response = await axios.post(N8N_CHAT_API_URL, req.body)
    return res.status(200).json(response.data)
  } catch (error) {
    return res.status(500).json({ error: 'Chat proxy error', details: error.message })
  }
} 