const N8N_SET_PASSWORD_URL = process.env.N8N_SET_PASSWORD_URL || 'https://samikiias.app.n8n.cloud/webhook/set-password'

console.log('Käytettävä webhook-URL:', N8N_SET_PASSWORD_URL)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  try {
    const { email, password } = req.body
    
    // Validoi syötteet
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sähköposti ja salasana vaaditaan' 
      })
    }
    
    // Validoi sähköpostin muoto
    if (typeof email !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Sähköpostin pitää olla merkkijono' 
      })
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sähköpostin muoto on virheellinen' 
      })
    }
    
    // Validoi salasanan
    if (typeof password !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Salasanan pitää olla merkkijono' 
      })
    }
    
    if (password.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Salasanan tulee olla vähintään 10 merkkiä pitkä (Supabase vaatimus)' 
      })
    }
    
    if (password.length > 128) {
      return res.status(400).json({ 
        success: false, 
        message: 'Salasana on liian pitkä (maksimi 128 merkkiä)' 
      })
    }
    
    // Vapaaehtoinen: vahvempi salasanan validointi (iso kirjain, numero, erikoismerkki)
    // Kommentoitu pois, koska se voi olla liian rajoittava joillekin käyttäjille
    // Jos haluat aktivoida tämän, poista kommentit alla olevasta koodista:
    /*
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Salasanan tulee sisältää vähintään yksi iso kirjain, yksi numero ja yksi erikoismerkki (@$!%*?&)' 
      })
    }
    */

    console.log('Lähetetään N8N:ään:', { email, action: 'set-password', hasPassword: !!password })
    // Älä koskaan logita salasanoja selkokielisessä muodossa
    // Lähetä pyyntö N8N:ään
    const response = await fetch(N8N_SET_PASSWORD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_SECRET_KEY
      },
      body: JSON.stringify({
        email,
        password,
        action: 'set-password'
      })
    })

    const text = await response.text()
    console.log('N8N palautti vastauksen (tekstinä):', text)
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      return res.status(500).json({ 
        success: false, 
        message: 'N8N palautti virheellisen vastauksen',
        raw: text 
      })
    }
    
    if (response.ok && data.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Salasana asetettu onnistuneesti' 
      })
    } else {
      res.status(400).json({ 
        success: false, 
        message: data.message || 'Salasanan asetus epäonnistui' 
      })
    }
  } catch (error) {
    console.error('Set password error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Virhe palvelinyhteydessä' 
    })
  }
} 