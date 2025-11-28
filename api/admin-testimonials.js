import { withOrganization } from './middleware/with-organization.js'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function handler(req, res) {
  try {
    // req.organization.role = käyttäjän rooli ('owner', 'admin', 'member')
    // req.supabase = authenticated Supabase client

    // Tarkista moderator/admin-oikeudet
    const isAdmin = req.organization.role === 'admin' || req.organization.role === 'owner'
    const isModerator = req.organization.role === 'moderator' || isAdmin
    if (!isModerator) return res.status(403).json({ error: 'Moderator access required' })

    if (req.method === 'GET') {
      const { data, error } = await serviceClient
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json({ data })
    }

    if (req.method === 'POST') {
      const { name, title, company, quote, avatar_url, published } = req.body || {}
      if (!name || !quote) return res.status(400).json({ error: 'name and quote are required' })
      const { data, error } = await serviceClient
        .from('testimonials')
        .insert([{ name, title, company, quote, avatar_url, published: !!published }])
        .select()
        .single()
      if (error) throw error
      return res.status(201).json({ data })
    }

    if (req.method === 'PUT') {
      const { id, ...fields } = req.body || {}
      if (!id) return res.status(400).json({ error: 'id is required' })
      const { data, error } = await serviceClient
        .from('testimonials')
        .update(fields)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return res.status(200).json({ data })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {}
      if (!id) return res.status(400).json({ error: 'id is required' })
      const { error } = await serviceClient
        .from('testimonials')
        .delete()
        .eq('id', id)
      if (error) throw error
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('admin-testimonials error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)


