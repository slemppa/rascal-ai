// Mika Special mass-call API endpoint käyttäen MCP:n Supabase-toimintoja
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { contacts, callType, script, voice_id, user_id } = req.body

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Contacts array is required' })
    }

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Hae call_type_id
    const callTypeQuery = `
      SELECT id FROM call_types 
      WHERE user_id = $1 AND name = $2
    `
    
    // Tässä käytettäisiin MCP:n execute_sql-toimintoa
    // Koska emme voi suoraan kutsua MCP-toimintoja tässä kontekstissa,
    // palautetaan tietoja frontendille joka voi käyttää MCP-toimintoja
    
    const callTypeId = 'ef0ae790-b6c0-4264-a798-a913549ef8ea' // AI-assarin kartoitus
    
    // Valmistellaan INSERT-kyselyt
    const insertQueries = contacts.map(contact => ({
      query: `
        INSERT INTO call_logs (
          id, user_id, customer_name, phone_number, 
          call_type, call_type_id, call_date, call_status, 
          voice_id, created_at, summary
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), 'pending', $6, NOW(), $7
        )
      `,
      params: [
        user_id,
        contact.name || '',
        contact.phone || '',
        callType,
        callTypeId,
        voice_id || 'voice_1',
        script || 'Hei! Soitan sinulle...'
      ]
    }))

    // Palautetaan kyselyt frontendille MCP-käyttöä varten
    return res.status(200).json({
      success: true,
      message: 'Valmisteltu MCP-kyselyt',
      queries: insertQueries,
      totalContacts: contacts.length,
      callTypeId: callTypeId
    })

  } catch (error) {
    console.error('Mika mass-call MCP error:', error)
    return res.status(500).json({ error: error.message })
  }
} 