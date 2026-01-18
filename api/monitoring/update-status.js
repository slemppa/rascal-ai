// api/monitoring/update-status.js - Päivitä mediaseuranta-entryn status
import { withOrganization } from '../_middleware/with-organization.js'
import { setCorsHeaders, handlePreflight } from '../_lib/cors.js'

async function handler(req, res) {
  setCorsHeaders(res, ['PUT', 'OPTIONS'], undefined, req)
  
  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { entry_id, status } = req.body

    if (!entry_id) {
      return res.status(400).json({ 
        error: 'Missing entry_id',
        details: 'entry_id is required'
      })
    }

    const entryId = typeof entry_id === 'string' ? parseInt(entry_id, 10) : entry_id

    if (!entryId || isNaN(entryId)) {
      return res.status(400).json({ 
        error: 'Invalid entry_id',
        details: 'entry_id must be a valid number'
      })
    }

    if (!status || !['unread', 'read', 'hidden', 'favorite'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        details: 'status must be one of: unread, read, hidden, favorite'
      })
    }

    const orgId = req.organization.id

    // Päivitä status monitoring_entries taulussa
    const { data: updatedEntry, error: updateError } = await req.supabase
      .from('monitoring_entries')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('entry_id', entryId)
      .eq('user_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating monitoring entry status:', updateError)
      return res.status(500).json({ 
        error: 'Failed to update entry status',
        details: updateError.message 
      })
    }

    if (!updatedEntry) {
      return res.status(404).json({ 
        error: 'Entry not found',
        details: 'Monitoring entry with this entry_id not found for this user'
      })
    }

    return res.status(200).json({
      success: true,
      entry: updatedEntry
    })

  } catch (error) {
    console.error('Error updating entry status:', error)
    return res.status(500).json({ 
      error: 'Failed to update entry status',
      details: error.message 
    })
  }
}

export default withOrganization(handler)
