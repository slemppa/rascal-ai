import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { workspace_uuid, api_token } = req.query

  if (!workspace_uuid || !api_token) {
    return res.status(400).json({ error: 'Missing workspace_uuid or api_token' })
  }

  try {
    const url = `https://mixpost.mak8r.fi/mixpost/api/${workspace_uuid}/accounts`
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${api_token}`,
        'Content-Type': 'application/json'
      }
    })

    return res.status(200).json(response.data)
                } catch (error) {
                return res.status(error.response?.status || 500).json({
                  error: 'Failed to fetch accounts',
                  details: error.response?.data || error.message
                })
              }
} 