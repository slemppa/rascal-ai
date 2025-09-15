import axios from 'axios'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { call_type_id } = req.body

    if (!call_type_id) {
      return res.status(400).json({ error: 'Missing call_type_id' })
    }

    const webhookUrl = process.env.N8N_CALL_TYPE_ENHANCEMENT || 'https://n8n.mak8r.fi/webhook/N8N_CALL_TYPE_ENHANCEMENT'
    const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

    console.log('Environment check:')
    console.log('- N8N_CALL_TYPE_ENHANCEMENT:', process.env.N8N_CALL_TYPE_ENHANCEMENT ? 'SET' : 'NOT SET')
    console.log('- N8N_SECRET_KEY:', process.env.N8N_SECRET_KEY ? 'SET' : 'NOT SET')
    console.log('Sending call type improvement request to:', webhookUrl)
    console.log('Call type ID:', call_type_id)

    const response = await axios.post(webhookUrl, {
      call_type_id: call_type_id
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_SECRET_KEY ? { 'x-api-key': N8N_SECRET_KEY } : {})
      }
    })

    console.log('Call type improvement sent successfully:', response.data)

    return res.status(200).json({ 
      success: true, 
      message: 'Call type improvement request sent successfully',
      response: response.data 
    })

  } catch (error) {
    console.error('Call type improvement error:', error)
    const status = error.response?.status || 500
    const data = error.response?.data || { message: error.message }
    return res.status(status).json({ 
      error: 'Call type improvement error', 
      message: error.message,
      details: data
    })
  }
}
