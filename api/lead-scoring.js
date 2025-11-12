import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY 
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validoi käyttäjä
    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Hae käyttäjän tiedot
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser(token)
    if (authError || !authUser) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Hae public.users.id
    const { data: userData, error: userError } = await userClient
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (userError || !userData) {
      return res.status(403).json({ error: 'User profile not found' })
    }

    const publicUserId = userData.id

    const { leadIds, scoringCriteria } = req.body

    // Jos leadIds on annettu, pisteytetään vain ne, muuten kaikki scraped liidit
    let query = userClient
      .from('scraped_leads')
      .select('*')
      .eq('user_id', publicUserId)
      .eq('status', 'scraped')

    if (leadIds && Array.isArray(leadIds) && leadIds.length > 0) {
      query = query.in('id', leadIds)
    }

    const { data: leads, error: leadsError } = await query

    if (leadsError) {
      return res.status(500).json({ error: 'Failed to fetch leads', details: leadsError.message })
    }

    if (!leads || leads.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No leads to score',
        count: 0
      })
    }

    // Pisteytyslogiikka
    const scoredLeads = leads.map(lead => {
      let score = 0
      const criteria = {
        hasEmail: false,
        hasPhone: false,
        hasLinkedIn: false,
        hasCompany: false,
        hasPosition: false,
        hasLocation: false
      }

      // Peruspisteet
      if (lead.email) {
        score += 20
        criteria.hasEmail = true
      }

      if (lead.phone) {
        score += 20
        criteria.hasPhone = true
      }

      if (lead.linkedin_url) {
        score += 15
        criteria.hasLinkedIn = true
      }

      if (lead.org_name) {
        score += 15
        criteria.hasCompany = true
      }

      if (lead.position) {
        score += 10
        criteria.hasPosition = true
      }

      if (lead.city || lead.country) {
        score += 10
        criteria.hasLocation = true
      }

      // Bonus-pisteet jos on kaikki yhteystiedot
      if (lead.email && lead.phone && lead.linkedin_url) {
        score += 10
      }

      // Rajoita 0-100
      score = Math.min(100, Math.max(0, score))

      return {
        id: lead.id,
        score,
        score_criteria: criteria,
        status: 'scored'
      }
    })

    // Päivitä pisteet Supabaseen
    const updates = scoredLeads.map(lead => 
      userClient
        .from('scraped_leads')
        .update({
          score: lead.score,
          score_criteria: lead.score_criteria,
          status: lead.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)
    )

    const results = await Promise.allSettled(updates)

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    if (failed > 0) {
      console.error('Some lead scoring updates failed:', results.filter(r => r.status === 'rejected'))
    }

    return res.status(200).json({
      success: true,
      message: `Scored ${successful} leads successfully`,
      count: successful,
      failed,
      leads: scoredLeads
    })

  } catch (error) {
    console.error('Error in lead-scoring endpoint:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    })
  }
}

