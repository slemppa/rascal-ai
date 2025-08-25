import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { ids } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids (array) vaaditaan' })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Supabase asetukset puuttuvat (URL tai SERVICE_ROLE_KEY)' })
    }

    const tableName = process.env.DEV_KNOWLEDGE_TABLE || 'documents'
    const supabase = createClient(supabaseUrl, serviceKey)

    const { error } = await supabase
      .from(tableName)
      .delete()
      .in('id', ids)

    if (error) {
      return res.status(500).json({ error: 'Poisto epäonnistui', details: error.message })
    }

    return res.status(200).json({ success: true, deleted: ids.length })
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error', details: e.message })
  }
}



