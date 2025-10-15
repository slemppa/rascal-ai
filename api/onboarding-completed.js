import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL 
  || process.env.VITE_SUPABASE_URL 
  || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY 
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

    // Hae käyttäjän tiedot Supabasesta
    let userData = null
    if (userId && supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, company_name, icp_summary')
        .eq('auth_user_id', userId)
        .single()

      if (!error && data) {
        userData = data
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

    const webhookPayload = {
      conversation_id: conversationId,
      user_id: userId,
      user_email: userData?.email,
      company_name: userData?.company_name,
      icp_data: icpData || (userData?.icp_summary ? JSON.parse(userData.icp_summary) : null),
      completed_at: new Date().toISOString(),
      source: 'onboarding_modal'
    }

    console.log('📤 Sending webhook to N8N:', webhookUrl)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_SECRET_KEY || ''
      },
      body: JSON.stringify(webhookPayload)
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json().catch(() => ({}))
    
    console.log('✅ Webhook sent successfully:', responseData)

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed and webhook sent',
      webhookResponse: responseData
    })

  } catch (error) {
    console.error('❌ Error in onboarding-completed:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}

