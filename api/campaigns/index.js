import { withOrganization } from '../middleware/with-organization.js'
import logger from '../lib/logger.js'

import { setCorsHeaders, handlePreflight } from '../lib/cors.js'

async function handler(req, res) {
  setCorsHeaders(res, ['GET', 'OPTIONS'])
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const idParam = req.query.user_id
    if (!idParam) {
      return res.status(400).json({ error: 'user_id puuttuu kyselystä' })
    }

    // Selvitetään public.users.id
    let publicUserId = null
    const { data: directUser } = await req.supabase
      .from('users')
      .select('id')
      .eq('id', idParam)
      .maybeSingle()
    if (directUser?.id) publicUserId = directUser.id

    if (!publicUserId) {
      const { data: orgMember } = await req.supabase
        .from('org_members')
        .select('org_id')
        .eq('auth_user_id', idParam)
        .maybeSingle()
      if (orgMember?.org_id) publicUserId = orgMember.org_id
    }

    if (!publicUserId) {
      publicUserId = req.organization.id
    }

    // Hae kampanjat
    const { data: campaigns, error: campaignsError } = await req.supabase
      .from('campaigns')
      .select('*, call_types(name)')
      .eq('user_id', publicUserId)
      .order('created_at', { ascending: false })

    if (campaignsError) {
      return res.status(500).json({ error: 'Failed to fetch campaigns', details: campaignsError.message })
    }

    if (!campaigns || campaigns.length === 0) {
      return res.status(200).json([])
    }

    // Laske tilastot jokaiselle kampanjalle erikseen käyttäen samaa logiikkaa kuin Puhelulokit-sivu
    const enriched = await Promise.all(campaigns.map(async (campaign) => {
      const campaignId = campaign.id
      const orgId = campaign.user_id || publicUserId

      // Soittoyritykset: summa attempt_count-arvot (NULL = 1), ei pending-statusta
      let attemptCountsBaseQuery = req.supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId)
        .eq('new_campaign_id', campaignId)
        .neq('call_status', 'pending')

      const { count: attemptCountsTotal, error: countError } = await attemptCountsBaseQuery

      let attempt_count = 0
      if (!countError && attemptCountsTotal && attemptCountsTotal > 0) {
        const pageSize = 1000
        const totalPages = Math.ceil(attemptCountsTotal / pageSize)
        let allAttemptCounts = []

        for (let page = 1; page <= totalPages; page++) {
          const startIndex = (page - 1) * pageSize
          const endIndex = Math.min(startIndex + pageSize - 1, attemptCountsTotal - 1)

          const { data: pageAttemptCounts, error: pageError } = await req.supabase
            .from('call_logs')
            .select('attempt_count')
            .eq('user_id', orgId)
            .eq('new_campaign_id', campaignId)
            .neq('call_status', 'pending')
            .range(startIndex, endIndex)

          if (pageError) break
          allAttemptCounts = allAttemptCounts.concat(pageAttemptCounts || [])
        }

        attempt_count = allAttemptCounts.reduce((sum, log) => {
          const attempts = log.attempt_count != null ? Number(log.attempt_count) : 1
          return sum + attempts
        }, 0)
      }

      // Vastatut (done + answered)
      const { count: answered_calls } = await req.supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId)
        .eq('new_campaign_id', campaignId)
        .eq('call_status', 'done')
        .eq('answered', true)

      // Onnistuneet
      const { count: successful_calls } = await req.supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId)
        .eq('new_campaign_id', campaignId)
        .eq('call_status', 'done')
        .eq('answered', true)
        .or('call_outcome.eq.success,call_outcome.eq.successful')

      // Epäonnistuneet: vastatut puhelut (answered=true) joilla call_outcome ei ole 'success' tai 'successful'
      // HUOM: Käytetään paginationia, koska Supabase palauttaa vain 1000 riviä oletuksena
      let failedBaseQuery = req.supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId)
        .eq('new_campaign_id', campaignId)
        .eq('call_status', 'done')
        .eq('answered', true)

      const { count: failedTotal } = await failedBaseQuery

      let failed_calls = 0
      if (failedTotal && failedTotal > 0) {
        const pageSize = 1000
        const totalPages = Math.ceil(failedTotal / pageSize)
        let allFailedLogs = []

        for (let page = 1; page <= totalPages; page++) {
          const startIndex = (page - 1) * pageSize
          const endIndex = Math.min(startIndex + pageSize - 1, failedTotal - 1)

          const { data: pageFailedLogs } = await req.supabase
            .from('call_logs')
            .select('call_outcome')
            .eq('user_id', orgId)
            .eq('new_campaign_id', campaignId)
            .eq('call_status', 'done')
            .eq('answered', true)
            .range(startIndex, endIndex)

          if (pageFailedLogs) {
            allFailedLogs = allFailedLogs.concat(pageFailedLogs)
          }
        }

        failed_calls = allFailedLogs.filter(log => {
          const outcome = (log.call_outcome || '').toLowerCase()
          return outcome !== 'success' && outcome !== 'successful'
        }).length
      }

      // Aikataulutettu
      const { count: pending_calls } = await req.supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId)
        .eq('new_campaign_id', campaignId)
        .eq('call_status', 'pending')

      // Jonossa: in progress + calling (sama logiikka kuin Puhelulokit-sivulla)
      const { count: in_progress_calls } = await req.supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId)
        .eq('new_campaign_id', campaignId)
        .in('call_status', ['in progress', 'calling'])

      // Yhteensä: kaikki puhelut
      const { count: total_calls } = await req.supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId)
        .eq('new_campaign_id', campaignId)

      // Soitetut: vain valmiit (done)
      const { count: called_calls } = await req.supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId)
        .eq('new_campaign_id', campaignId)
        .eq('call_status', 'done')

      return {
        ...campaign,
        attempt_count: attempt_count || 0,
        answered_calls: answered_calls || 0,
        successful_calls: successful_calls || 0,
        failed_calls: failed_calls || 0,
        pending_calls: pending_calls || 0,
        in_progress_calls: in_progress_calls || 0,
        total_calls: total_calls || 0,
        called_calls: called_calls || 0
      }
    }))

    res.status(200).json(enriched)
  } catch (error) {
    logger.error('Unhandled error /api/campaigns:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

export default withOrganization(handler)
