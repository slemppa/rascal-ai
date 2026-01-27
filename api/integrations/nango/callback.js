import { createClient } from "@supabase/supabase-js";
import logger from "../../_lib/logger.js";
import { sendToN8N } from "../../_lib/n8n-client.js";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(req, res) {
  const sendResponse = (status, message, data = {}) => {
    const targetOrigin =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://app.rascalai.fi";
    const payload = {
      type: "NANGO_AUTH_RESULT",
      status,
      message,
      ...data,
    };
    const safePayload = JSON.stringify(payload).replace(/</g, "\\u003c");
    const safeMessageHtml = escapeHtml(message);

    const html = `
      <html>
        <body>
          <script>
            (function() {
              try {
                var payload = ${safePayload};
                if (window.opener) {
                  window.opener.postMessage(payload, '${targetOrigin}');
                }
              } catch (e) {
                console.error('Failed to postMessage auth result', e);
              }
              window.close();
            })();
          </script>
          <div style="font-family: sans-serif; text-align: center; padding: 20px;">
            <h2>${status === "success" ? "Yhdistetty!" : "Virhe"}</h2>
            <p>${safeMessageHtml}</p>
            <p>Ikkuna sulkeutuu automaattisesti...</p>
          </div>
        </body>
      </html>
    `;
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(html);
  };

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      connectionId,
      providerConfigKey,
      error: nangoError,
      errorType,
      errorDescription,
    } = req.query;

    if (nangoError || errorType) {
      logger.warn("Nango callback error", {
        error: nangoError,
        errorType,
        errorDescription,
      });
      return sendResponse(
        "error",
        errorDescription || nangoError || "Yhdistäminen epäonnistui",
      );
    }

    if (!connectionId || !providerConfigKey) {
      return sendResponse(
        "error",
        "Puuttuvat parametrit (connectionId tai providerConfigKey)",
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const encryptionKey = process.env.USER_SECRETS_ENCRYPTION_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !encryptionKey) {
      logger.error("Missing required environment variables for Nango callback");
      return sendResponse("error", "Palvelimen asetukset puuttuvat");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const integrationMapping = {
      "google-ads": {
        id: "google_ads",
        secretType: "nango_connection",
        secretName: "Google Ads Connection",
        displayName: "Google Ads",
      },
      "facebook-ads": {
        id: "meta_ads",
        secretType: "nango_connection",
        secretName: "Meta Ads Connection",
        displayName: "Meta Ads",
      },
    };

    const integrationConfig = integrationMapping[providerConfigKey];
    if (!integrationConfig) {
      logger.warn("Unknown provider in Nango callback", { providerConfigKey });
      return sendResponse(
        "error",
        `Tuntematon integraatio: ${providerConfigKey}`,
      );
    }

    const orgId = connectionId;

    const { error: secretError } = await supabaseAdmin.rpc(
      "store_user_secret",
      {
        p_user_id: orgId,
        p_secret_type: integrationConfig.secretType,
        p_secret_name: integrationConfig.secretName,
        p_plaintext_value: connectionId,
        p_encryption_key: encryptionKey,
        p_metadata: {
          provider: providerConfigKey,
          integration_id: integrationConfig.id,
          connected_at: new Date().toISOString(),
          source: "nango",
        },
      },
    );

    if (secretError) {
      logger.error("Error storing Nango connection in callback", {
        message: secretError.message,
        code: secretError.code,
      });
      return sendResponse("error", "Tietokantavirhe yhteyden tallennuksessa");
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
          integration_type: integrationConfig.secretType,
          integration_name: integrationConfig.secretName,
          provider: providerConfigKey,
          customer_id: orgId,
          user_id: orgId,
          connection_id: connectionId,
          timestamp: new Date().toISOString(),
          get_secret_url: `${apiBaseUrl}/api/users/secrets-service`,
          get_secret_params: {
            secret_type: integrationConfig.secretType,
            secret_name: integrationConfig.secretName,
            user_id: orgId,
          },
        }).catch((err) =>
          logger.warn("n8n webhook warning", { message: err.message }),
        );
      } catch (e) {
        logger.warn("n8n webhook error (non-critical)", { message: e.message });
      }
    }

    logger.info("Nango connection saved via callback", {
      orgId,
      provider: providerConfigKey,
      integrationId: integrationConfig.id,
    });

    return sendResponse(
      "success",
      `${integrationConfig.displayName} yhdistetty onnistuneesti!`,
      { provider: providerConfigKey },
    );
  } catch (error) {
    logger.error("Error in Nango callback", {
      message: error.message,
      stack: error.stack,
    });
    return sendResponse("error", "Odottamaton palvelinvirhe");
  }
}
