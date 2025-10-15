export default async function handler(req, res) {
  // Vain GET-pyynnöt
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Hae Agent ID ympäristömuuttujista
    const agentId = process.env.ELEVENLABS_AGENT_ID

    if (!agentId) {
      console.error('ELEVENLABS_AGENT_ID not found in environment variables')
      return res.status(500).json({ error: 'Agent ID not configured' })
    }

    // Palauta konfiguraatio
    return res.status(200).json({
      agentId,
      // Voit lisätä tähän muita ElevenLabs-konfiguraatioita tarvittaessa
      // esim. serverLocation: 'us' tai 'eu-residency'
    })
  } catch (error) {
    console.error('Error fetching ElevenLabs config:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

