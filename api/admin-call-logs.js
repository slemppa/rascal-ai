// api/admin-call-logs.js - Admin endpoint puhelulokeille
import { withOrganization } from './middleware/with-organization.js'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // req.organization.role = käyttäjän rooli ('owner', 'admin', 'member')
    // req.supabase = authenticated Supabase client

    // Tarkista admin-oikeudet: admin tai owner rooli
    const isAdmin = req.organization.role === 'admin' || req.organization.role === 'owner'
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Hae ensin rivien kokonaismäärä
    const { count: totalCount, error: countError } = await req.supabase
      .from('call_logs')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting call logs:', countError)
      return res.status(500).json({ error: 'Failed to count call logs' })
    }

    // Jos ei ole rivejä, palauta tyhjä lista
    if (totalCount === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        count: 0
      })
    }

    // Hae kaikki rivit erissä (1000 riviä per sivu)
    const pageSize = 1000
    const totalPages = Math.ceil(totalCount / pageSize)
    let allCallLogs = []

    for (let page = 1; page <= totalPages; page++) {
      const startIndex = (page - 1) * pageSize
      const endIndex = Math.min(startIndex + pageSize - 1, totalCount - 1)

      const { data: pageLogs, error: callLogsError } = await req.supabase
        .from('call_logs')
        .select(`
          id,
          customer_name,
          phone_number,
          summary,
          price,
          call_type,
          call_date,
          answered,
          duration,
          call_status,
          call_outcome,
          created_at,
          users(contact_person, contact_email)
        `)
        .order('call_date', { ascending: false })
        .range(startIndex, endIndex)

      if (callLogsError) {
        console.error(`Error fetching call logs page ${page}:`, callLogsError)
        return res.status(500).json({ error: `Failed to fetch call logs page ${page}` })
      }

      allCallLogs = allCallLogs.concat(pageLogs || [])
    }

    return res.status(200).json({ 
      success: true, 
      data: allCallLogs,
      count: totalCount
    })

  } catch (error) {
    console.error('Admin call logs error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler) 