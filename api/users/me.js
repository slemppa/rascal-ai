import { withOrganization } from '../middleware/with-organization.js'

/**
 * GET /api/users/me
 * Palauttaa kirjautuneen käyttäjän tiedot
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // withOrganization on jo tarkistanut autentikaation ja hakenut organisaatiotiedot
    // req.organization sisältää:
    // - id: organisaation ID (public.users.id)
    // - role: käyttäjän rooli organisaatiossa
    // - data: täydelliset organisaation tiedot users-taulusta

    const { data: orgData } = req.organization

    // Palautetaan turvallisesti vain tarvittavat kentät
    const userData = {
      id: orgData.id,
      auth_user_id: req.authUser.id,
      email: req.authUser.email,
      company_id: orgData.company_id,
      company_name: orgData.company_name,
      role: req.organization.role,
      logo_url: orgData.logo_url,
      voice_id: orgData.voice_id,
      contact_email: orgData.contact_email,
      contact_person: orgData.contact_person,
      vapi_inbound_assistant_id: orgData.vapi_inbound_assistant_id,
      created_at: orgData.created_at,
      updated_at: orgData.updated_at,
    }

    return res.status(200).json(userData)
  } catch (error) {
    console.error('Error in /api/users/me:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}

export default withOrganization(handler)
