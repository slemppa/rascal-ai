import { withOrganization } from "../../_middleware/with-organization.js";
import { createClient } from "@supabase/supabase-js";
import logger from "../../_lib/logger.js";
import { sendToN8N } from "../../_lib/n8n-client.js";

async function handleNangoDisconnect(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { provider } = req.query;

    if (!provider) {
      return res.status(400).json({
        error: "Puuttuvat parametrit",
        details: "provider vaaditaan",
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

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error(
        "Missing required environment variables for Nango disconnect",
      );
      return res.status(500).json({ error: "Palvelimen asetukset puuttuvat" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingSecret, error: findError } = await supabaseAdmin
      .from("user_secrets")
      .select("id, metadata")
      .eq("user_id", orgId)
      .eq("secret_type", "nango_connection")
      .eq("is_active", true)
      .filter("metadata->>provider", "eq", provider)
      .maybeSingle();

    if (findError) {
      logger.error("Error finding Nango connection", {
        message: findError.message,
        code: findError.code,
      });
      return res.status(500).json({
        error: "Tietokantavirhe yhteyden haussa",
        details: findError.message,
      });
    }

    if (!existingSecret) {
      return res.status(404).json({
        error: "Yhteyttä ei löytynyt",
        details: `Provider ${provider} ei ole yhdistetty`,
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("user_secrets")
      .update({ is_active: false })
      .eq("id", existingSecret.id);

    if (deleteError) {
      logger.error("Error deactivating Nango connection", {
        message: deleteError.message,
        code: deleteError.code,
      });
      return res.status(500).json({
        error: "Tietokantavirhe yhteyden poistossa",
        details: deleteError.message,
      });
    }

    const n8nWebhookUrl = process.env.N8N_INTEGRATION_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        await sendToN8N(n8nWebhookUrl, {
          action: "nango_disconnected",
          provider: provider,
          customer_id: orgId,
          user_id: orgId,
          auth_user_id: authUserId,
          timestamp: new Date().toISOString(),
        }).catch((err) =>
          logger.warn("n8n webhook warning", { message: err.message }),
        );
      } catch (e) {
        logger.warn("n8n webhook error (non-critical)", { message: e.message });
      }
    }

    logger.info("Nango connection disconnected successfully", {
      orgId,
      provider,
    });

    return res.status(200).json({
      success: true,
      message: "Yhteys poistettu onnistuneesti",
    });
  } catch (error) {
    logger.error("Error in handleNangoDisconnect", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      error: "Sisäinen palvelinvirhe",
      details: error.message,
    });
  }
}

export default withOrganization(handleNangoDisconnect);
