import { createClient } from '@supabase/supabase-js'
import { sendToN8N } from '../_lib/n8n-client.js'

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

    // Tarkista että conversationId on olemassa ja ei ole tyhjä
    if (!conversationId || (typeof conversationId === 'string' && conversationId.trim() === '')) {
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
      return res.status(400).json({ 
        error: 'userId is required',
        received: {
          conversationId: conversationId,
          userId: userId,
          hasBody: !!req.body
        }
      })
    }

    // Hae public.users.id käyttäen auth_user_id:tä
    // Sama logiikka kuin analytics.js ja with-organization.js:
    // 1. Tarkista ensin org_members taulusta (kutsutut käyttäjät)
    // 2. Jos ei löydy, hae users taulusta auth_user_id:n perusteella
    let userData = null
    let publicUserId = null
    
    if (userId && supabaseUrl && (supabaseAnonKey || supabaseServiceKey)) {
      // Hae käyttäjän token headerista
      const access_token = req.headers['authorization']?.replace('Bearer ', '')
      
      // Luo Supabase client:
      // 1. Ensin yritetään anon key + käyttäjän token (RLS toimii tokenin perusteella)
      // 2. Jos token puuttuu, käytetään service role key:ta (ohittaa RLS:n)
      const supabase = createClient(
        supabaseUrl,
        (supabaseAnonKey && access_token) ? supabaseAnonKey : (supabaseServiceKey || supabaseAnonKey),
        (supabaseAnonKey && access_token) ? { global: { headers: { Authorization: `Bearer ${access_token}` } } } : undefined
      )
      
      // 1. Tarkista ensin org_members taulusta (kutsutut käyttäjät)
      const { data: orgMember, error: orgError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('auth_user_id', userId)
        .maybeSingle()

      if (!orgError && orgMember?.org_id) {
        // Käyttäjä on kutsuttu käyttäjä, hae organisaation tiedot
        const { data: orgData, error: orgDataError } = await supabase
          .from('users')
          .select('id, company_name, icp_summary, contact_email')
          .eq('id', orgMember.org_id)
          .single()

        if (!orgDataError && orgData) {
          userData = orgData
          publicUserId = orgData.id
        }
      } else {
        // 2. Jos ei löydy org_members taulusta, hae users taulusta
        const { data, error } = await supabase
          .from('users')
          .select('id, company_name, icp_summary, contact_email')
          .eq('auth_user_id', userId)
          .maybeSingle()

        if (!error && data) {
          userData = data
          publicUserId = data.id // public.users.id
        }
      }
    }

    // Lähetä webhook N8N:ään
    const webhookUrl = process.env.N8N_11LABS_ICP_INTERVIEW_URL

    if (!webhookUrl) {
      return res.status(200).json({ 
        success: true, 
        message: 'Onboarding completed (webhook not configured)' 
      })
    }

    // Älä lähetä webhookia jos public.users.id ei löydy
    // EI käytetä auth.users.id fallbackina - aina public.users.id!
    if (!publicUserId) {
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

    let responseData = {}
    let webhookSuccess = false

    try {
      responseData = await sendToN8N(webhookUrl, webhookPayload)
      webhookSuccess = true
    } catch (webhookError) {
      const isDevelopment = process.env.NODE_ENV === 'development'
      responseData = {
        error: 'Webhook request error',
        ...(isDevelopment && { message: webhookError.message })
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

