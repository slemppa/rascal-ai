import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL 
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

    // Muotoile data Supabase-muotoon
    const leadsToInsert = leads.map(lead => {
      // Map Pipeline Labs / Apify data format to our schema
      return {
        user_id,
        first_name: lead.firstName || lead.first_name || null,
        last_name: lead.lastName || lead.last_name || null,
        full_name: lead.fullName || lead.full_name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || null,
        email: lead.email || null,
        phone: lead.phone || null,
        position: lead.position || lead.jobTitle || null,
        city: lead.city || null,
        state: lead.state || null,
        country: lead.country || null,
        linkedin_url: lead.linkedIn || lead.linkedin_url || lead.linkedinUrl || null,
        seniority: lead.seniority || null,
        functions: Array.isArray(lead.functions) ? lead.functions : (lead.functions ? [lead.functions] : null),
        email_status: lead.emailStatus || lead.email_status || null,
        org_name: lead.orgName || lead.org_name || lead.organizationName || lead.company || null,
        org_website: lead.orgWebsite || lead.org_website || lead.organizationWebsite || null,
        org_linkedin: lead.orgLinkedIn || lead.org_linkedin || lead.organizationLinkedIn || null,
        org_founded_year: lead.foundedYear || lead.founded_year || lead.orgFoundedYear || null,
        org_industry: lead.industry || lead.orgIndustry || lead.organizationIndustry || null,
        org_size: lead.size || lead.orgSize || lead.organizationSize || null,
        org_description: lead.description || lead.orgDescription || lead.organizationDescription || null,
        org_specialties: Array.isArray(lead.specialties) ? lead.specialties : (lead.specialties ? [lead.specialties] : null),
        org_city: lead.orgCity || lead.organizationCity || null,
        org_state: lead.orgState || lead.organizationState || null,
        org_country: lead.orgCountry || lead.organizationCountry || null,
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

