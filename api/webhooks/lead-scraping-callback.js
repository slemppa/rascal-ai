import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validoi API-avain
    const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key']
    const expectedKey = process.env.N8N_SECRET_KEY

    if (!expectedKey || apiKey !== expectedKey) {
      console.error('Invalid API key in lead-scraping-callback')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Vastaanota data
    const { user_id, leads, search_query, source } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'leads array is required and must not be empty' })
    }

    console.log(`Processing ${leads.length} leads for user ${user_id}`)

    // Funktio parsimaan string-muotoiset arrayt (esim. "['value1', 'value2']" -> ['value1', 'value2'])
    const parseArrayField = (value) => {
      if (!value) return null
      if (Array.isArray(value)) return value
      if (typeof value === 'string') {
        const cleaned = value.trim()
        
        // Jos on tyhjä string, palautetaan null
        if (cleaned === '') return null
        
        // Jos alkaa [ ja päättyy ], yritetään parsia
        if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
          try {
            // Yritetään ensin JSON.parse (jos on tuplalainausmerkit)
            const parsed = JSON.parse(cleaned)
            return Array.isArray(parsed) ? parsed : [parsed]
          } catch (e) {
            // Jos JSON.parse epäonnistuu, yritetään parsia yksinkertaisilla lainausmerkeillä
            try {
              // Poistetaan [ ja ] ja jaetaan pilkulla
              const inner = cleaned.slice(1, -1).trim()
              if (inner === '') return []
              
              // Jaetaan pilkulla ja poistetaan lainausmerkit
              const items = inner.split(',').map(item => {
                const trimmed = item.trim()
                // Poistetaan ympäröivät lainausmerkit (sekä ' että ")
                return trimmed.replace(/^['"]|['"]$/g, '')
              })
              
              return items.filter(item => item !== '')
            } catch (e2) {
              // Jos kaikki epäonnistuu, palautetaan yksittäinen arvo arrayksi
              return [cleaned]
            }
          }
        }
        
        // Jos ei ole array-muodossa, palautetaan yksittäinen arvo arrayksi
        return [cleaned]
      }
      return [value]
    }

    // Funktio parsimaan integer-kentät
    const parseInteger = (value) => {
      if (!value) return null
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10)
        return isNaN(parsed) ? null : parsed
      }
      return null
    }

    // Muotoile data Supabase-muotoon (camelCase-kentät)
    const leadsToInsert = leads.map(lead => {
      return {
        user_id,
        firstName: lead.firstName || null,
        lastName: lead.lastName || null,
        fullName: lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || null,
        email: lead.email || null,
        phone: lead.phone || null,
        position: lead.position || null,
        city: lead.city || null,
        state: lead.state || null,
        country: lead.country || null,
        linkedinUrl: lead.linkedinUrl || null,
        seniority: lead.seniority || null,
        functional: parseArrayField(lead.functional),
        email_status: lead.emailStatus || null,
        orgName: lead.orgName || null,
        orgWebsite: lead.orgWebsite || null,
        orgLinkedinUrl: parseArrayField(lead.orgLinkedinUrl),
        orgFoundedYear: parseInteger(lead.orgFoundedYear),
        orgIndustry: parseArrayField(lead.orgIndustry),
        orgSize: lead.orgSize || null,
        orgDescription: lead.orgDescription || null,
        org_specialties: Array.isArray(lead.org_specialties) ? lead.org_specialties : (lead.org_specialties ? [lead.org_specialties] : null),
        orgCity: lead.orgCity || null,
        orgState: lead.orgState || null,
        orgCountry: lead.orgCountry || null,
        ppeIndex: parseInteger(lead.ppeIndex),
        ppeBatchIndex: parseInteger(lead.ppeBatchIndex),
        search_query: search_query || null,
        source: source || 'apify_pipeline_labs',
        status: 'scraped',
        raw_data: lead, // Store original data
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    // Tallenna Supabaseen (batch insert)
    const { data, error } = await supabase
      .from('scraped_leads')
      .insert(leadsToInsert)
      .select('id')

    if (error) {
      console.error('Error inserting leads:', error)
      return res.status(500).json({ 
        error: 'Failed to save leads', 
        details: error.message 
      })
    }

    console.log(`Successfully saved ${data?.length || 0} leads`)

    return res.status(200).json({
      success: true,
      message: `Successfully saved ${data?.length || 0} leads`,
      count: data?.length || 0,
      leadIds: data?.map(l => l.id) || []
    })

  } catch (error) {
    console.error('Error in lead-scraping-callback endpoint:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    })
  }
}

