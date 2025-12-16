import { createClient } from '@supabase/supabase-js'
import logger from '../../lib/logger.js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ 
      error: 'Supabase config missing',
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseAnonKey)
    })
  }

  try {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ error: 'campaign id puuttuu' })

    const authHeader = req.headers.authorization || req.headers.Authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Päivitä kampanjan status
    const { data: updatedCampaign, error: campaignUpdateError } = await userClient
      .from('campaigns')
      .update({ status: 'paused' })
      .eq('id', id)
      .select('id, status')
      .maybeSingle()

    if (campaignUpdateError) {
      return res.status(500).json({ error: 'Kampanjan päivitys epäonnistui', details: campaignUpdateError.message })
    }

    // Päivitä kampanjaan liittyvät call_logs-rivit VAIN keskeneräisille
    const { data: pausedLogs, error: logsError } = await userClient
      .from('call_logs')
      .update({ call_status: 'paused' })
      .eq('new_campaign_id', id)
      .in('call_status', ['pending', 'in progress'])
      .select('id')

    if (logsError) {
      return res.status(500).json({ error: 'Call logien päivitys epäonnistui', details: logsError.message })
    }

    res.status(200).json({
      success: true,
      campaign: updatedCampaign,
      updatedLogs: pausedLogs?.length || 0
    })
  } catch (error) {
    logger.error('Unhandled error /api/campaign-pause:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}


