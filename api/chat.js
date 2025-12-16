import axios from 'axios'
import { withOrganization } from './middleware/with-organization'

// Yksinkertainen in-memory duplikaattisuojus viesteille
// Säilytetään viimeisimmät clientMessageId:t lyhyen aikaa
const RECENT_IDS = new Map() // id -> timestamp
const WINDOW_MS = 2 * 60 * 1000 // 2 minuuttia

function isDuplicateAndMark(id) {
  const now = Date.now()
  // Siivous
  for (const [key, ts] of RECENT_IDS) {
    if (now - ts > WINDOW_MS) RECENT_IDS.delete(key)
  }
  if (!id) return false
  if (RECENT_IDS.has(id)) return true
  RECENT_IDS.set(id, now)
  return false
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authUser = req.authUser
  if (!authUser) {
    return res.status(401).json({ error: 'Käyttäjä ei ole kirjautunut' })
  }

  const N8N_CHAT_API_URL = process.env.N8N_CHAT_API_URL
  const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY
  if (!N8N_CHAT_API_URL) {
    return res.status(500).json({ error: 'N8N_CHAT_API_URL not set' })
  }

  try {
    // Duplikaattisuojus: jos sama clientMessageId on jo käsitelty äskettäin, palautetaan 200 heti
    const clientMessageId = req.body?.clientMessageId
    if (isDuplicateAndMark(clientMessageId)) {
      return res.status(200).json({ duplicated: true })
    }

    const response = await axios.post(N8N_CHAT_API_URL, req.body, {
      headers: N8N_SECRET_KEY ? { 'x-api-key': N8N_SECRET_KEY } : {}
    })
    return res.status(200).json(response.data)
  } catch (error) {
    const status = error.response?.status || 500
    const data = error.response?.data || { message: error.message }
    // Palauta JSON-muotoinen virheviesti, jotta UI pystyy näyttämään sen
    return res.status(status).json({ error: 'Chat proxy error', status, details: data })
  }
}

export default withOrganization(handler)