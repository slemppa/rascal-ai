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

    // Hae käyttäjän oma rivi users-taulusta, jotta saadaan globaali rooli/company_id
    // (esim. koko sovelluksen admin tai moderator)
    let effectiveRole = req.organization.role
    let effectiveCompanyId = orgData.company_id

    try {
      const { data: accountRow, error: accountError } = await req.supabase
        .from('users')
        .select('role, company_id')
        .eq('auth_user_id', req.authUser.id)
        .maybeSingle()

      if (!accountError && accountRow) {
        // Jos käyttäjä on globaali admin (role = 'admin' tai company_id = 1),
        // yliajetaan rooli adminiksi, jotta protected reitit toimivat oikein
        if (accountRow.role === 'admin' || accountRow.company_id === 1) {
          effectiveRole = 'admin'
        } else if (accountRow.role === 'moderator') {
          // Globaali moderaattori
          effectiveRole = 'moderator'
        }

        // Käytä company_id:tä käyttäjän riviltä jos saatavilla
        if (accountRow.company_id != null) {
          effectiveCompanyId = accountRow.company_id
        }
      }
    } catch (e) {
      console.error('Error fetching account row in /api/users/me:', e)
      // Jatketaan silti org-tason roolilla ja company_id:llä
    }

    // Palautetaan turvallisesti vain tarvittavat kentät
    const userData = {
      id: orgData.id,
      auth_user_id: req.authUser.id,
      email: req.authUser.email,
      company_id: effectiveCompanyId,
      company_name: orgData.company_name,
      role: effectiveRole,
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
