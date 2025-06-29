const N8N_DELETE_FILES_URL = process.env.N8N_DELETE_FILES_URL || 'https://samikiias.app.n8n.cloud/webhook/ff033a1e-3a05-42dc-8079-dc3a1fb5ca53'
const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST sallittu' });
  }

  const { assistantId, companyId, fileId } = req.body;
  if (!assistantId || !companyId || !fileId) {
    return res.status(400).json({ error: 'assistantId, companyId ja fileId vaaditaan' });
  }

  try {
    if (!N8N_DELETE_FILES_URL) {
      console.error('N8N_DELETE_FILES_URL puuttuu')
      return res.status(500).json({ error: 'Webhook URL ei ole konfiguroitu' })
    }

    if (!N8N_SECRET_KEY) {
      console.error('N8N_SECRET_KEY puuttuu')
      return res.status(500).json({ error: 'API-avain ei ole konfiguroitu' })
    }

    console.log('Kutsu N8N delete-files webhookia:', N8N_DELETE_FILES_URL)
    console.log('Delete payload:', { assistantId, companyId, fileId })

    const response = await fetch(N8N_DELETE_FILES_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': N8N_SECRET_KEY
       },
      body: JSON.stringify({
        action: 'delete',
        assistantId,
        companyId,
        fileId
      })
    });

    if (!response.ok) {
      console.error('N8N webhook vastasi virheellä:', response.status, response.statusText)
      return res.status(response.status).json({ 
        error: 'Webhook-virhe', 
        status: response.status,
        statusText: response.statusText
      })
    }

    const data = await response.json()
    console.log('N8N delete-files vastaus:', data)
    return res.status(response.status).json(data)
  } catch (e) {
    console.error('Virhe delete-files endpointissa:', e)
    return res.status(500).json({ error: 'Tiedoston poisto epäonnistui', details: e.message });
  }
} 