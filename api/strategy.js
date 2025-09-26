import { createClient } from '@supabase/supabase-js'

const N8N_STRATEGY_URL = process.env.N8N_GET_STRATEGY_URL
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const companyId = req.query.companyId
  const userId = req.query.userId

  if (!companyId) {
    return res.status(400).json({ error: 'company_id puuttuu' })
  }

  if (!userId) {
    return res.status(400).json({ error: 'user_id puuttuu' })
  }

  // JWT token validointi
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' })
  }

  // Luo Supabase client käyttäjän tokenilla
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // Tarkista että käyttäjä on autentikoitu
  const { data: user, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  try {
    console.log('Strategy API called with:', { companyId, userId })
    
    // Haetaan käyttäjän tiedot users taulusta
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_summary, icp_summary, kpi, tov')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
      return res.status(500).json({ error: 'Käyttäjätietojen haku epäonnistui' })
    }

    // Haetaan sisältöstrategiat content_strategy taulusta
    console.log('Fetching strategies for user_id:', userId)
    const { data: strategiesData, error: strategiesError } = await supabase
      .from('content_strategy')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError)
      return res.status(500).json({ error: 'Strategioiden haku epäonnistui' })
    }

    // Muunna strategiat oikeaan muotoon
    const strategies = strategiesData?.map(item => ({
      id: item.id,
      name: `${item.month} strategia`,
      description: item.strategy,
      month: item.month,
      strategy: item.strategy,
      company_id: companyId,
      user_id: userId,
      created_at: item.created_at
    })) || []

    // Muunna ICP summary arrayksi rivinvaihdoista
    const icpSummary = userData.icp_summary ? 
      userData.icp_summary.split('\n').filter(line => line.trim() !== '') 
      : []

    // Muunna KPI arrayksi rivinvaihdoista
    const kpi = userData.kpi ? 
      userData.kpi.split('\n').filter(line => line.trim() !== '') 
      : []

    const responseData = {
      strategies: strategies,
      icpSummary: icpSummary,
      kpi: kpi,
      companySummary: userData.company_summary || '',
      tov: userData.tov || ''
    }

    return res.status(200).json(responseData)

  } catch (error) {
    console.error('Error in strategy handler:', error)
    return res.status(500).json({ error: 'Sisäinen palvelinvirhe' })
  }
} 