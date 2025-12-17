import { withOrganization } from '../../middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { companyId } = req.query

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client

    let query = req.supabase
      .from('content')
      .select('*')
      .order('publish_date', { ascending: true })
    
    if (companyId) {
      // Haetaan organisaation id users-taulusta company_name:n perusteella
      const { data: org, error: orgError } = await req.supabase
        .from('users')
        .select('id')
        .eq('company_name', companyId)
        .single()
      if (orgError || !org) {
        return res.status(404).json({ error: 'Organisaatiota ei löytynyt' })
      }
      query = query.eq('user_id', org.id)
    } else {
      // Jos companyId ei ole annettu, käytetään käyttäjän omaa organisaatiota
      query = query.eq('user_id', req.organization.id)
    }
    
    const { data, error } = await query
    if (error) throw error
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: 'Virhe haussa', details: e.message })
  }
}

export default withOrganization(handler) 