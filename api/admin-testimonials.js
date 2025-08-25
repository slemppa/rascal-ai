import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  try {
    // Auth header required
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Authorization token required' })

    // Create client with user token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: authResult, error: authError } = await userClient.auth.getUser(token)
    if (authError || !authResult?.user) return res.status(401).json({ error: 'Invalid token' })

    // Check role from users table
    const { data: userData, error: userError } = await userClient
      .from('users')
      .select('role, company_id')
      .eq('auth_user_id', authResult.user.id)
      .single()
    if (userError || !userData) return res.status(403).json({ error: 'User not found' })

    const isAdmin = userData.role === 'admin' || userData.company_id === 1
    const isModerator = userData.role === 'moderator' || isAdmin
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


