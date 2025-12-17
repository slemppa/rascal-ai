export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, phone } = req.body

    // Validoi inputit
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Nimi, email ja puhelinnumero vaaditaan' })
    }

    // Validoi email-muoto
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Virheellinen email-muoto' })
    }

    // Hae N8N webhook URL ympäristömuuttujasta
    const n8nWebhookUrl = process.env.N8N_LAND_CONTACT_URL

    if (!n8nWebhookUrl) {
      console.error('N8N_LAND_CONTACT_URL ympäristömuuttuja puuttuu')
      return res.status(500).json({ error: 'Palvelin konfiguraatio puuttuu' })
    }

    // Lähetä data N8N webhookiin
    const webhookResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        timestamp: new Date().toISOString(),
        source: 'rascal-ai-chatbot'
      })
    })

    if (!webhookResponse.ok) {
      console.error('N8N webhook vastaus:', webhookResponse.status, webhookResponse.statusText)
      throw new Error('N8N webhook vastaus epäonnistui')
    }

    // Palauta onnistunut vastaus
    res.status(200).json({ 
      success: true, 
      message: 'Yhteydenottopyyntö lähetetty onnistuneesti' 
    })

  } catch (error) {
    console.error('Contact API virhe:', error)
    res.status(500).json({ 
      error: 'Yhteydenottopyynnön lähetys epäonnistui. Yritä uudelleen.' 
    })
  }
} 