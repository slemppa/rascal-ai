import { withOrganization } from '../_middleware/with-organization.js'
import { sendToN8N } from '../_lib/n8n-client.js'

/**
 * Unified Leads API Endpoint
 * 
 * GET /api/leads - Listaa kaikki käyttäjän liidit
 * DELETE /api/leads - Poistaa liidit (body: { leadIds })
 * POST /api/leads?action=score - Pisteyttää liidit (body: { leadIds, scoringCriteria })
 * POST /api/leads?action=enrich - Rikastaa liidit (body: { leadIds })
 */
async function handler(req, res) {
  try {
    const orgId = req.organization.id
    const orgData = req.organization.data

    switch (req.method) {
      case 'GET':
        return await getLeads(req, res, orgId)
      
      case 'DELETE':
      case 'POST':
        // Tarkista action-parametri POST-pyynnöissä
        if (req.method === 'POST') {
          const action = req.query.action || req.body?.action
          
          if (action === 'score') {
            return await scoreLeads(req, res, orgId)
          } else if (action === 'enrich') {
            return await enrichLeads(req, res, orgId, orgData)
          } else if (req.body?.leadIds && !action) {
            // Jos on leadIds mutta ei action-parametria, oletetaan delete
            return await deleteLeads(req, res, orgId)
          }
          // Jos ei action-parametria eikä leadIds, palauta virhe
          return res.status(400).json({ 
            error: 'Invalid request',
            hint: 'POST requires action parameter: ?action=score or ?action=enrich'
          })
        } else {
          // DELETE-pyyntö
          return await deleteLeads(req, res, orgId)
        }
      
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error in leads endpoint:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    })
  }
}

/**
 * GET /api/leads
 * Hakee kaikki käyttäjän liidit Supabasesta
 */
async function getLeads(req, res, orgId) {
  const page = parseInt(req.query.page || '1', 10)
  const perPage = parseInt(req.query.perPage || '100', 10)
  const offset = (page - 1) * perPage

  // Hae liidit Supabasesta käyttäen organisaation ID:tä
  // RLS-politiikat varmistavat että käyttäjä näkee vain oman organisaationsa datan
  const { data: leads, error: leadsError, count } = await req.supabase
    .from('scraped_leads')
    .select('*', { count: 'exact' })
    .eq('user_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (leadsError) {
    console.error('Error fetching leads:', leadsError)
    return res.status(500).json({ 
      error: 'Failed to fetch leads', 
      details: leadsError.message 
    })
  }

  return res.status(200).json({
    success: true,
    leads: leads || [],
    total: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage)
  })
}

/**
 * DELETE /api/leads
 * Poistaa liidit Supabasesta
 */
async function deleteLeads(req, res, orgId) {
  // DELETE-pyynnöissä body voi olla data-parametrissa (axios) tai suoraan body:ssä
  const leadIds = req.body?.leadIds || req.body

  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ error: 'leadIds array is required' })
  }

  // Poista liidit Supabasesta käyttäen organisaation ID:tä
  // RLS-politiikat varmistavat että käyttäjä voi poistaa vain oman organisaationsa datan
  const { error: deleteError } = await req.supabase
    .from('scraped_leads')
    .delete()
    .eq('user_id', orgId)
    .in('id', leadIds)

  if (deleteError) {
    console.error('Error deleting leads:', deleteError)
    return res.status(500).json({ 
      error: 'Failed to delete leads', 
      details: deleteError.message 
    })
  }

  return res.status(200).json({
    success: true,
    message: `Poistettu ${leadIds.length} liidiä`,
    deletedCount: leadIds.length
  })
}

/**
 * POST /api/leads?action=score
 * Pisteyttää liidit
 */
async function scoreLeads(req, res, orgId) {
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
}

/**
 * POST /api/leads?action=enrich
 * Rikastaa valitut liidit N8N:n kautta Clay API:lla
 */
