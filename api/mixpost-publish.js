import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { workspace_uuid, api_token, content, account_ids, scheduled_at } = req.body

  if (!workspace_uuid || !api_token || !content || !account_ids) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const payload = {
      content: content,
      account_ids: account_ids,
      ...(scheduled_at && { scheduled_at: scheduled_at })
    }

    const response = await axios.post(`https://mixpost.mak8r.fi/mixpost/api/${workspace_uuid}/posts`, payload, {
      headers: {
        'Authorization': `Bearer ${api_token}`,
        'Content-Type': 'application/json'
      }
    })

    return res.status(200).json(response.data)
  } catch (error) {
    return res.status(error.response?.status || 500).json({ 
      error: 'Failed to publish content', 
      details: error.response?.data || error.message 
    })
  }
} 