// api/middleware/with-organization.js
// Middleware joka tekee organisaatiotarkistuksen automaattisesti
// ja lisää organisaatiotiedot request-objektiin

import { createClient } from '@supabase/supabase-js'

export function withOrganization(handler) {
  return async (req, res) => {
    try {
      // 1. Hae token headerista
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return res.status(401).json({ error: 'Authorization token required' })
      }

      // 2. Luo Supabase client
      // Dokumentaation mukaan Service Role Key ohittaa RLS:n kokonaan
      // Mutta käytetään käyttäjän tokenia auth-tarkistuksessa
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl) {
        console.error('Supabase URL missing')
        return res.status(500).json({ error: 'Supabase URL missing' })
      }
      
      // Käytetään Service Role Keyta jos saatavilla (ohittaa RLS:n)
      // Muuten käytetään anon keyta (RLS-politiikat voimassa)
      const supabaseKey = supabaseServiceKey || supabaseAnonKey
      if (!supabaseKey) {
        console.error('Supabase key missing')
        return res.status(500).json({ error: 'Supabase key missing' })
      }
      
      // Luodaan Supabase client käyttäjän tokenilla
      // Dokumentaation mukaan kun käytämme anon keyta, token asetetaan Authorization headerissa
      // Tämä mahdollistaa auth.uid() funktion toimimisen RLS-politiikoissa
      const supabase = createClient(supabaseUrl, supabaseKey, {
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

      // 3. Hae auth käyttäjä - tämä varmistaa että token on voimassa
      // ja asettaa käyttäjän kontekstin RLS-politiikoille
      // Käytetään getUser() ilman token-parametria, koska token on jo asetettu clientissa
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Auth error:', authError)
        return res.status(401).json({ error: 'Invalid token', details: authError?.message })
      }

      // 4. Hae käyttäjän organisaatio org_members taulusta
      // Käytetään maybeSingle() jotta ei tule virhettä jos jäsenyyttä ei löydy
      // Tarkistetaan että käyttäjällä on oikeat oikeudet
      // HUOM: RLS-politiikka tarkistaa automaattisesti että auth_user_id = auth.uid()
      // Joten meidän ei tarvitse tarkistaa tätä erikseen
      console.log('withOrganization: Fetching org_members for auth_user_id:', user.id)
      const { data: orgMember, error: orgError } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('auth_user_id', user.id) // Tarkista että haetaan oikean käyttäjän organisaatio
        .maybeSingle()

      console.log('withOrganization: org_members query result:', { orgMember, orgError })

      if (orgError) {
        console.error('Error fetching org_members:', {
          message: orgError.message,
          code: orgError.code,
          details: orgError.details,
          hint: orgError.hint,
          user_id: user.id
        })
        return res.status(500).json({ 
          error: 'Error fetching organization',
          details: orgError.message,
          code: orgError.code
        })
      }

      if (!orgMember) {
        console.warn('withOrganization: User not found in org_members:', user.id)
        
        // Tarkista onko käyttäjä admin (company_id = 1 tai role = 'admin')
        const { data: adminCheck, error: adminError } = await supabase
          .from('users')
          .select('id, role, company_id')
          .eq('auth_user_id', user.id)
          .single()
        
        if (!adminError && adminCheck && (adminCheck.role === 'admin' || adminCheck.company_id === 1)) {
          // Admin-käyttäjä, käytä users.id organisaatio-ID:nä
          req.organization = {
            id: adminCheck.id,
            role: 'admin',
            data: adminCheck
          }
          req.authUser = user
          req.supabase = supabase
          return handler(req, res)
        }
        
        return res.status(403).json({ 
          error: 'User not member of any organization',
          hint: 'Käyttäjä ei ole jäsenenä organisaatiossa. Ota yhteyttä ylläpitoon.'
        })
      }

      console.log('withOrganization: Found org member:', { org_id: orgMember.org_id, role: orgMember.role })

      // 5. Hae organisaation tiedot users taulusta erikseen
      const { data: orgData, error: orgDataError } = await supabase
        .from('users')
        .select('*')
        .eq('id', orgMember.org_id)
        .single()

      if (orgDataError) {
        console.error('Error fetching organization data:', orgDataError)
        return res.status(500).json({ 
          error: 'Error fetching organization data',
          details: orgDataError.message 
        })
      }

      // 6. Lisää organisaatiotiedot request-objektiin
      req.organization = {
        id: orgMember.org_id,           // public.users.id (organisaatio)
        role: orgMember.role,           // 'owner', 'admin', 'member'
        data: orgData                   // public.users rivi (kaikki organisaation tiedot)
      }
      req.authUser = user
      req.supabase = supabase

      // 6. Kutsu alkuperäinen handler
      return handler(req, res)
    } catch (error) {
      console.error('withOrganization middleware error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