async function enrichLeads(req, res, orgId, orgData) {
  const { leadIds } = req.body

  // Validoi että leadIds on taulukko ja siinä on arvoja
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ error: 'leadIds array with at least one ID is required' })
  }

  // Hae organisaation krediitit users-taulusta
  const { data: userData, error: userError } = await req.supabase
    .from('users')
    .select('enrichment_credits_monthly, enrichment_credits_used')
    .eq('id', orgId)
    .single()

  if (userError) {
    console.error('Error fetching user credits:', userError)
    return res.status(500).json({ 
      error: 'Failed to fetch credits', 
      details: userError.message 
    })
  }

  if (!userData) {
    return res.status(404).json({ error: 'Organization not found' })
  }

  const creditsMonthly = userData.enrichment_credits_monthly ?? 100
  const creditsUsed = userData.enrichment_credits_used ?? 0
  const creditsRemaining = creditsMonthly - creditsUsed
  const creditsNeeded = leadIds.length

  // Tarkista että saldo riittää
  if (creditsRemaining < creditsNeeded) {
    return res.status(400).json({
      error: 'Insufficient credits',
      details: `You need ${creditsNeeded} credits but only have ${creditsRemaining} remaining (${creditsUsed}/${creditsMonthly} used)`,
      credits_remaining: creditsRemaining,
      credits_needed: creditsNeeded,
      credits_monthly: creditsMonthly,
      credits_used: creditsUsed
    })
  }

  // Hae liidit scraped_leads-taulusta
  // RLS-politiikat varmistavat että käyttäjä näkee vain oman organisaationsa datan
  const { data: leads, error: leadsError } = await req.supabase
    .from('scraped_leads')
    .select('*')
    .eq('user_id', orgId)
    .in('id', leadIds)

  if (leadsError) {
    console.error('Error fetching leads:', leadsError)
    return res.status(500).json({ 
      error: 'Failed to fetch leads', 
      details: leadsError.message 
    })
  }

  if (!leads || leads.length === 0) {
    return res.status(404).json({ error: 'No leads found with the provided IDs' })
  }

  // Tarkista että kaikki liidit löytyivät
  if (leads.length !== leadIds.length) {
    const foundIds = leads.map(lead => lead.id)
    const missingIds = leadIds.filter(id => !foundIds.includes(id))
    console.warn('Some leads not found:', missingIds)
    // Jatketaan silti löytyneillä liideillä
  }

  // Muodosta lead_data payload N8N:ään
  const lead_data = leads.map(lead => ({
    id: lead.id,
    fullName: lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
    firstName: lead.firstName || null,
    lastName: lead.lastName || null,
    email: lead.email || null,
    phone: lead.phone || null,
    position: lead.position || null,
    orgName: lead.orgName || null,
    orgCity: lead.orgCity || null,
    orgCountry: lead.orgCountry || null,
    city: lead.city || null,
    country: lead.country || null,
    linkedinUrl: lead.linkedinUrl || null,
    orgSize: lead.orgSize || null,
    orgDescription: lead.orgDescription || null,
    seniority: lead.seniority || null,
    score: lead.score || null,
    status: lead.status || null,
    created_at: lead.created_at || null,
    updated_at: lead.updated_at || null
  }))

  // N8N webhook URL
  const n8nWebhookUrl = process.env.N8N_LEAD_ENRICH_URL

  if (!n8nWebhookUrl) {
    return res.status(500).json({ 
      error: 'Webhook configuration missing',
      hint: 'N8N_LEAD_ENRICH_URL environment variable not set'
    })
  }

  // Valmistele payload N8N:ään
  const payload = {
    action: 'lead_enrichment',
    user_id: String(orgId),
    auth_user_id: String(req.authUser.id),
    leadIds: leadIds,
    lead_data: lead_data,
    credits_needed: creditsNeeded,
    timestamp: new Date().toISOString(),
    source: 'rascal-ai-lead-enrichment'
  }

  // Kutsu N8N-webhookia
  let n8nResult
  try {
    n8nResult = await sendToN8N(n8nWebhookUrl, payload)
  } catch (n8nError) {
    console.error('Error calling N8N webhook:', n8nError)
    // Jos N8N-kutsu epäonnistui, ei vähennetä krediittejä
    return res.status(500).json({
      error: 'Failed to call enrichment service',
      details: n8nError.message,
      hint: 'Credits were not deducted. Please try again.'
    })
  }

  // Päivitä krediitit optimistisesti (vähennä käytetyt krediitit)
  const newCreditsUsed = creditsUsed + creditsNeeded

  const { error: updateError } = await req.supabase
    .from('users')
    .update({
      enrichment_credits_used: newCreditsUsed,
      updated_at: new Date().toISOString()
    })
    .eq('id', orgId)

  if (updateError) {
    console.error('Error updating credits:', updateError)
    return res.status(500).json({
      error: 'Enrichment started but failed to update credits',
      details: updateError.message,
      warning: 'The enrichment was sent to N8N, but credit update failed. Manual adjustment may be needed.'
    })
  }

  // Palauta onnistunut vastaus uusilla krediiteillä
  return res.status(200).json({
    success: true,
    message: `Enrichment started for ${leads.length} leads`,
    credits_remaining: creditsMonthly - newCreditsUsed,
    credits_used: newCreditsUsed,
    credits_monthly: creditsMonthly,
    leads_enriched: leads.length,
    n8n_result: n8nResult
  })
}

export default withOrganization(handler)
