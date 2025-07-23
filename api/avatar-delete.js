import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST sallittu' })
  }
  const { companyId, avatarId } = req.body
  if (!companyId || !avatarId) {
    return res.status(400).json({ error: 'companyId ja avatarId vaaditaan' })
  }
  const n8nUrl = process.env.N8N_AVATAR_DELETE
  const apiKey = process.env.N8N_SECRET_KEY
  if (!n8nUrl || !apiKey) {
    return res.status(500).json({ error: 'Palvelimen asetukset puuttuvat (N8N_AVATAR_DELETE tai N8N_SECRET_KEY)'} )
  }
  try {
    const response = await axios.post(n8nUrl, { companyId, avatarId }, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })
    return res.status(200).json({ success: true, data: response.data })
  } catch (err) {
    return res.status(500).json({ error: 'Avatarin poisto epäonnistui', details: err?.response?.data || err.message })
  }
} 