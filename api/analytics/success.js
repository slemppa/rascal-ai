import { withOrganization } from '../middleware/with-organization.js'

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client

    const days = Math.max(1, Math.min(parseInt(req.query.days || '30', 10) || 30, 90))
    const now = new Date()
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const orgId = req.organization.id

    // Hae rivien kokonaismäärä ja sivuta (PostgREST default max 1000 per haku)
    const { count: totalCount, error: countErr } = await req.supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', orgId)
      .gte('created_at', start.toISOString())
      .lte('created_at', now.toISOString())

    if (countErr) return res.status(500).json({ error: 'Failed to count logs', details: countErr.message })

    let logs = []
    if (totalCount && totalCount > 0) {
      const pageSize = 1000
      const totalPages = Math.ceil(totalCount / pageSize)
      for (let page = 1; page <= totalPages; page++) {
        const startIndex = (page - 1) * pageSize
        const endIndex = Math.min(startIndex + pageSize - 1, totalCount - 1)
        const { data: pageLogs, error: pageErr } = await req.supabase
          .from('call_logs')
          .select('created_at, call_date, answered, call_outcome')
          .eq('user_id', orgId)
          .gte('created_at', start.toISOString())
          .lte('created_at', now.toISOString())
          .order('created_at', { ascending: true })
          .range(startIndex, endIndex)
        if (pageErr) return res.status(500).json({ error: `Failed to fetch logs page ${page}`, details: pageErr.message })
        logs = logs.concat(pageLogs || [])
      }
    }

    const total = (logs || []).length
    const answered = (logs || []).filter(l => l.answered === true).length
    // Onnistunut puhelu = answered === true AND call_outcome in ('success', 'successful')
    const successfulCount = (logs || []).filter(l => {
      const outcome = (l.call_outcome || '').toLowerCase()
      return l.answered === true && (outcome === 'success' || outcome === 'successful')
    }).length
    const answerRate = total > 0 ? Math.round((successfulCount / total) * 100) : 0
    const successRate = answerRate

    // Aikasarja per päivä
    const perDay = {}
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      perDay[key] = { date: key, total: 0, answered: 0, success: 0 }
    }
    for (const l of logs || []) {
      const key = new Date(l.call_date || l.created_at).toISOString().slice(0, 10)
      if (!perDay[key]) perDay[key] = { date: key, total: 0, answered: 0, success: 0 }
      perDay[key].total += 1
      if (l.answered === true) {
        perDay[key].answered += 1
        const outcome = (l.call_outcome || '').toLowerCase()
        if (outcome === 'success' || outcome === 'successful') {
          perDay[key].success += 1
        }
      }
    }

    return res.status(200).json({
      total,
      answered,
      success: successfulCount,
      answerRate,
      successRate,
      perDay: Object.values(perDay)
    })
  } catch (e) {
    console.error('dashboard-success error:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)


