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
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, company_name, icp_summary')
        .eq('auth_user_id', userId)
        .single()

      if (error || !data) {
        console.error('User haku epäonnistui:', error)
        return res.status(400).json({ 
          error: 'Käyttäjää ei löytynyt',
          details: error?.message || 'User not found'
        })
      }

      userData = data
      publicUserId = data.id // public.users.id
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

    const webhookPayload = {
      conversation_id: conversationId,
      user_id: publicUserId || userId, // Lähetä public.users.id, fallback auth.users.id jos ei löydy
      user_email: userData?.email,
      company_name: userData?.company_name,
      icp_data: icpData || (userData?.icp_summary ? JSON.parse(userData.icp_summary) : null),
      completed_at: new Date().toISOString(),
      source: 'onboarding_modal'
    }

    console.log('📤 Sending webhook to N8N:', webhookUrl)

    const response = await axios.post(webhookUrl, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_SECRET_KEY ? { 'x-api-key': process.env.N8N_SECRET_KEY } : {})
      }
    })
    
    const responseData = response.data || {}
    console.log('✅ Webhook sent successfully:', responseData)

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

