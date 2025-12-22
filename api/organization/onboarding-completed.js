import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

// Käytä ensin service role -avainta; jos puuttuu, käytetään anon key:tä ja pyydetään Authorization header käyttäjältä
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
  || process.env.SUPABASE_SERVICE_KEY

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // Vain POST-pyynnöt
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { conversationId, userId, icpData } = req.body

    console.log('📥 Received request:', {
      conversationId: conversationId || 'MISSING',
      userId: userId || 'MISSING',
      hasIcpData: !!icpData,
      bodyKeys: Object.keys(req.body || {}),
      fullBody: JSON.stringify(req.body, null, 2)
    })

    // Tarkista että conversationId on olemassa ja ei ole tyhjä
    if (!conversationId || (typeof conversationId === 'string' && conversationId.trim() === '')) {
      console.error('❌ conversationId is required but missing or empty', {
        conversationId: conversationId,
        type: typeof conversationId,
        userId: userId
      })
      return res.status(400).json({ 
        error: 'conversationId is required',
        received: {
          conversationId: conversationId,
          userId: userId,
          hasBody: !!req.body,
          bodyType: typeof req.body
        }
      })
    }

    // Tarkista että userId on olemassa ja ei ole tyhjä
    if (!userId || (typeof userId === 'string' && userId.trim() === '')) {
      console.error('❌ userId is required but missing or empty', {
        conversationId: conversationId,
        userId: userId,
        type: typeof userId
      })
      return res.status(400).json({ 
        error: 'userId is required',
        received: {
          conversationId: conversationId,
          userId: userId,
          hasBody: !!req.body
        }
      })
    }

    console.log('📞 Onboarding conversation completed:', {
      conversationId,
      userId,
      hasIcpData: !!icpData
    })

    // Hae public.users.id käyttäen auth_user_id:tä
    // Sama logiikka kuin analytics.js ja with-organization.js:
    // 1. Tarkista ensin org_members taulusta (kutsutut käyttäjät)
    // 2. Jos ei löydy, hae users taulusta auth_user_id:n perusteella
    let userData = null
    let publicUserId = null
    
    if (userId && supabaseUrl && (supabaseAnonKey || supabaseServiceKey)) {
      // Hae käyttäjän token headerista
      const access_token = req.headers['authorization']?.replace('Bearer ', '')
      
      console.log('🔍 User lookup debug:', {
        userId,
        hasAccessToken: !!access_token,
        accessTokenLength: access_token?.length,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey,
        usingAuth: !!(supabaseAnonKey && access_token),
        usingServiceRole: !!(supabaseServiceKey && !access_token)
      })
      
      // Luo Supabase client:
      // 1. Ensin yritetään anon key + käyttäjän token (RLS toimii tokenin perusteella)
      // 2. Jos token puuttuu, käytetään service role key:ta (ohittaa RLS:n)
      const supabase = createClient(
        supabaseUrl,
        (supabaseAnonKey && access_token) ? supabaseAnonKey : (supabaseServiceKey || supabaseAnonKey),
        (supabaseAnonKey && access_token) ? { global: { headers: { Authorization: `Bearer ${access_token}` } } } : undefined
      )
      
      // 1. Tarkista ensin org_members taulusta (kutsutut käyttäjät)
      console.log('🔍 Checking org_members table for auth_user_id:', userId)
      const { data: orgMember, error: orgError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('auth_user_id', userId)
        .maybeSingle()

      console.log('🔍 org_members query result:', { orgMember, orgError })

      if (!orgError && orgMember?.org_id) {
        // Käyttäjä on kutsuttu käyttäjä, hae organisaation tiedot
        console.log('🔍 Fetching org data for org_id:', orgMember.org_id)
        const { data: orgData, error: orgDataError } = await supabase
          .from('users')
          .select('id, company_name, icp_summary, contact_email')
          .eq('id', orgMember.org_id)
          .single()

        console.log('🔍 org data query result:', { orgData, orgDataError })

        if (!orgDataError && orgData) {
          userData = orgData
          publicUserId = orgData.id
          console.log('✅ Invited user found, using org_id:', { publicUserId, contact_email: userData.contact_email })
        } else {
          console.error('❌ Failed to fetch org data:', orgDataError)
        }
      } else {
        // 2. Jos ei löydy org_members taulusta, hae users taulusta
        console.log('🔍 Checking users table for auth_user_id:', userId)
        const { data, error } = await supabase
          .from('users')
          .select('id, company_name, icp_summary, contact_email')
          .eq('auth_user_id', userId)
          .maybeSingle()

        console.log('🔍 users query result:', { data, error })

        if (error) {
          console.error('❌ Error fetching user from users table:', error)
        } else if (data) {
          userData = data
          publicUserId = data.id // public.users.id
          console.log('✅ User found in users table:', { publicUserId, contact_email: userData.contact_email })
        } else {
          console.error('❌ User not found in org_members or users table:', { userId })
        }
      }
    }

    // Lähetä webhook N8N:ään
    const webhookUrl = process.env.N8N_11LABS_ICP_INTERVIEW_URL

    if (!webhookUrl) {
      console.warn('⚠️ N8N_11LABS_ICP_INTERVIEW_URL not configured, skipping webhook')
      return res.status(200).json({ 
        success: true, 
        message: 'Onboarding completed (webhook not configured)' 
      })
    }

    // Älä lähetä webhookia jos public.users.id ei löydy
    // EI käytetä auth.users.id fallbackina - aina public.users.id!
    if (!publicUserId) {
      console.error('❌ Cannot send webhook: public.users.id not found for auth_user_id:', userId)
      return res.status(400).json({ 
        error: 'Käyttäjää ei löytynyt',
        details: 'User not found in users or org_members table',
        auth_user_id: userId,
        conversation_id: conversationId
      })
    }

    const webhookPayload = {
      conversation_id: conversationId,
      user_id: publicUserId, // VAIN public.users.id, EI auth.users.id
      auth_user_id: userId, // Säilytetään myös auth.users.id referenssinä
      user_email: userData?.contact_email || null, // users taulussa on contact_email, ei email
      company_name: userData?.company_name || null,
      icp_data: icpData || null, // Lähetetään vain jos se tulee request body:sta, ei icp_summary:sta
      completed_at: new Date().toISOString(),
      source: 'onboarding_modal',
      ended_manually: !icpData // Tarkista onko keskustelu keskeytetty manuaalisesti
    }

    console.log('📋 Webhook payload prepared:', {
      conversation_id: webhookPayload.conversation_id,
      user_id: webhookPayload.user_id,
      auth_user_id: webhookPayload.auth_user_id,
      hasIcpData: !!webhookPayload.icp_data,
      ended_manually: webhookPayload.ended_manually
    })

    // Muodosta headerit
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Lisää x-api-key header jos N8N_SECRET_KEY on asetettu
    const n8nSecretKey = process.env.N8N_SECRET_KEY
    if (n8nSecretKey) {
      headers['x-api-key'] = n8nSecretKey
    }

    console.log('📤 Sending webhook to N8N:', {
      url: webhookUrl,
      user_id: webhookPayload.user_id,
      auth_user_id: webhookPayload.auth_user_id,
      hasIcpData: !!webhookPayload.icp_data,
      hasApiKey: !!n8nSecretKey,
      apiKeyLength: n8nSecretKey ? n8nSecretKey.length : 0,
      headers: Object.keys(headers),
      payload: JSON.stringify(webhookPayload, null, 2)
    })

    let responseData = {}
    let webhookSuccess = false

    try {
      const response = await axios.post(webhookUrl, webhookPayload, {
        headers: headers,
        timeout: 30000 // 30 sekuntia timeout
      })
      
      responseData = response.data || {}
      webhookSuccess = true
      console.log('✅ Webhook sent successfully:', {
        status: response.status,
        response: responseData
      })
    } catch (webhookError) {
      const isDevelopment = process.env.NODE_ENV === 'development'
      // Loggaa virhe yksityiskohtaisesti
      if (webhookError.response) {
        console.error('❌ Webhook failed - Server responded with error:', {
          status: webhookError.response.status,
          statusText: webhookError.response.statusText,
          data: webhookError.response.data,
          headers: JSON.stringify(webhookError.response.headers)
        })
        responseData = {
          error: 'Webhook server error',
          status: webhookError.response.status,
          ...(isDevelopment && { data: webhookError.response.data })
        }
      } else if (webhookError.request) {
        console.error('❌ Webhook failed - No response received:', {
          message: webhookError.message,
          code: webhookError.code,
          url: webhookUrl
        })
        responseData = {
          error: 'No response from webhook',
          ...(isDevelopment && { message: webhookError.message, code: webhookError.code })
        }
      } else {
        console.error('❌ Webhook failed:', {
          message: webhookError.message,
          stack: webhookError.stack
        })
        responseData = {
          error: 'Webhook request error',
          ...(isDevelopment && { message: webhookError.message })
        }
      }
      // Jatketaan vaikka webhook epäonnistui, mutta palautetaan virhe-info
    }

    const isDevelopment = process.env.NODE_ENV === 'development'
    return res.status(200).json({
      success: webhookSuccess,
      message: webhookSuccess ? 'Onboarding completed and webhook sent' : 'Onboarding completed but webhook failed',
      webhookResponse: responseData,
      ...(isDevelopment && { webhookUrl: webhookUrl }) // Debug: palautetaan URL vain developmentissa
    })

  } catch (error) {
    console.error('❌ Error in onboarding-completed:', error)
    const status = error.response?.status || 500
    const isDevelopment = process.env.NODE_ENV === 'development'
    const data = error.response?.data || { message: error.message }
    return res.status(status).json({ 
      error: 'Internal server error',
      status,
      ...(isDevelopment && { details: data })
    })
  }
}

