import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { auth_user_id } = req.body

    if (!auth_user_id) {
      return res.status(400).json({ error: 'auth_user_id is required' })
    }

    // Hae käyttäjän user_id users taulusta
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', auth_user_id)
      .single()

    if (userError || !userData?.id) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Laske kuinka monta content-itemiä käyttäjällä on tässä kuussa
    const { data: contentData, error: contentError } = await supabase
      .from('content')
      .select('id')
      .eq('user_id', userData.id)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

    if (contentError) {
      console.error('Error counting content:', contentError)
      return res.status(500).json({ error: 'Failed to count content' })
    }

    const currentCount = contentData?.length || 0
    const monthlyLimit = 30
    const remaining = Math.max(0, monthlyLimit - currentCount)

    return res.status(200).json({
      currentCount,
      monthlyLimit,
      remaining,
      canCreate: currentCount < monthlyLimit
    })

  } catch (error) {
    console.error('Error checking monthly limit:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

