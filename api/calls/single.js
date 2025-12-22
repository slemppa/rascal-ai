import { createClient } from '@supabase/supabase-js'
import logger from '../lib/logger.js'
import { sendToN8N } from '../lib/n8n-client.js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey
  })
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  // Vain POST-metodit sallittu
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST-metodit sallittu' })
  }

  try {
    const { phoneNumber, name, callType, callTypeId, script, voice, voiceId, userId, sms_first, sms_after_call, sms_missed_call } = req.body

    // Validointi
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nimi on pakollinen' })
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ error: 'Puhelinnumero on pakollinen' })
    }

    if (!callType) {
      return res.status(400).json({ error: 'Puhelun tyyppi on pakollinen' })
    }

    if (!callTypeId) {
      return res.status(400).json({ error: 'Puhelun tyypin tunniste on pakollinen' })
    }

    if (!script || !script.trim()) {
      return res.status(400).json({ error: 'Skripti on pakollinen' })
    }

    // Käytä voiceId:tä jos saatavilla, muuten voice:tä
    const voiceToUse = voiceId || voice
    if (!voiceToUse) {
      return res.status(400).json({ error: 'Ääni on pakollinen' })
    }



    // Käytä userId:tä suoraan (auth_user_id)
    const publicUserId = userId

    // N8N webhook URL ympäristömuuttujista
    const webhookUrl = process.env.N8N_SINGLE_CALL
    
    if (!webhookUrl) {
      logger.error('N8N_SINGLE_CALL ympäristömuuttuja puuttuu')
      return res.status(500).json({ error: 'Palvelun konfiguraatio puuttuu' })
    }

    // Lähetä data N8N:ään HMAC-allekirjoituksella
    const payload = {
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      callType,
      callTypeId,
      script: script.trim(),
      voice_id: voiceToUse,
      userId: publicUserId,
      sms_first: Boolean(sms_first) === true,
      sms_after_call: Boolean(sms_after_call) === true,
      sms_missed_call: Boolean(sms_missed_call) === true,
      timestamp: new Date().toISOString(),
      source: 'rascal-ai-dashboard'
    }

    let result
    try {
      result = await sendToN8N(webhookUrl, payload)
    } catch (error) {
      console.error('N8N webhook epäonnistui:', error)
      
      // Tarkista onko kyseessä 404 virhe (webhook ei rekisteröity)
      if (error.message && error.message.includes('404')) {
        return res.status(500).json({ 
          error: 'Puhelun käynnistys ei onnistu - N8N workflow ei ole aktiivinen',
          details: 'Webhook "single-call" ei ole rekisteröity N8N:ssä. Tarkista että workflow on aktiivinen.'
        })
      }
      
      return res.status(500).json({ 
        error: 'Puhelun käynnistys epäonnistui',
        details: error.message || 'N8N webhook virhe'
      })
    }

    // Palauta onnistumisviesti
    res.status(200).json({
      success: true,
      message: `Puhelu henkilölle ${name.trim()} (${phoneNumber.trim()}) käynnistetty onnistuneesti`,
      callId: result.callId || null,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      callType,
      callTypeId,
      voice: voiceToUse,
      timestamp: payload.timestamp
    })

  } catch (error) {
    logger.error('Single call API virhe:', error)
    res.status(500).json({ 
      error: 'Palvelinvirhe puhelun käynnistyksessä',
      details: error.message 
    })
  }
} 