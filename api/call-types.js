import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  // Vain GET-metodit sallittu
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Vain GET-metodit sallittu' })
  }

  try {
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ error: 'user_id on pakollinen' })
    }

    // Hae call_types käyttäjän user_id:n perusteella
    const { data: callTypes, error } = await supabase
      .from('call_types')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Virhe call_types haussa' })
    }

    // Muunna data Airtable-tyyliseen muotoon frontendin yhteensopivuuden vuoksi
    const records = callTypes.map(callType => ({
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