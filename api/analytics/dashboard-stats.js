import { withOrganization } from '../_middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../_lib/cors.js'

/**
 * GET /api/analytics/dashboard-stats
 * Palauttaa dashboard-tilastot optimoidusti tietokannasta
 * Suorittaa count ja sum -kyselyt suoraan tietokannassa Supabasella
 */
async function handler(req, res) {
  setCorsHeaders(res, ['GET', 'OPTIONS'])
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (handlePreflight(req, res)) {
    return
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client

    const orgId = req.organization.id
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

    // Hae kaikki tilastot rinnakkain käyttäen count ja sum -kyselyitä
    const [
      { count: upcomingCount, error: upcomingError },
      { count: monthlyCount, error: monthlyError },
      { data: callData, error: callError },
      { data: messageData, error: messageError },
      { count: aiUsage, error: aiError }
    ] = await Promise.all([
      // Tulevat postaukset (status = 'Scheduled')
      req.supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Scheduled')
        .eq('user_id', orgId),
      // Kuukauden aikana julkaistut postaukset (Published tai Scheduled jonka aika on mennyt)
      req.supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId)
        .in('status', ['Published', 'Scheduled'])
        .gte('scheduled_at', firstDay.toISOString())
        .lte('scheduled_at', now.toISOString()),
      // Puheluiden hinnat (kuukauden)
      req.supabase
        .from('call_logs')
        .select('price')
        .eq('user_id', orgId)
        .gte('call_date', firstDay.toISOString()),
      // Viestien hinnat (kuukauden)
      req.supabase
        .from('message_logs')
        .select('price')
        .eq('user_id', orgId)
        .gte('created_at', firstDay.toISOString())
        .not('price', 'is', null),
      // AI-käyttö (kuukauden)
      req.supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId)
        .eq('is_generated', true)
        .gte('created_at', firstDay.toISOString())
    ])

    // Käsittele virheet
    if (upcomingError) console.error('Error fetching upcoming posts:', upcomingError)
    if (monthlyError) console.error('Error fetching monthly posts:', monthlyError)
    if (callError) console.error('Error fetching call data:', callError)
    if (messageError) console.error('Error fetching message data:', messageError)
    if (aiError) console.error('Error fetching AI usage:', aiError)

    // Laske hinnat tietokannasta haetuista datasta
    const totalCallPrice = (callData || []).reduce((acc, row) => acc + (parseFloat(row.price) || 0), 0)
    const totalMessagePrice = (messageData || []).reduce((acc, row) => acc + (parseFloat(row.price) || 0), 0)

    // Hae käyttäjän features users taulusta
    const { data: userData, error: userDataError } = await req.supabase
      .from('users')
      .select('features')
      .eq('id', orgId)
      .single()

    if (userDataError) {
      console.error('Error fetching user features:', userDataError)
    }

    return res.status(200).json({
      upcomingCount: upcomingCount || 0,
      monthlyCount: monthlyCount || 0,
      totalCallPrice: totalCallPrice || 0,
      totalMessagePrice: totalMessagePrice || 0,
      features: userData?.features || req.organization.data?.features || [],
      aiUsage: aiUsage || 0
    })
  } catch (e) {
    console.error('dashboard-stats error:', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)
