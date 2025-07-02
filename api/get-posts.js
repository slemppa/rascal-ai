import supabase from '../utils/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { companyId } = req.query
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