import { withOrganization } from '../../_middleware/with-organization.js'
import { sendToN8N } from '../../_lib/n8n-client.js'

// Webhook osoite N8N:ään (käytä env-muuttujaa tai oletusta)
const DEV_KNOWLEDGE_WEBHOOK_URL =
  process.env.DEV_KNOWLEDGE_WEBHOOK_URL ||
  'https://samikiias.app.n8n.cloud/webhook/vectorsupabase'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data: orgData } = req.organization
    const orgId = orgData?.id

    if (!orgId) {
      return res.status(400).json({ error: 'Organisaatiota ei löytynyt' })
    }

    // Jos tietokanta on jo olemassa, palauta se sellaisenaan
    if (orgData.vector_store_id) {
      return res.status(200).json({
        success: true,
        vector_store_id: orgData.vector_store_id,
        already_exists: true,
      })
    }

    // Pyydä N8N:ää luomaan tietokanta / vector store
    // Huom: response-shape riippuu workflowsta → poimitaan id usealla avaimella
    const n8nResp = await sendToN8N(DEV_KNOWLEDGE_WEBHOOK_URL, {
      action: 'create',
      orgId,
      userId: req.authUser?.id,
      companyId: orgData.company_id,
      companyName: orgData.company_name,
      requestedAt: new Date().toISOString(),
    })

    const createdId =
      n8nResp?.vector_store_id ||
      n8nResp?.vectorStoreId ||
      n8nResp?.id ||
      n8nResp?.data?.vector_store_id ||
      n8nResp?.data?.vectorStoreId ||
      n8nResp?.data?.id

    if (!createdId) {
      return res.status(500).json({
        error: 'Tietokannan luonti epäonnistui: ID puuttuu N8N-vastauksesta',
        details: n8nResp,
      })
    }

    // Tallenna organisaation users-riville
    const { error: updateError } = await req.supabase
      .from('users')
      .update({ vector_store_id: createdId })
      .eq('id', orgId)

    if (updateError) {
      return res.status(500).json({
        error: 'Tietokannan ID:n tallennus epäonnistui',
        details: updateError.message,
      })
    }

    return res.status(200).json({
      success: true,
      vector_store_id: createdId,
    })
  } catch (e) {
    return res.status(500).json({
      error: 'Virhe tietokannan luomisessa',
      details: e.message,
    })
  }
}

export default withOrganization(handler)

