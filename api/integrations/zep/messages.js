import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { threadId } = req.query
  
  if (!threadId) {
    return res.status(400).json({ error: 'threadId required' })
  }

  const ZEP_API_KEY = process.env.ZEP_API_KEY
  const ZEP_API_URL = process.env.ZEP_API_URL || 'https://api.getzep.com/api/v2'

  if (!ZEP_API_KEY) {
    console.error('[zep-messages] ZEP_API_KEY puuttuu')
    return res.status(500).json({ error: 'ZEP_API_KEY not configured' })
  }

  try {
    console.log(`[zep-messages] Haetaan viestit threadille: ${threadId}`)
    
    const response = await axios.get(`${ZEP_API_URL}/sessions/${threadId}/messages`, {
      headers: {
        'Authorization': `Api-Key ${ZEP_API_KEY}`
      }
    })

    console.log(`[zep-messages] Löydettiin ${response.data?.messages?.length || 0} viestiä`)
    
    // DEBUG: Tulosta ensimmäinen viesti kokonaan
    if (response.data?.messages?.length > 0) {
      console.log('[zep-messages] Ensimmäinen viesti:', JSON.stringify(response.data.messages[0], null, 2))
    }

    // Zep palauttaa viestit muodossa:
    // {
    //   messages: [
    //     { role: 'user', content: '...', created_at: '...' },
    //     { role: 'assistant', content: '...', created_at: '...' }
    //   ]
    // }
    
    return res.status(200).json({
      messages: response.data?.messages || [],
      total: response.data?.total || 0
    })
  } catch (error) {
    console.error('[zep-messages] Virhe Zep-haussa:', error.response?.data || error.message)
    
    // Jos sessioita ei löydy (404), palautetaan tyhjä lista
    if (error.response?.status === 404) {
      return res.status(200).json({ messages: [], total: 0 })
    }
    
    const status = error.response?.status || 500
    const isDevelopment = process.env.NODE_ENV === 'development'
    const data = error.response?.data || { message: error.message }
    return res.status(status).json({ 
      error: 'Zep API error', 
      status,
      ...(isDevelopment && { details: data })
    })
  }
}

