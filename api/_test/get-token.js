// Helper endpoint joka palauttaa nykyisen session tokenin
// HUOM: Tämä on vain kehitystä varten - älä käytä tuotannossa!
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Hae token headerista
    const authHeader = req.headers.authorization || req.headers.Authorization
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authorization header missing',
        hint: 'Kirjaudu ensin sisään selaimessa, sitten hae token selaimen konsolista: await supabase.auth.getSession()'
      })
    }

    // Parse token
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    if (!match) {
      return res.status(401).json({ 
        error: 'Invalid authorization header format'
      })
    }

    const token = match[1].trim()
    
    return res.json({
      success: true,
      token: token,
      hint: 'Kopioi tämä token curl-kutsuun'
    })

  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
