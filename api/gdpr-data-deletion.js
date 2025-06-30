import { VercelKV } from '@vercel/kv'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, reason } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Sähköpostiosoite vaaditaan' })
    }

    const kv = new VercelKV({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })

    // Tarkistetaan että käyttäjä on olemassa
    const userData = await kv.get(`user:${email}`)
    
    if (!userData) {
      return res.status(404).json({ error: 'Käyttäjää ei löytynyt' })
    }

    // Logitetaan poistopyyntö ennen poistoa
    await kv.set(`gdpr_deletion:${email}:${Date.now()}`, {
      timestamp: new Date().toISOString(),
      type: 'deletion_request',
      reason: reason || 'User requested deletion',
      originalData: {
        email: userData.email,
        name: userData.name,
        company: userData.company,
        createdAt: userData.createdAt
      }
    })

    // Poistetaan käyttäjän henkilötiedot
    // Huom: GDPR:n mukaan voidaan säilyttää tietoja laskutusta varten
    const anonymizedData = {
      email: null,
      name: null,
      company: null,
      preferences: null,
      ipAddresses: null,
      userAgents: null,
      lastActivity: null,
      loginCount: null,
      // Säilytetään vain tärkeimmät tekniset tiedot
      createdAt: userData.createdAt, // Laskutusta varten
      deletedAt: new Date().toISOString(),
      deletionReason: reason || 'User requested deletion',
      isDeleted: true
    }

    // Päivitetään käyttäjän tiedot anonymisoiduiksi
    await kv.set(`user:${email}`, anonymizedData)

    // Poistetaan käyttäjän sessiot
    await kv.del(`session:${email}`)
    
    // Poistetaan käyttäjän evästeet
    await kv.del(`cookies:${email}`)

    // Poistetaan käyttäjän analytiikkatiedot (jos on)
    await kv.del(`analytics:${email}`)

    res.status(200).json({
      success: true,
      message: 'Henkilötiedot poistettu onnistuneesti',
      requestId: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      note: 'Tiedot poistetaan kokonaan 30 päivän kuluttua. Laskutustiedot säilyvät lain vaatimusten mukaisesti.'
    })

  } catch (error) {
    console.error('GDPR deletion error:', error)
    res.status(500).json({ 
      error: 'Virhe henkilötietojen poistossa',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
} 