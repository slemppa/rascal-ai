import { VercelKV } from '@vercel/kv'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Sähköpostiosoite vaaditaan' })
    }

    // Tässä toteutuksessa käytämme Vercel KV:tä, mutta tuotannossa
    // käytettäisiin oikeaa tietokantaa
    const kv = new VercelKV({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })

    // Haetaan käyttäjän tiedot
    const userData = await kv.get(`user:${email}`)
    
    if (!userData) {
      return res.status(404).json({ error: 'Käyttäjää ei löytynyt' })
    }

    // Muodostetaan GDPR-yhteensopiva vastaus
    const gdprData = {
      personalData: {
        email: userData.email,
        name: userData.name || null,
        company: userData.company || null,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin,
      },
      usageData: {
        loginCount: userData.loginCount || 0,
        lastActivity: userData.lastActivity,
        preferences: userData.preferences || {},
      },
      technicalData: {
        ipAddresses: userData.ipAddresses || [],
        userAgents: userData.userAgents || [],
        cookieConsent: userData.cookieConsent,
        cookieConsentDate: userData.cookieConsentDate,
      }
    }

    // Logitetaan pyyntö
    await kv.set(`gdpr_request:${email}:${Date.now()}`, {
      timestamp: new Date().toISOString(),
      type: 'data_request',
      status: 'completed'
    })

    res.status(200).json({
      success: true,
      message: 'Henkilötiedot haettu onnistuneesti',
      data: gdprData,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })

  } catch (error) {
    console.error('GDPR data request error:', error)
    res.status(500).json({ 
      error: 'Virhe henkilötietojen haussa',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 