import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Hae token headerista
    const authHeader = req.headers.authorization || req.headers.Authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' })
    }

    // Parse token
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    if (!match) {
      return res.status(401).json({ 
        error: 'Invalid authorization header format',
        received: authHeader.substring(0, 20) + '...'
      })
    }

    const token = match[1]
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ 
        error: 'Supabase configuration missing',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      })
    }

    // Luo Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: { 
        headers: { 
          Authorization: `Bearer ${token}`
        } 
      }
    })

    // Tarkista token
    const { data: authResult, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      const isDevelopment = process.env.NODE_ENV === 'development'
      return res.status(401).json({
        error: 'Token validation failed',
        ...(isDevelopment && {
          details: authError.message,
          code: authError.status || authError.code,
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...'
        })
      })
    }

    if (!authResult?.user) {
      return res.status(401).json({
        error: 'No user found for token',
        tokenLength: token.length
      })
    }

    const isDevelopment = process.env.NODE_ENV === 'development'
    return res.json({
      success: true,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        created_at: authResult.user.created_at
      },
      ...(isDevelopment && {
        tokenInfo: {
          length: token.length,
          preview: token.substring(0, 20) + '...'
        }
      })
    })

  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
