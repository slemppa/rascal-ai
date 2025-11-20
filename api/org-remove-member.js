// api/org-remove-member.js - Poista jäsen organisaatiosta
import { withOrganization } from './middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.organization.role = käyttäjän rooli ('owner', 'admin', 'member')
    // req.supabase = authenticated Supabase client

    const orgId = req.organization.id
    const userRole = req.organization.role
    const { auth_user_id } = req.query

    // Vain owner voi poistaa jäseniä
    if (userRole !== 'owner') {
      return res.status(403).json({ error: 'Only owners can remove members' })
    }

    if (!auth_user_id) {
      return res.status(400).json({ error: 'auth_user_id is required' })
    }

    // Ei voi poistaa itseään
    if (auth_user_id === req.authUser.id) {
      return res.status(400).json({ error: 'Cannot remove yourself from organization' })
    }

    // Tarkista että jäsen on organisaatiossa
    const { data: member, error: checkError } = await req.supabase
      .from('org_members')
      .select('*')
      .eq('org_id', orgId)
      .eq('auth_user_id', auth_user_id)
      .single()

    if (checkError || !member) {
      return res.status(404).json({ error: 'Member not found in organization' })
    }

    // Poista jäsen sekä org_members taulusta että Supabase Authista
    // Käytetään Service Role Keyta jos saatavilla (ohittaa RLS:n ja mahdollistaa Auth-poiston)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
    
    let deleteClient = req.supabase
    let serviceClient = null
    
    if (supabaseServiceKey && supabaseUrl) {
      const { createClient } = await import('@supabase/supabase-js')
      deleteClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      serviceClient = deleteClient
      console.log('org-remove-member: Using Service Role Key for delete (bypasses RLS)')
    } else {
      console.warn('org-remove-member: Service Role Key not available, using regular client (may fail due to RLS)')
    }
    
    // Poista käyttäjä Supabase Authista (vaatii Service Role Keyn)
    if (serviceClient) {
      try {
        console.log('Deleting user from Supabase Auth:', auth_user_id)
        const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(auth_user_id)
        
        if (authDeleteError) {
          console.error('Error deleting user from Auth:', {
            message: authDeleteError.message,
            auth_user_id: auth_user_id
          })
          // Jatketaan org_members poistoon vaikka Auth-poisto epäonnistui
          console.warn('Failed to delete user from Auth, but continuing with org_members removal')
        } else {
          console.log('User deleted from Supabase Auth successfully:', auth_user_id)
        }
      } catch (authErr) {
        console.error('Exception deleting user from Auth:', authErr)
        // Jatketaan org_members poistoon vaikka Auth-poisto epäonnistui
      }
    } else {
      console.warn('Service Role Key not available, skipping Auth user deletion')
    }
    
    // Poista jäsen org_members taulusta
    const { error: deleteError } = await deleteClient
      .from('org_members')
      .delete()
      .eq('org_id', orgId)
      .eq('auth_user_id', auth_user_id)

    if (deleteError) {
      console.error('Error removing member from org_members:', {
        message: deleteError.message,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint,
        org_id: orgId,
        auth_user_id: auth_user_id
      })
      return res.status(500).json({ 
        error: 'Failed to remove member',
        details: deleteError.message,
        code: deleteError.code,
        hint: deleteError.hint || 'Check RLS policies and table constraints'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    })

  } catch (error) {
    console.error('org-remove-member error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)

