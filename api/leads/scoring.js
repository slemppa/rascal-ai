import { withOrganization } from '../_middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client
    const orgId = req.organization.id

    const { leadIds, scoringCriteria } = req.body

    // Jos leadIds on annettu, pisteytetään vain ne, muuten kaikki scraped liidit
    // RLS-politiikat varmistavat että käyttäjä näkee vain oman organisaationsa datan
    let query = req.supabase
      .from('scraped_leads')
      .select('*')
      .eq('user_id', orgId)
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

      if (lead.linkedinUrl) {
        score += 15
        criteria.hasLinkedIn = true
      }

      if (lead.orgName) {
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
      if (lead.email && lead.phone && lead.linkedinUrl) {
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
      req.supabase
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

export default withOrganization(handler)

