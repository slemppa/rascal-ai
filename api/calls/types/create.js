import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL
  })
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { fields, user_id } = req.body

    if (!fields) {
      return res.status(400).json({ error: 'fields on pakollinen' })
    }

    if (!user_id) {
      return res.status(400).json({ error: 'user_id on pakollinen' })
    }

    // Validoi pakolliset kentät
    if (!fields.Name || !fields.Name.trim()) {
      return res.status(400).json({ error: 'Name on pakollinen kenttä' })
    }

    // Hae organisaation ID (public.users.id) käyttäen auth_user_id:tä
    // Tarkista ensin onko käyttäjä kutsuttu käyttäjä (org_members taulussa)
    let publicUserId = null
    
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('auth_user_id', user_id)
      .maybeSingle()

    if (!orgError && orgMember?.org_id) {
      // Käyttäjä on kutsuttu käyttäjä, käytä organisaation ID:tä
      publicUserId = orgMember.org_id
    } else {
      // Jos ei löydy org_members taulusta, tarkista onko normaali käyttäjä
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user_id)
        .maybeSingle()

      if (!userError && userData?.id) {
        // Normaali käyttäjä, käytä users.id:tä
        publicUserId = userData.id
      }
    }

    if (!publicUserId) {
      return res.status(403).json({ error: 'Käyttäjää ei löytynyt organisaatiosta' })
    }

    // Muunna fields Supabase-muotoon
    const callTypeData = {
      user_id: publicUserId,
      name: fields.Name,
      identity: fields.Identity || null,
      style: fields.Style || null,
      guidelines: fields.Guidelines || null,
      goals: fields.Goals || null,
      intro: fields.Intro || null,
      questions: fields.Questions || null,
      outro: fields.Outro || null,
      notes: fields.Notes || null,
      version: fields.Version || '1.0',
      status: fields.Status || 'Active',
      airtable_record_id: fields.airtable_record_id || null
    }

    // Lisää call_type Supabaseen
    const { data: newCallType, error } = await supabase
      .from('call_types')
      .insert([callTypeData])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Virhe call_type luomisessa' })
    }

    // Muunna vastaus Airtable-tyyliseen muotoon
    const record = {
      id: newCallType.id,
      fields: {
        Name: newCallType.name,
        Identity: newCallType.identity,
        Style: newCallType.style,
        Guidelines: newCallType.guidelines,
        Goals: newCallType.goals,
        Intro: newCallType.intro,
        Questions: newCallType.questions,
        Outro: newCallType.outro,
        Notes: newCallType.notes,
        Version: newCallType.version,
        Status: newCallType.status,
        airtable_record_id: newCallType.airtable_record_id,
        created_at: newCallType.created_at,
        updated_at: newCallType.updated_at
      }
    }

    res.status(201).json({ 
      message: 'Puhelutyyppi luotu onnistuneesti',
      record: record
    })
  } catch (error) {
    console.error('Error in create-call-type endpoint:', error)
    res.status(500).json({ error: 'Sisäinen palvelinvirhe' })
  }
} 