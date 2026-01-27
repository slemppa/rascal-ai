import { withOrganization } from "../../_middleware/with-organization.js";
import { createClient } from "@supabase/supabase-js";
import logger from "../../_lib/logger.js";
import { sendToN8N } from "../../_lib/n8n-client.js";

async function handleSaveNangoConnection(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      integration_id,
      connection_id,
      provider,
      secret_type,
      secret_name,
    } = req.body;

    if (!connection_id || !provider || !secret_type || !secret_name) {
      return res.status(400).json({
        error: "Puuttuvat parametrit",
        details:
          "connection_id, provider, secret_type ja secret_name vaaditaan",
      });
    }

    const orgId = req.organization?.id;
    const authUserId = req.authUser?.id;

    if (!orgId || !authUserId) {
      return res
        .status(400)
        .json({ error: "Käyttäjän organisaatio ei löytynyt" });
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const encryptionKey = process.env.USER_SECRETS_ENCRYPTION_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !encryptionKey) {
      logger.error(
        "Missing required environment variables for Nango save-connection",
      );
      return res.status(500).json({ error: "Palvelimen asetukset puuttuvat" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error: secretError } = await supabaseAdmin.rpc(
      "store_user_secret",
      {
        p_user_id: orgId,
        p_secret_type: secret_type,
        p_secret_name: secret_name,
        p_plaintext_value: connection_id,
        p_encryption_key: encryptionKey,
        p_metadata: {
          provider: provider,
          integration_id: integration_id,
          auth_user_id: authUserId,
          connected_at: new Date().toISOString(),
          source: "nango",
        },
      },
    );

    if (secretError) {
      logger.error("Error storing Nango connection", {
        message: secretError.message,
        code: secretError.code,
      });
      return res.status(500).json({
        error: "Tietokantavirhe yhteyden tallennuksessa",
        details: secretError.message,
      });
    }

    const n8nWebhookUrl = process.env.N8N_INTEGRATION_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        const apiBaseUrl =
          process.env.APP_URL ||
          process.env.NEXT_PUBLIC_APP_URL ||
          "https://app.rascalai.fi";

        await sendToN8N(n8nWebhookUrl, {
          action: "nango_connected",
          integration_type: secret_type,
          integration_name: secret_name,
          provider: provider,
          customer_id: orgId,
          user_id: orgId,
          auth_user_id: authUserId,
          connection_id: connection_id,
          timestamp: new Date().toISOString(),
          get_secret_url: `${apiBaseUrl}/api/users/secrets-service`,
          get_secret_params: {
            secret_type: secret_type,
            secret_name: secret_name,
            user_id: orgId,
          },
        }).catch((err) =>
          logger.warn("n8n webhook warning", { message: err.message }),
        );
      } catch (e) {
        logger.warn("n8n webhook error (non-critical)", { message: e.message });
      }
    }

    logger.info("Nango connection saved successfully", {
      orgId,
      provider,
      integration_id,
    });

    return res.status(200).json({
      success: true,
      message: "Yhteys tallennettu onnistuneesti",
    });
  } catch (error) {
    logger.error("Error in handleSaveNangoConnection", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      error: "Sisäinen palvelinvirhe",
      details: error.message,
    });
  }
}

export default withOrganization(handleSaveNangoConnection);
