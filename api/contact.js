export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, company, subject, message } = req.body

    // Validointi
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Puuttuvia kenttiä' })
    }

    // Email-validointi
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Virheellinen sähköpostiosoite' })
    }

    // Lähetä data Make.com webhookille
    const webhookUrl = process.env.MAKE_WEBHOOK_URL
    const secretKey = process.env.N8N_SECRET_KEY
    
    if (!webhookUrl) {
      console.error('Make.com webhook URL puuttuu')
      return res.status(500).json({ error: 'Webhook konfiguraatio puuttuu' })
    }

    const webhookData = {
      name,
      email,
      company: company || '',
      subject,
      message,
      timestamp: new Date().toISOString(),
      source: 'Rascal AI Contact Form'
    }

    const headers = {
      'Content-Type': 'application/json',
    }

    // Lisää x-api-key header jos secret key on määritelty
    if (secretKey) {
      headers['x-make-apikey'] = secretKey
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(webhookData)
    })

    if (!webhookResponse.ok) {
      throw new Error(`Webhook error: ${webhookResponse.status}`)
    }

    res.status(200).json({ success: true, message: 'Viesti lähetetty onnistuneesti' })

  } catch (error) {
    console.error('Contact form error:', error)
    res.status(500).json({ error: 'Virhe viestin lähetyksessä' })
  }
} 