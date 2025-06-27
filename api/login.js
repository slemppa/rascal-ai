const N8N_LOGIN_URL = process.env.N8N_LOGIN_URL || 'https://samikiias.app.n8n.cloud/webhook-test/06ae4c0b-1f13-4688-afad-9bf11d51fd0f'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const response = await fetch(N8N_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_SECRET_KEY
      },
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: 'Virhe kirjautumisessa' })
  }
} 