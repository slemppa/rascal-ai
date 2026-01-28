import { sendToN8N } from "../_lib/n8n-client.js";
import { withOrganization } from "../_middleware/with-organization.js";

async function handler(req, res) {
  // Vain POST-pyynnöt
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { conversationId, icpData } = req.body;

    // Tarkista että conversationId on olemassa ja ei ole tyhjä
    if (
      !conversationId ||
      (typeof conversationId === "string" && conversationId.trim() === "")
    ) {
      return res.status(400).json({
        error: "conversationId is required",
        received: {
          conversationId: conversationId,
          hasBody: !!req.body,
          bodyType: typeof req.body,
        },
      });
    }

    // Middleware varmistaa että req.organization ja req.authUser ovat asetettu
    const publicUserId = req.organization.id;
    const userData = req.organization.data;
    const authUserId = req.authUser.id;

    // Lähetä webhook N8N:ään
    const webhookUrl = process.env.N8N_11LABS_ICP_INTERVIEW_URL;

    if (!webhookUrl) {
      return res.status(200).json({
        success: true,
        message: "Onboarding completed (webhook not configured)",
      });
    }

    const webhookPayload = {
      conversation_id: conversationId,
      user_id: publicUserId, // public.users.id (organisaation id)
      auth_user_id: authUserId, // auth.users.id (kirjautuneen käyttäjän id)
      user_email: userData?.contact_email || null,
      company_name: userData?.company_name || null,
      icp_data: icpData || null,
      completed_at: new Date().toISOString(),
      source: "onboarding_modal",
      ended_manually: !icpData,
    };

    let responseData = {};
    let webhookSuccess = false;

    try {
      responseData = await sendToN8N(webhookUrl, webhookPayload);
      webhookSuccess = true;
    } catch (webhookError) {
      const isDevelopment = process.env.NODE_ENV === "development";
      responseData = {
        error: "Webhook request error",
        ...(isDevelopment && { message: webhookError.message }),
      };
      // Jatketaan vaikka webhook epäonnistui, mutta palautetaan virhe-info
    }

    const isDevelopment = process.env.NODE_ENV === "development";
    return res.status(200).json({
      success: webhookSuccess,
      message: webhookSuccess
        ? "Onboarding completed and webhook sent"
        : "Onboarding completed but webhook failed",
      webhookResponse: responseData,
      ...(isDevelopment && { webhookUrl: webhookUrl }), // Debug: palautetaan URL vain developmentissa
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const isDevelopment = process.env.NODE_ENV === "development";
    const data = error.response?.data || { message: error.message };
    return res.status(status).json({
      error: "Internal server error",
      status,
      ...(isDevelopment && { details: data }),
    });
  }
}

export default withOrganization(handler);
