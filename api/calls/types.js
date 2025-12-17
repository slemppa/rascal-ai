import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

    // Hae organisaation ID (public.users.id) käyttäen auth_user_id:tä
    // Tarkista ensin onko käyttäjä kutsuttu käyttäjä (org_members taulussa)
    let publicUserId = null
    
    const { data: orgMember, error: orgError } = await userClient
      .from('org_members')
      .select('org_id')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (!orgError && orgMember?.org_id) {
      // Käyttäjä on kutsuttu käyttäjä, käytä organisaation ID:tä
      publicUserId = orgMember.org_id
    } else {
      // Jos ei löydy org_members taulusta, tarkista onko normaali käyttäjä
      const { data: userData, error: userError } = await userClient
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle()

      if (!userError && userData?.id) {
        // Normaali käyttäjä, käytä users.id:tä
        publicUserId = userData.id
      }
    }

    if (!publicUserId) {
      return res.status(403).json({ error: 'Käyttäjää ei löytynyt organisaatiosta' })
    }

    const { data: callTypes, error } = await userClient
      .from('call_types')
      .select('*')
      .eq('user_id', publicUserId)
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