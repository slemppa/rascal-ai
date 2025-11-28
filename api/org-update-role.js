// api/org-update-role.js - Päivitä jäsenen roolia organisaatiossa
import { withOrganization } from './middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.id = organisaation ID (public.users.id)
    // req.organization.role = käyttäjän rooli ('owner', 'admin', 'member')
    // req.supabase = authenticated Supabase client

    const orgId = req.organization.id
    const userRole = req.organization.role
    const { auth_user_id, role } = req.body

    // Vain owner ja admin voivat päivittää rooleja
    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Admin or owner access required' })
    }

    if (!auth_user_id || !role) {
      return res.status(400).json({ error: 'auth_user_id and role are required' })
    }

    // Tarkista että rooli on validi
    if (!['owner', 'admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    // Owner voi luoda admineja, mutta vain owner voi luoda uusia ownereita
    if (role === 'owner' && userRole !== 'owner') {
      return res.status(403).json({ error: 'Only owners can assign owner role' })
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

    // Ei voi muuttaa omaa rooliaan
    if (auth_user_id === req.authUser.id) {
      return res.status(400).json({ error: 'Cannot change your own role' })
    }

    // Päivitä rooli
    // Käytetään Service Role Keyta jos saatavilla (ohittaa RLS:n)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    
    let updateClient = req.supabase
    if (supabaseServiceKey && supabaseUrl) {
      const { createClient } = await import('@supabase/supabase-js')
      updateClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      console.log('org-update-role: Using Service Role Key for update (bypasses RLS)')
    } else {
      console.warn('org-update-role: Service Role Key not available, using regular client (may fail due to RLS)')
    }
    
    const { data: updatedMember, error: updateError } = await updateClient
      .from('org_members')
      .update({ role })
      .eq('org_id', orgId)
      .eq('auth_user_id', auth_user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating role:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        org_id: orgId,
        auth_user_id: auth_user_id,
        role: role
      })
      return res.status(500).json({ 
        error: 'Failed to update role',
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint || 'Check RLS policies and table constraints'
      })
    }

    return res.status(200).json({
      success: true,
      member: updatedMember
    })

  } catch (error) {
    console.error('org-update-role error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)

