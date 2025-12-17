import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasServiceRole: !!serviceRoleKey,
    hasAnon: !!anonKey,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
  throw new Error('Missing Supabase environment variables')
}

import { setCorsHeaders, handlePreflight } from '../lib/cors.js'

export default async function handler(req, res) {
  // CORS headers
  setCorsHeaders(res, ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
  
  // Handle preflight requests
  if (handlePreflight(req, res)) {
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Luo Supabase-asiakas: ensisijaisesti service role; muuten käytä Authorization-headerin Bearer JWT:tä; viimeisenä keinona anon-avainta
    const authHeader = req.headers.authorization || req.headers.Authorization
    let supabase
    if (serviceRoleKey) {
      supabase = createClient(supabaseUrl, serviceRoleKey)
    } else if (authHeader && authHeader.startsWith('Bearer ') && anonKey) {
      const token = authHeader.slice(7)
      supabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      })
    } else if (anonKey) {
      supabase = createClient(supabaseUrl, anonKey)
    } else {
      return res.status(500).json({ error: 'Supabase configuration error' })
    }

    const { call_type_id, inbound_settings_id } = req.body

    if (!call_type_id && !inbound_settings_id) {
      return res.status(400).json({ error: 'Missing call_type_id or inbound_settings_id' })
    }

    // Pieni odotus varmistaaksemme että data on tallennettu
    await new Promise(resolve => setTimeout(resolve, 1000))

    let data, tableName, idField, idValue

    if (call_type_id) {
      // Outbound call type
      tableName = 'call_types'
      idField = 'id'
      idValue = call_type_id
      
      const { data: callType, error: fetchError } = await supabase
        .from('call_types')
        .select('*')
        .eq('id', call_type_id)
        .single()

      if (fetchError || !callType) {
        console.error('Call type not found:', fetchError)
        return res.status(404).json({ error: 'Call type not found' })
      }
      
      data = callType
    } else {
      // Inbound settings
      tableName = 'inbound_call_types'
      idField = 'id'
      idValue = inbound_settings_id
      
      const { data: inboundData, error: fetchError } = await supabase
        .from('inbound_call_types')
        .select(`
          *,
          users(
            id,
            contact_email,
            contact_person,
            company_name,
            auth_user_id
          )
        `)
        .eq('id', inbound_settings_id)
        .single()

      if (fetchError || !inboundData) {
        console.error('Inbound settings not found:', fetchError)
        return res.status(404).json({ error: 'Inbound settings not found' })
      }
      
      data = inboundData
    }

    const webhookUrl = process.env.N8N_CALL_TYPE_ENHANCEMENT || 'https://n8n.mak8r.fi/webhook/N8N_CALL_TYPE_ENHANCEMENT'
    const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

    console.log('Environment check:')
    console.log('- N8N_CALL_TYPE_ENHANCEMENT:', process.env.N8N_CALL_TYPE_ENHANCEMENT ? 'SET' : 'NOT SET')
    console.log('- N8N_SECRET_KEY:', process.env.N8N_SECRET_KEY ? 'SET' : 'NOT SET')
    console.log('Sending improvement request to:', webhookUrl)
    console.log('Type:', call_type_id ? 'outbound' : 'inbound')
    console.log('ID:', call_type_id || inbound_settings_id)
    console.log('Data:', data)

    // Valmistele webhook data
    const webhookData = call_type_id ? {
      type: 'outbound_improvement',
      call_type_id: call_type_id,
      call_type_data: data
    } : {
      type: 'inbound_improvement',
      inbound_settings_id: inbound_settings_id,
      inbound_data: data
    }

    // Lähetä data N8N:lle
    const response = await axios.post(webhookUrl, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_SECRET_KEY ? { 'x-api-key': N8N_SECRET_KEY } : {})
      }
    })

    console.log('Improvement request sent successfully:', response.data)

    return res.status(200).json({ 
      success: true, 
      message: 'Improvement request sent successfully',
      type: call_type_id ? 'outbound' : 'inbound',
      response: response.data 
    })

  } catch (error) {
    console.error('Call type improvement error:', error)
    console.error('Error stack:', error.stack)
    const status = error.response?.status || 500
    const data = error.response?.data || { message: error.message }
    return res.status(status).json({ 
      error: 'Call type improvement error', 
      message: error.message,
      details: data,
      stack: error.stack
    })
  }
}
