import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Vain GET-metodit sallittu' })
  }

  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Supabase config missing' })
    }

    const authHeader = req.headers.authorization || req.headers.Authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' })
    }
    const token = authHeader.slice(7)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })

    const { data: authResult, error: authError } = await userClient.auth.getUser(token)
    if (authError || !authResult?.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    const authUserId = authResult.user.id

    const { data: callTypes, error } = await userClient
      .from('call_types')
      .select('*')
      .eq('user_id', authUserId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Virhe call_types haussa' })
    }

    const records = (callTypes || []).map(callType => ({
      id: callType.id,
      fields: {
        Name: callType.name,
        Identity: callType.identity,
        Style: callType.style,
        Guidelines: callType.guidelines,
        Goals: callType.goals,
        Intro: callType.intro,
        Questions: callType.questions,
        Outro: callType.outro,
        Notes: callType.notes,
        Version: callType.version,
        Status: callType.status,
        airtable_record_id: callType.airtable_record_id,
        created_at: callType.created_at,
        updated_at: callType.updated_at
      }
    }))

    res.status(200).json({ records })
  } catch (error) {
    console.error('Error in call-types endpoint:', error)
    res.status(500).json({ error: 'Sisäinen palvelinvirhe' })
  }
}