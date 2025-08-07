// Mika Special mass-call API endpoint joka lisää dataa suoraan Supabaseen
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { contacts, callType, script, voice_id, user_id } = req.body

    console.log('🔍 Mika mass-call direct endpoint sai dataa:', { 
      contactsCount: contacts?.length, 
      callType, 
      script, 
      voice_id,
      user_id
    })

    // Validointi
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Kontaktidata on pakollinen' })
    }

    if (!callType) {
      return res.status(400).json({ error: 'Puhelun tyyppi on pakollinen' })
    }

    if (!script || !script.trim()) {
      return res.status(400).json({ error: 'Skripti on pakollinen' })
    }

    if (!voice_id) {
      return res.status(400).json({ error: 'Ääni on pakollinen' })
    }

    if (!user_id) {
      return res.status(400).json({ error: 'user_id on pakollinen' })
    }

    // Käytä MCP:n Supabase-toimintoja suoraan
    // Tässä käytämme MCP:n execute_sql-toimintoa tietojen lisäämiseen
    
    // Hae call_type_id ensin
    const callTypeId = 'ef0ae790-b6c0-4264-a798-a913549ef8ea' // AI-assarin kartoitus
    
    // Valmistellaan INSERT-kyselyt
    const insertQueries = []
    let startedCalls = 0
    let failedCalls = 0
    
    for (const contact of contacts) {
      try {
        // Etsi puhelinnumero ja nimi
        let phoneNumber = null
        let name = null
        
        // Etsi puhelinnumero (tarkista eri kentät)
        if (contact.phone) {
          phoneNumber = contact.phone
        } else if (contact.phones && contact.phones[0]) {
          phoneNumber = contact.phones[0]
        } else if (contact.phone_number) {
          phoneNumber = contact.phone_number
        } else if (contact.tel) {
          phoneNumber = contact.tel
        }
        
        // Etsi nimi (tarkista eri kentät)
        if (contact.name) {
          name = contact.name
        } else if (contact.customer_name) {
          name = contact.customer_name
        } else if (contact.first_name && contact.last_name) {
          name = `${contact.first_name} ${contact.last_name}`
        } else if (contact.etunimi && contact.sukunimi) {
          name = `${contact.etunimi} ${contact.sukunimi}`
        }
        
        // Jos nimeä ei löytynyt, käytä ensimmäistä ei-tyhjää kenttää
        if (!name) {
          const possibleNameFields = ['title', 'company', 'organization', 'email']
          for (const field of possibleNameFields) {
            if (contact[field]) {
              name = contact[field]
              break
            }
          }
        }
        
        // Jos nimeä ei vieläkään löytynyt, käytä "Asiakas X"
        if (!name) {
          name = `Asiakas ${startedCalls + 1}`
        }
        
        if (phoneNumber) {
          // Lisää INSERT-kysely listaan
          insertQueries.push({
            query: `
              INSERT INTO call_logs (
                id, user_id, customer_name, phone_number, 
                call_type, call_type_id, call_date, call_status, 
                voice_id, created_at, summary, campaign_id
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), 'pending', $6, NOW(), $7, $8
              )
            `,
            params: [
              user_id,
              name,
              phoneNumber,
              callType,
              callTypeId,
              voice_id,
              script.trim().substring(0, 100) + '...',
              `mika-mass-call-${Date.now()}`
            ]
          })
          
          startedCalls++
          console.log(`✅ Kontakti valmisteltu: ${name} (${phoneNumber})`)
        } else {
          failedCalls++
          console.log(`❌ Ei puhelinnumeroa: ${name}`)
        }
      } catch (error) {
        failedCalls++
        console.error(`❌ Virhe kontaktin käsittelyssä:`, error)
      }
    }
    
    if (insertQueries.length === 0) {
      return res.status(400).json({ error: 'Puhelinnumeroita ei löytynyt kontaktidatasta' })
    }
    
    // Suorita kyselyt MCP:n Supabase-toimintojen avulla
    console.log('🔍 Suoritetaan MCP-kyselyt...')
    
    // Tässä käytettäisiin MCP:n execute_sql-toimintoa
    // Koska emme voi suoraan kutsua sitä tässä kontekstissa,
    // palautetaan kyselyt frontendille joka voi käyttää MCP-toimintoja
    
    return res.status(200).json({
      success: true,
      message: 'Valmisteltu MCP-kyselyt - käytä MCP:n execute_sql-toimintoa',
      queries: insertQueries,
      totalContacts: contacts.length,
      startedCalls: startedCalls,
      failedCalls: failedCalls,
      callTypeId: callTypeId,
      timestamp: new Date().toISOString(),
      instructions: 'Käytä MCP:n execute_sql-toimintoa suorittaaksesi nämä kyselyt'
    })

  } catch (error) {
    console.error('Mika mass-call direct error:', error)
    return res.status(500).json({ error: error.message })
  }
} 