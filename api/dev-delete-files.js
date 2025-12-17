import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Tarkista käyttäjän access token
    const access_token = req.headers['authorization']?.replace('Bearer ', '')
    if (!access_token) {
      return res
        .status(401)
        .json({ error: 'Unauthorized: access token puuttuu' })
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[dev-delete-files] Supabase URL tai ANON_KEY puuttuu')
      return res
        .status(500)
        .json({ error: 'Supabase asetukset puuttuvat' })
    }

    // Luo Supabase-yhteys käyttäjän tokenilla (RLS hoitaa oikeudet)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${access_token}` } },
    })

    // Tarkista käyttäjän autentikointi
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return res
        .status(401)
        .json({ error: 'Käyttäjän autentikointi epäonnistui' })
    }

    const { ids } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids (array) vaaditaan' })
    }

    const tableName = process.env.DEV_KNOWLEDGE_TABLE || 'langchain_documents'

    console.log(
      `[dev-delete-files] Poistetaan ${ids.length} dokumenttia taulusta ${tableName}`
    )
    console.log('[dev-delete-files] User:', user.id, 'IDs:', ids)

    // Poista dokumentit Supabasesta (RLS tarkistaa että käyttäjä omistaa dokumentit)
    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .in('id', ids)

    if (error) {
      console.error('[dev-delete-files] Supabase delete error:', error)
      return res
        .status(500)
        .json({ error: 'Poisto epäonnistui', details: error.message })
    }

    console.log(
      `[dev-delete-files] ✅ Poistettu ${ids.length} dokumenttia onnistuneesti`
    )

    return res.status(200).json({
      success: true,
      deleted: ids.length,
    })
  } catch (e) {
    console.error('[dev-delete-files] Virhe:', e)
    return res
      .status(500)
      .json({ error: 'Internal server error', details: e.message })
  }
}

