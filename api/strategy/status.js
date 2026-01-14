import { withOrganization } from '../middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../lib/cors.js'

/**
 * GET /api/strategy/status
 * Hakee organisaation strategian statuksen
 * 
 * POST /api/strategy/status
 * Päivittää organisaation strategian statuksen
 */
async function handler(req, res) {
  setCorsHeaders(res, ['GET', 'POST', 'OPTIONS'])

  if (handlePreflight(req, res)) {
    return
  }

  try {
    // Tarkista että middleware on asettanut organization ja supabase
    if (!req.organization || !req.organization.id) {
      return res.status(500).json({ error: 'Organization context missing' })
    }

    if (!req.supabase) {
      return res.status(500).json({ error: 'Supabase client missing' })
    }

    // req.organization.id = organisaation ID (public.users.id)
    // Middleware hoitaa admin-käyttäjien käsittelyn oikein
    const publicUserId = req.organization.id

    if (req.method === 'GET') {
      // Hae strategian status
      const { data: userRecord, error: userError } = await req.supabase
        .from('users')
        .select('status, strategy_approved_at')
        .eq('id', publicUserId)
        .single()

      if (userError) {
        console.error('Error fetching strategy status:', userError)
        return res.status(500).json({ 
          error: 'Failed to fetch strategy status',
          details: userError.message 
        })
      }

      return res.status(200).json({
        status: userRecord?.status || null,
        strategy_approved_at: userRecord?.strategy_approved_at || null
      })
    }

    if (req.method === 'POST') {
      // Päivitä strategian status
      const { status } = req.body

      if (!status) {
        return res.status(400).json({ error: 'Status is required' })
      }

      const updateData = {
        status,
        updated_at: new Date().toISOString()
      }

      // Jos status on 'Approved', päivitä myös strategy_approved_at
      if (status === 'Approved') {
        updateData.strategy_approved_at = new Date().toISOString()
      }

      const { data: updatedUser, error: updateError } = await req.supabase
        .from('users')
        .update(updateData)
        .eq('id', publicUserId)
        .select('status, strategy_approved_at')
        .single()

      if (updateError) {
        console.error('Error updating strategy status:', updateError)
        return res.status(500).json({ 
          error: 'Failed to update strategy status',
          details: updateError.message 
        })
      }

      return res.status(200).json({
        success: true,
        status: updatedUser.status,
        strategy_approved_at: updatedUser.strategy_approved_at
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Error in /api/strategy/status:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
}

export default withOrganization(handler)
