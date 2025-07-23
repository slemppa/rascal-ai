import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { companyId } = req.query

  // Ota access token headerista
  const access_token = req.headers['authorization']?.replace('Bearer ', '')
  if (!access_token) {
    return res.status(401).json({ error: 'Unauthorized: access token puuttuu' })
  }

  // Luo Supabase-yhteys käyttäjän tokenilla
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${access_token}` } } }
  )

  try {
    let query = supabase
      .from('content')
      .select('*')
      .order('publish_date', { ascending: true })
    if (companyId) {
      // Haetaan käyttäjän id users-taulusta
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('company_name', companyId)
        .single()
      if (userError || !user) {
        return res.status(404).json({ error: 'Käyttäjää ei löytynyt' })
      }
      query = query.eq('user_id', user.id)
    }
    const { data, error } = await query
    if (error) throw error
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: 'Virhe haussa', details: e.message })
  }
} 