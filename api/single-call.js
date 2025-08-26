import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

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
    const { phoneNumber, name, callType, callTypeId, script, voice, voiceId, userId, sms_first } = req.body

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

    // N8N webhook URL ja API key ympäristömuuttujista
    const webhookUrl = process.env.N8N_SINGLE_CALL
    const secretKey = process.env.N8N_SECRET_KEY
    
    if (!webhookUrl) {
      console.error('N8N_SINGLE_CALL ympäristömuuttuja puuttuu')
      return res.status(500).json({ error: 'Palvelun konfiguraatio puuttuu' })
    }

    if (!secretKey) {
      console.error('N8N_SECRET_KEY ympäristömuuttuja puuttuu')
      return res.status(500).json({ error: 'API-avain puuttuu' })
    }

    // Lähetä data N8N:ään
    const payload = {
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      callType,
      callTypeId,
      script: script.trim(),
      voice_id: voiceToUse,
      userId: publicUserId,
      sms_first: Boolean(sms_first) === true,
      timestamp: new Date().toISOString(),
      source: 'rascal-ai-dashboard'
    }



    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': secretKey
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('N8N webhook epäonnistui:', response.status, errorText)
      
      // Tarkista onko kyseessä 404 virhe (webhook ei rekisteröity)
      if (response.status === 404) {
        return res.status(500).json({ 
          error: 'Puhelun käynnistys ei onnistu - N8N workflow ei ole aktiivinen',
          details: 'Webhook "single-call" ei ole rekisteröity N8N:ssä. Tarkista että workflow on aktiivinen.'
        })
      }
      
      return res.status(500).json({ 
        error: 'Puhelun käynnistys epäonnistui',
        details: `HTTP ${response.status}: ${errorText}`
      })
    }

    const result = await response.json()

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
    console.error('Single call API virhe:', error)
    res.status(500).json({ 
      error: 'Palvelinvirhe puhelun käynnistyksessä',
      details: error.message 
    })
  }
} 