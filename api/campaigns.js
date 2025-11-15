import { withOrganization } from './middleware/with-organization.js'

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client

    const idParam = req.query.user_id
    if (!idParam) {
      return res.status(400).json({ error: 'user_id puuttuu kyselystä' })
    }

    // idParam voi olla joko public.users.id TAI auth.users.id
    // Selvitetään public.users.id ennen kampanjoiden hakua
    let publicUserId = null

    // Selvitä public.users.id joko suoraan idParamista tai org_members kautta
    const { data: directUser } = await req.supabase
      .from('users')
      .select('id')
      .eq('id', idParam)
      .maybeSingle()
    if (directUser?.id) publicUserId = directUser.id

    if (!publicUserId) {
      // Tarkista onko idParam auth_user_id ja hae org_id org_members kautta
      const { data: orgMember } = await req.supabase
        .from('org_members')
        .select('org_id')
        .eq('auth_user_id', idParam)
        .maybeSingle()
      if (orgMember?.org_id) publicUserId = orgMember.org_id
    }

    if (!publicUserId) {
      // Jos ei löydy, käytetään käyttäjän omaa organisaatiota
      publicUserId = req.organization.id
    }

    // Hae kampanjat ja call_types-relaatio
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

    const campaignIds = campaigns.map(c => c.id)

    // Hae call_logs rivit ja laske aggregaatit muistissa
    // Käytä paginationia hakeakseen kaikki rivit (Supabase palauttaa vain 1000 riviä oletuksena)
    
    // Hae ensin rivien kokonaismäärä
    const { count: totalCount, error: countError } = await req.supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', publicUserId)
      .in('new_campaign_id', campaignIds)

    if (countError) {
      console.error('API: Error counting call logs:', countError)
      return res.status(500).json({ error: 'Failed to count call logs', details: countError.message })
    }


    // Jos ei ole rivejä, palauta kampanjat ilman tilastoja
    if (totalCount === 0) {
      return res.status(200).json(campaigns.map(c => ({
        ...c,
        total_calls: 0,
        answered_calls: 0,
        successful_calls: 0
      })))
    }

    // Hae kaikki rivit erissä (1000 riviä per sivu)
    const pageSize = 1000
    const totalPages = Math.ceil(totalCount / pageSize)
    let allLogs = []

    for (let page = 1; page <= totalPages; page++) {
      const startIndex = (page - 1) * pageSize
      const endIndex = Math.min(startIndex + pageSize - 1, totalCount - 1)

      const { data: pageLogs, error: pageError } = await req.supabase
        .from('call_logs')
        .select('new_campaign_id, answered, call_outcome, call_status, created_at, user_id')
        .eq('user_id', publicUserId)
        .in('new_campaign_id', campaignIds)
        .order('created_at', { ascending: true })
        .range(startIndex, endIndex)

      if (pageError) {
        console.error(`API: Error fetching call logs page ${page}:`, pageError)
        return res.status(500).json({ error: `Failed to fetch call logs page ${page}`, details: pageError.message })
      }

      allLogs = allLogs.concat(pageLogs || [])
    }


    // Laske tilastot kaikista logeista Puheluloki-KPI-logiikalla
    const statsByCampaign = {}
    for (const log of allLogs) {
      const cid = log.new_campaign_id
      if (!cid) continue
      
      if (!statsByCampaign[cid]) {
        statsByCampaign[cid] = { 
          total_calls: 0, 
          answered_calls: 0, 
          successful_calls: 0, 
          failed_calls: 0,
          pending_calls: 0,
          in_progress_calls: 0,
          called_calls: 0 
        }
      }
      // Kaikki puhelut
      statsByCampaign[cid].total_calls += 1
      const status = (log.call_status || '').toLowerCase()
      // Vastatut puhelut (vain valmiit)
      if (status === 'done' && log.answered === true) statsByCampaign[cid].answered_calls += 1
      // Onnistuneet puhelut: answered === true JA call_outcome = 'success' tai 'successful'
      const outcome = (log.call_outcome || '').toLowerCase()
      if (status === 'done' && log.answered === true && (outcome === 'success' || outcome === 'successful')) {
        statsByCampaign[cid].successful_calls += 1
      }
      // Epäonnistuneet: valmiit ja ei-vastatut
      if (status === 'done' && log.answered === false) {
        statsByCampaign[cid].failed_calls += 1
      }
      // Pending
      if (status === 'pending') statsByCampaign[cid].pending_calls += 1
      // In progress
      if (status === 'in progress') statsByCampaign[cid].in_progress_calls += 1
      // Soitetut puhelut: vain valmiit (done). Paused EI ole soittettu.
      if (status === 'done') statsByCampaign[cid].called_calls += 1
    }

    const enriched = campaigns.map(c => ({
      ...c,
      total_calls: statsByCampaign[c.id]?.total_calls || 0,
      answered_calls: statsByCampaign[c.id]?.answered_calls || 0,
      successful_calls: statsByCampaign[c.id]?.successful_calls || 0,
      failed_calls: statsByCampaign[c.id]?.failed_calls || 0,
      pending_calls: statsByCampaign[c.id]?.pending_calls || 0,
      in_progress_calls: statsByCampaign[c.id]?.in_progress_calls || 0,
      called_calls: statsByCampaign[c.id]?.called_calls || 0
    }))


    res.status(200).json(enriched)
  } catch (error) {
    console.error('Unhandled error /api/campaigns:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

export default withOrganization(handler)


