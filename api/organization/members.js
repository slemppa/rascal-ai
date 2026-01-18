// api/organization/members.js - Unified Members API
import { withOrganization } from '../_middleware/with-organization.js'

/**
 * Unified Organization Members API Endpoint
 * 
 * GET /api/organization/members - Listaa organisaation jäsenet
 * PUT /api/organization/members - Päivittää jäsenen roolia (body: { auth_user_id, role })
 * DELETE /api/organization/members - Poistaa jäsenen (query: ?auth_user_id=xxx)
 */
async function handler(req, res) {
  try {
    const orgId = req.organization.id
    const userRole = req.organization.role

    switch (req.method) {
      case 'GET':
        return await getMembers(req, res, orgId, userRole)
      
      case 'PUT':
        return await updateMemberRole(req, res, orgId, userRole)
      
      case 'DELETE':
        return await removeMember(req, res, orgId, userRole)
      
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Organization members API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/organization/members
 * Hae organisaation jäsenet
 */
async function getMembers(req, res, orgId, userRole) {
  // Vain owner ja admin voivat nähdä jäsenet
  if (!['owner', 'admin'].includes(userRole)) {
    return res.status(403).json({ error: 'Admin or owner access required' })
  }

  // Hae organisaation jäsenet
  // Email on nyt org_members taulussa, joten ei tarvita join:ia auth.users tauluun
  const { data: members, error } = await req.supabase
    .from('org_members')
    .select('org_id, auth_user_id, role, created_at, email')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching org members:', error)
    return res.status(500).json({ error: 'Failed to fetch members', details: error.message })
  }

  // Muotoillaan vastaus samaan muotoon kuin ennen
  const membersWithAuthData = (members || []).map((member) => ({
    ...member,
    auth_users: {
      id: member.auth_user_id,
      email: member.email,
      user_metadata: null
    }
  }))

  return res.status(200).json({ 
    success: true,
    members: membersWithAuthData
  })
}

/**
 * PUT /api/organization/members
 * Päivitä jäsenen roolia organisaatiossa
 */
async function updateMemberRole(req, res, orgId, userRole) {
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
}

/**
 * DELETE /api/organization/members
 * Poista jäsen organisaatiosta
 */
async function removeMember(req, res, orgId, userRole) {
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
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  
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
}

export default withOrganization(handler)
