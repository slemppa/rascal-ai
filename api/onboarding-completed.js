import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  // Vain POST-pyynnöt
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { conversationId, userId, icpData } = req.body

    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' })
    }

    console.log('📞 Onboarding conversation completed:', {
      conversationId,
      userId,
      hasIcpData: !!icpData
    })

    // Hae public.users.id käyttäen auth_user_id:tä (sama logiikka kuin muissa endpointeissa)
    let userData = null
    let publicUserId = null
    
    if (userId && supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // 1. Yritä hakea normaali käyttäjä users taulusta
      const { data, error } = await supabase
        .from('users')
        .select('id, email, company_name, icp_summary')
        .eq('auth_user_id', userId)
        .single()

      if (error || !data) {
        // 2. Jos ei löydy, tarkista onko kutsuttu käyttäjä (org_members)
        console.warn('⚠️ User not found in users table, checking org_members:', error?.message || 'User not found')
        
        const { data: orgMember, error: orgError } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('auth_user_id', userId)
          .maybeSingle()

        if (!orgError && orgMember?.org_id) {
          // Käyttäjä on kutsuttu käyttäjä, hae organisaation tiedot
          const { data: orgData, error: orgDataError } = await supabase
            .from('users')
            .select('id, email, company_name, icp_summary')
            .eq('id', orgMember.org_id)
            .single()

          if (!orgDataError && orgData) {
            userData = orgData
            publicUserId = orgData.id
            console.log('✅ Invited user found, using org_id:', { publicUserId, email: userData.email })
          } else {
            console.error('❌ Failed to fetch org data:', orgDataError)
          }
        } else {
          console.error('❌ User not found in users or org_members:', { userId, orgError })
        }
      } else {
        userData = data
        publicUserId = data.id // public.users.id
        console.log('✅ User found:', { publicUserId, email: userData.email })
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

    // Älä lähetä user_id:ä jos publicUserId ei löydy (ei käytetä auth.users.id fallbackina)
    if (!publicUserId) {
      console.error('❌ Cannot send webhook: public.users.id not found for auth_user_id:', userId)
      return res.status(400).json({ 
        error: 'Käyttäjää ei löytynyt',
        details: 'User not found in users or org_members table'
      })
    }

    const webhookPayload = {
      conversation_id: conversationId,
      user_id: publicUserId, // Vain public.users.id, ei auth.users.id
      auth_user_id: userId, // Säilytetään myös auth.users.id referenssinä
      user_email: userData?.email || null,
      company_name: userData?.company_name || null,
      icp_data: icpData || (userData?.icp_summary ? JSON.parse(userData.icp_summary) : null),
      completed_at: new Date().toISOString(),
      source: 'onboarding_modal'
    }

    console.log('📤 Sending webhook to N8N:', {
      url: webhookUrl,
      user_id: webhookPayload.user_id,
      hasIcpData: !!webhookPayload.icp_data,
      hasApiKey: !!process.env.N8N_SECRET_KEY
    })

    try {
      const response = await axios.post(webhookUrl, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.N8N_SECRET_KEY ? { 'x-api-key': process.env.N8N_SECRET_KEY } : {})
        },
        timeout: 30000 // 30 sekuntia timeout
      })
      
      const responseData = response.data || {}
      console.log('✅ Webhook sent successfully:', {
        status: response.status,
        response: responseData
      })
    } catch (webhookError) {
      // Loggaa virhe yksityiskohtaisesti, mutta älä palauta virhettä käyttäjälle
      if (webhookError.response) {
        console.error('❌ Webhook failed - Server responded with error:', {
          status: webhookError.response.status,
          data: webhookError.response.data,
          headers: webhookError.response.headers
        })
      } else if (webhookError.request) {
        console.error('❌ Webhook failed - No response received:', {
          message: webhookError.message,
          code: webhookError.code
        })
      } else {
        console.error('❌ Webhook failed:', webhookError.message)
      }
      // Jatketaan vaikka webhook epäonnistui
    }

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed and webhook sent',
      webhookResponse: responseData
    })

  } catch (error) {
    console.error('❌ Error in onboarding-completed:', error)
    const status = error.response?.status || 500
    const data = error.response?.data || { message: error.message }
    return res.status(status).json({ 
      error: 'Internal server error',
      status,
      details: data
    })
  }
}

