import axios from 'axios'

const N8N_UPDATE_CALL_TYPE_URL = process.env.N8N_UPDATE_CALL_TYPE_URL || 'https://samikiias.app.n8n.cloud/webhook/update-call-type'
const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Tarkista että ympäristömuuttujat on asetettu
  if (!N8N_UPDATE_CALL_TYPE_URL) {
    console.error('Missing N8N_UPDATE_CALL_TYPE_URL environment variable')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const { recordId, fields } = req.body
    
    if (!recordId) {
      return res.status(400).json({ error: 'recordId is required' })
    }

    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ error: 'fields object is required' })
    }

    console.log('Updating call type:', recordId, 'with fields:', fields)

    // Lähetä kutsu N8N webhookiin
    const response = await axios.put(N8N_UPDATE_CALL_TYPE_URL, {
      recordId,
      fields: fields
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_SECRET_KEY
      }
    })

    console.log('Call type updated successfully via N8N:', response.data)

    res.status(200).json({ 
      success: true, 
      record: response.data?.record,
      message: 'Puhelutyyppi päivitetty onnistuneesti'
    })
  } catch (error) {
    console.error('N8N webhook error:', error.response?.status, error.response?.statusText)
    console.error('Error details:', error.response?.data || error.message)
    
    res.status(error.response?.status || 500).json({ 
      error: `N8N webhook failed: ${error.response?.status || 500} ${error.response?.statusText || 'Internal Server Error'}`,
      details: error.response?.data || error.message
    })
  }
} 