// api/org-invite.js - Kutsu käyttäjä organisaatioon
import { withOrganization } from './middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.organization.role = käyttäjän rooli ('owner', 'admin', 'member')
    // req.supabase = authenticated Supabase client

    const orgId = req.organization.id
    const userRole = req.organization.role
    const { email, role = 'member' } = req.body

    // Vain owner ja admin voivat kutsua käyttäjiä
    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Admin or owner access required' })
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Tarkista että rooli on validi
    if (!['owner', 'admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    // Owner voi luoda admineja, mutta vain owner voi luoda uusia ownereita
    if (role === 'owner' && userRole !== 'owner') {
      return res.status(403).json({ error: 'Only owners can create other owners' })
    }

    // Hae käyttäjä email:llä Supabase Authista
    // Käytetään Service Role Keyta jos saatavilla, muuten yritetään hakea org_members taulusta
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
    
    console.log('org-invite: Checking Service Role Key availability:', {
      hasServiceKey: !!supabaseServiceKey,
      hasUrl: !!supabaseUrl,
      email: email
    })
    
    let authUser = null

    if (supabaseServiceKey && supabaseUrl) {
      // Käytetään Service Role Keyta Admin API:in kanssa
      const { createClient } = await import('@supabase/supabase-js')
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Hae käyttäjä email:llä Admin API:sta
      console.log('Searching for user by email:', email)
      const { data: authUsers, error: listError } = await serviceClient.auth.admin.listUsers()
      if (listError) {
        console.error('Error listing users:', listError)
        return res.status(500).json({ 
          error: 'Failed to find user', 
          details: listError.message,
          hint: 'Check if Service Role Key is correct and has admin permissions'
        })
      }

      console.log(`Found ${authUsers?.users?.length || 0} total users in Supabase Auth`)
      authUser = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (!authUser) {
        console.log('User not found. Available emails:', authUsers.users.slice(0, 5).map(u => u.email).join(', '))
      }
    } else {
      // Jos Service Role Key puuttuu, yritetään hakea org_members taulusta
      // Tämä toimii vain jos käyttäjä on jo jäsenenä jossain organisaatiossa
      const { data: existingMembers, error: memberError } = await req.supabase
        .from('org_members')
        .select('auth_user_id, email')
        .eq('email', email)
        .maybeSingle()

      if (memberError || !existingMembers) {
        console.error('Service Role Key missing or user not found in org_members:', {
          memberError: memberError?.message,
          hasExistingMembers: !!existingMembers,
          email: email
        })
        return res.status(500).json({ 
          error: 'Service role key not configured. Cannot find user by email without it.',
          hint: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable in .env file',
          details: 'The user must either exist in org_members table or you need to configure Service Role Key to search Supabase Auth'
        })
      }

      // Jos löytyi org_members taulusta, käytetään sitä
      // Mutta tarvitaan auth_user_id, joten haetaan se
      authUser = {
        id: existingMembers.auth_user_id,
        email: existingMembers.email
      }
    }

    if (!authUser) {
      // Jos käyttäjää ei löydy, luo se ja lähetä kutsu
      if (supabaseServiceKey && supabaseUrl) {
        console.log('User not found, creating new user and sending invitation:', email)
        
        const { createClient } = await import('@supabase/supabase-js')
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        // Luo käyttäjä salasanalla ja lähetä sitten invite-sähköposti Supabasesta
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL || 'http://localhost:5173'
          
          // Vakio salasana uusille käyttäjille (voi määritellä ympäristömuuttujassa)
          const defaultPassword = process.env.ORG_INVITE_DEFAULT_PASSWORD || 'RascalAI2024!'
          
          console.log('Creating user with password first:', email)
          
          // 1. Luo käyttäjä salasanalla ja vahvista sähköposti
          const { data: createData, error: createError } = await serviceClient.auth.admin.createUser({
            email: email,
            password: defaultPassword,
            email_confirm: true, // Vahvista sähköposti automaattisesti
            user_metadata: {
              org_id: orgId,
              role: role
            }
          })

          if (createError || !createData?.user) {
            console.error('Error creating user:', createError)
            return res.status(500).json({ 
              error: 'Failed to create user',
              details: createError?.message || 'Unknown error',
              hint: 'Check Service Role Key permissions and Supabase Auth settings'
            })
          }

          authUser = createData.user
          console.log('User created successfully with password and email confirmed:', authUser.id)

          // 2. Lähetä invite-sähköposti Supabasesta
          console.log('Sending invite email via Supabase:', email)
          const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${appUrl}/auth/callback`,
            data: {
              org_id: orgId,
              role: role
            }
          })

          if (inviteError) {
            console.error('Error sending invite email:', inviteError)
            // Käyttäjä on luotu, mutta sähköpostin lähetys epäonnistui
            console.warn('User created but invite email sending failed')
          } else {
            console.log('Invite email sent successfully via Supabase:', inviteData?.user?.id || authUser.id)
          }
        } catch (error) {
          console.error('Error in user creation/invitation process:', error)
          return res.status(500).json({ 
            error: 'Failed to create user or send invitation',
            details: error.message,
            hint: 'Check Service Role Key permissions and Supabase Auth configuration'
          })
        }
      } else {
        // Jos Service Role Key puuttuu
        return res.status(500).json({ 
          error: 'Cannot find or create user. Service role key is required.',
          hint: 'Please configure SUPABASE_SERVICE_ROLE_KEY environment variable in .env file'
        })
      }
    }

    // Tarkista onko käyttäjä jo jäsenenä tässä organisaatiossa
    const { data: existingMember, error: checkError } = await req.supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId)
      .eq('auth_user_id', authUser.id)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing member:', checkError)
      return res.status(500).json({ error: 'Failed to check existing membership' })
    }

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this organization' })
    }

    // Lisää käyttäjä organisaatioon
    // HUOM: Käytetään Service Role Keyta insert-operaatiossa, koska se ohittaa RLS:n
    // Tämä on turvallista, koska olemme jo tarkistaneet että käyttäjällä on oikeudet (owner/admin)
    console.log('Inserting member:', {
      org_id: orgId,
      auth_user_id: authUser.id,
      role: role,
      email: authUser.email || email
    })

    // Käytetään Service Role Keyta insert-operaatiossa
    let insertClient = req.supabase
    if (supabaseServiceKey && supabaseUrl) {
      const { createClient } = await import('@supabase/supabase-js')
      insertClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      console.log('Using Service Role Key for insert (bypasses RLS)')
    } else {
      console.warn('Service Role Key not available, using regular client (may fail due to RLS)')
    }

    const { data: newMember, error: insertError } = await insertClient
      .from('org_members')
      .insert({
        org_id: orgId,
        auth_user_id: authUser.id,
        role: role,
        email: authUser.email || email // Fallback email:lle jos authUser.email puuttuu
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error adding member:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        org_id: orgId,
        auth_user_id: authUser.id,
        email: authUser.email || email
      })
      return res.status(500).json({ 
        error: 'Failed to add member',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint || 'Check RLS policies and table constraints'
      })
    }

    // Sähköposti lähetetään automaattisesti Supabasen inviteUserByEmail metodilla
    // Käyttäjä voi muokata mailipohjaa Supabasen dashboardissa

    return res.status(201).json({
      success: true,
      member: newMember
    })

  } catch (error) {
    console.error('org-invite error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)

