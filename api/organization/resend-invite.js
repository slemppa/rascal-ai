// api/organization/resend-invite.js - Lähetä organisaatiokutsu uudelleen
import { withOrganization } from '../_middleware/with-organization.js'
import { sendToN8N } from '../_lib/n8n-client.js'

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const orgId = req.organization.id
    const userRole = req.organization.role
    const { auth_user_id } = req.body

    // Vain owner ja admin voivat lähettää kutsuja uudelleen
    if (!['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Admin or owner access required' })
    }

    if (!auth_user_id) {
      return res.status(400).json({ error: 'auth_user_id is required' })
    }

    // Tarkista että käyttäjä on organisaation jäsen
    const { data: member, error: memberError } = await req.supabase
      .from('org_members')
      .select('*, email, role')
      .eq('org_id', orgId)
      .eq('auth_user_id', auth_user_id)
      .single()

    if (memberError || !member) {
      return res.status(404).json({ error: 'Member not found in this organization' })
    }

    // Hae organisaation tiedot
    const { data: orgData } = await req.supabase
      .from('users')
      .select('company_name, contact_person')
      .eq('id', orgId)
      .single()

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

    // Luo notifikaatio sovelluksen sisälle
    if (supabaseServiceKey && supabaseUrl) {
      const { createClient } = await import('@supabase/supabase-js')
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Poista vanhat samanlaiset notifikaatiot (vältetään duplikaatit)
      await serviceClient
        .from('notifications')
        .delete()
        .eq('user_id', auth_user_id)
        .eq('type', 'organization_invite')
        .eq('data->org_id', orgId)

      // Luo uusi notifikaatio
      await serviceClient
        .from('notifications')
        .insert({
          user_id: auth_user_id,
          type: 'organization_invite',
          title: 'Sinut on kutsuttu organisaatioon',
          message: `${orgData?.contact_person || 'Organisaation järjestelmänvalvoja'} on kutsunut sinut organisaatioon ${orgData?.company_name || 'Rascal AI'} roolissa: ${member.role === 'admin' ? 'Admin' : member.role === 'owner' ? 'Omistaja' : 'Jäsen'}.`,
          data: {
            org_id: orgId,
            role: member.role,
            org_name: orgData?.company_name
          }
        })
      
      console.log('Notification created for resent organization invite')
    }

    // Lähetä sähköposti N8N:n kautta
    const n8nWebhookUrl = process.env.N8N_ORGANIZATION_INVITE_URL
    
    if (n8nWebhookUrl) {
      const webhookPayload = {
        action: 'organization_invite',
        email: member.email,
        org_id: orgId,
        org_name: orgData?.company_name || 'Rascal AI',
        role: member.role,
        role_name: member.role === 'admin' ? 'Admin' : member.role === 'owner' ? 'Omistaja' : 'Jäsen',
        invited_by: orgData?.contact_person || 'Organisaation järjestelmänvalvoja',
        app_url: appUrl,
        timestamp: new Date().toISOString(),
        resend: true
      }

      try {
        await sendToN8N(n8nWebhookUrl, webhookPayload)
        console.log('Organization invite resent via N8N webhook')
      } catch (webhookError) {
        console.error('Error sending N8N webhook:', webhookError)
        // Jatketaan silti, notifikaatio on jo luotu
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Kutsu lähetetty uudelleen'
    })

  } catch (error) {
    console.error('resend-invite error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)





