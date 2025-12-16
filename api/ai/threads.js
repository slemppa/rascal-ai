import { withOrganization } from '../middleware/with-organization.js'

async function handler(req, res) {
  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.supabase = authenticated Supabase client
    const orgId = req.organization.id

    // GET - Hae threadit (vain metadata, viestit ovat Zepissä)
    if (req.method === 'GET') {
      const assistant_type = req.query?.assistant_type || 'marketing'
      
      let query = req.supabase
        .from('ai_chat_threads')
        .select('id, title, created_at, updated_at, assistant_type')
        .eq('user_id', orgId)
        .eq('assistant_type', assistant_type)
        .order('updated_at', { ascending: false })

      const { data: threads, error } = await query

      if (error) {
        console.error('[ai-chat-threads] GET error:', error)
        return res.status(500).json({ error: 'Threadien haku epäonnistui', details: error.message })
      }

      return res.status(200).json({ threads: threads || [] })
    }

    // POST - Luo uusi thread
    if (req.method === 'POST') {
      const { title, assistant_type } = req.body || {}
      const finalAssistantType = assistant_type === 'sales' ? 'sales' : 'marketing'

      const { data: newThread, error } = await req.supabase
        .from('ai_chat_threads')
        .insert({
          user_id: orgId,
          title: title || 'Uusi keskustelu',
          assistant_type: finalAssistantType
        })
        .select()
        .single()

      if (error) {
        console.error('[ai-chat-threads] POST error:', error)
        return res.status(500).json({ error: 'Threadin luonti epäonnistui', details: error.message })
      }

      return res.status(201).json({ thread: newThread })
    }

    // DELETE - Poista thread
    if (req.method === 'DELETE') {
      const { threadId } = req.body || {}

      if (!threadId) {
        return res.status(400).json({ error: 'threadId vaaditaan' })
      }

      const { error } = await req.supabase
        .from('ai_chat_threads')
        .delete()
        .eq('id', threadId)
        .eq('user_id', orgId)

      if (error) {
        console.error('[ai-chat-threads] DELETE error:', error)
        return res.status(500).json({ error: 'Threadin poisto epäonnistui', details: error.message })
      }

      return res.status(200).json({ success: true })
    }

    // PATCH - Päivitä threadin title
    if (req.method === 'PATCH') {
      const { threadId, title } = req.body || {}

      if (!threadId || !title) {
        return res.status(400).json({ error: 'threadId ja title vaaditaan' })
      }

      const { data: updatedThread, error } = await req.supabase
        .from('ai_chat_threads')
        .update({ title })
        .eq('id', threadId)
        .eq('user_id', orgId)
        .select()
        .single()

      if (error) {
        console.error('[ai-chat-threads] PATCH error:', error)
        return res.status(500).json({ error: 'Threadin päivitys epäonnistui', details: error.message })
      }

      return res.status(200).json({ thread: updatedThread })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[ai-chat-threads] Virhe:', e)
    return res.status(500).json({ error: 'Internal server error', details: e.message })
  }
}

export default withOrganization(handler)

