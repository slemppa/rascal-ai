import { withOrganization } from '../../_middleware/with-organization.js'
import logger from '../../_lib/logger.js'
import { setCorsHeaders, handlePreflight } from '../../_lib/cors.js'

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
    const id = req.query.id
    if (!id) return res.status(400).json({ error: 'id puuttuu' })

    const { data: campaign, error: campaignError } = await req.supabase
      .from('campaigns')
      .select('*, call_types(name)')
      .eq('id', id)
      .single()

    if (campaignError) return res.status(500).json({ error: 'Failed to fetch campaign', details: campaignError.message })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })

    // Käytetään kampanjan user_id:tä (joka on organisaation ID)
    const orgId = campaign.user_id || req.organization.id

    // Sama logiikka kuin Puhelulokit-sivulla (CallPanel.jsx fetchStats)
    // Soittoyritykset: summa attempt_count-arvot (NULL = 1), ei pending-statusta
    let attemptCountsBaseQuery = req.supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', orgId)
      .eq('new_campaign_id', id)
      .neq('call_status', 'pending')

    const { count: attemptCountsTotal, error: countError } = await attemptCountsBaseQuery

    let attempt_count = 0
    if (countError) {
      logger.error('Soittoyritykset: Rivien määrän haku epäonnistui:', countError)
    } else if (attemptCountsTotal && attemptCountsTotal > 0) {
      // Hae kaikki rivit erissä (1000 riviä per sivu)
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
          .eq('new_campaign_id', id)
          .neq('call_status', 'pending')
          .range(startIndex, endIndex)

        if (pageError) {
          console.error(`Soittoyritykset: Sivun ${page} haku epäonnistui:`, pageError)
          break
        }

        allAttemptCounts = allAttemptCounts.concat(pageAttemptCounts || [])
      }

      // Laske summa
      attempt_count = allAttemptCounts.reduce((sum, log) => {
        // Jos attempt_count on NULL tai undefined, lasketaan 1
        const attempts = log.attempt_count != null ? Number(log.attempt_count) : 1
        return sum + attempts
      }, 0)
    }

    // Vastatut (done + answered)
    const { count: answered_calls, error: answeredError } = await req.supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', orgId)
      .eq('new_campaign_id', id)
      .eq('call_status', 'done')
      .eq('answered', true)

    // Onnistuneet: status === 'done' && answered === true && (outcome === 'success' || outcome === 'successful')
    const { count: successful_calls, error: successfulError } = await req.supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', orgId)
      .eq('new_campaign_id', id)
      .eq('call_status', 'done')
      .eq('answered', true)
      .or('call_outcome.eq.success,call_outcome.eq.successful')

    // Epäonnistuneet: vastatut puhelut (answered=true) joilla call_outcome ei ole 'success' tai 'successful'
    // HUOM: Käytetään paginationia, koska Supabase palauttaa vain 1000 riviä oletuksena
    let failedBaseQuery = req.supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', orgId)
      .eq('new_campaign_id', id)
      .eq('call_status', 'done')
      .eq('answered', true)

    const { count: failedTotal, error: failedCountError } = await failedBaseQuery

    let failed_calls = 0
    let failedError = failedCountError
    if (!failedCountError && failedTotal && failedTotal > 0) {
      const pageSize = 1000
      const totalPages = Math.ceil(failedTotal / pageSize)
      let allFailedLogs = []

      for (let page = 1; page <= totalPages; page++) {
        const startIndex = (page - 1) * pageSize
        const endIndex = Math.min(startIndex + pageSize - 1, failedTotal - 1)

        const { data: pageFailedLogs, error: pageError } = await req.supabase
          .from('call_logs')
          .select('call_outcome')
          .eq('user_id', orgId)
          .eq('new_campaign_id', id)
          .eq('call_status', 'done')
          .eq('answered', true)
          .range(startIndex, endIndex)

        if (pageError) {
          failedError = pageError
          break
        }
        allFailedLogs = allFailedLogs.concat(pageFailedLogs || [])
      }

      failed_calls = allFailedLogs.filter(log => {
        const outcome = (log.call_outcome || '').toLowerCase()
        return outcome !== 'success' && outcome !== 'successful'
      }).length
    }

    // Aikataulutettu
    const { count: pending_calls, error: pendingError } = await req.supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', orgId)
      .eq('new_campaign_id', id)
      .eq('call_status', 'pending')

    // Jonossa: in progress + calling (sama logiikka kuin Puhelulokit-sivulla)
    const { count: in_progress_calls, error: inProgressError } = await req.supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', orgId)
      .eq('new_campaign_id', id)
      .in('call_status', ['in progress', 'calling'])

    // Yhteensä: kaikki puhelut
    const { count: total_calls, error: totalLogsError } = await req.supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', orgId)
      .eq('new_campaign_id', id)

    // Soitetut: vain valmiit (done)
    const { count: called_calls, error: calledCallsError } = await req.supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', orgId)
      .eq('new_campaign_id', id)
      .eq('call_status', 'done')

    if (answeredError || successfulError || failedError || pendingError || inProgressError || totalLogsError || calledCallsError) {
      console.error('Tilastojen haku epäonnistui:', { answeredError, successfulError, failedError, pendingError, inProgressError, totalLogsError, calledCallsError })
    }

    // Lisää tilastot kampanjaobjektiin
    const enriched = {
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

    res.status(200).json(enriched)
  } catch (error) {
    logger.error('Unhandled error /api/campaign-by-id:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

export default withOrganization(handler)
