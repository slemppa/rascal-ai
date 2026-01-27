import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import logger from "../../_lib/logger.js";
import { sendToN8N } from "../../_lib/n8n-client.js";

function verifyNangoSignature(payload, signature, secret) {
  if (!signature || !secret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const nangoSecretKey = process.env.NANGO_SECRET_KEY;
    const signature = req.headers["x-nango-signature"];

    logger.info("Nango webhook received", {
      hasSignature: !!signature,
      hasSecretKey: !!nangoSecretKey,
      headers: Object.keys(req.headers),
    });

    if (signature && nangoSecretKey) {
      const isValid = verifyNangoSignature(req.body, signature, nangoSecretKey);
      if (!isValid) {
        logger.warn("Invalid Nango webhook signature - proceeding anyway", {
          signature: signature?.substring(0, 20) + "...",
        });
      }
    }

    const {
      type,
      connectionId,
      providerConfigKey,
      provider,
      success,
      error: webhookError,
    } = req.body;

    logger.info("Received Nango webhook", {
      type,
      connectionId,
      providerConfigKey,
      provider,
      success,
    });

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error("Missing Supabase environment variables for Nango webhook");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    switch (type) {
      case "auth": {
        if (success && connectionId) {
          const { data: existingSecret, error: findError } = await supabaseAdmin
            .from("user_secrets")
            .select("id, user_id, metadata")
            .eq("secret_type", "nango_connection")
            .eq("secret_value", connectionId)
            .eq("is_active", true)
            .maybeSingle();

          if (!findError && existingSecret) {
            await supabaseAdmin
              .from("user_secrets")
              .update({
                metadata: {
                  ...existingSecret.metadata,
                  last_auth_at: new Date().toISOString(),
                  auth_success: true,
                },
              })
              .eq("id", existingSecret.id);

            logger.info("Updated Nango connection after auth webhook", {
              connectionId,
              userId: existingSecret.user_id,
            });
          }
        } else if (!success && webhookError) {
          logger.warn("Nango auth failed", {
            connectionId,
            error: webhookError,
          });
        }
        break;
      }

      case "sync": {
        logger.info("Nango sync webhook received", {
          connectionId,
          provider,
          success,
        });

        const n8nWebhookUrl = process.env.N8N_INTEGRATION_WEBHOOK_URL;
        if (n8nWebhookUrl) {
          try {
            await sendToN8N(n8nWebhookUrl, {
              action: "nango_sync",
              type: type,
              connection_id: connectionId,
              provider: provider || providerConfigKey,
              success: success,
              timestamp: new Date().toISOString(),
            }).catch((err) =>
              logger.warn("n8n webhook warning", { message: err.message }),
            );
          } catch (e) {
            logger.warn("n8n webhook error (non-critical)", {
              message: e.message,
            });
          }
        }
        break;
      }

      case "connection.deleted": {
        if (connectionId) {
          const { error: deactivateError } = await supabaseAdmin
            .from("user_secrets")
            .update({ is_active: false })
            .eq("secret_type", "nango_connection")
            .filter("metadata->>connection_id", "eq", connectionId);

          if (deactivateError) {
            logger.warn("Error deactivating deleted Nango connection", {
              connectionId,
              error: deactivateError.message,
            });
          } else {
            logger.info("Deactivated Nango connection after deletion webhook", {
              connectionId,
            });
          }
        }
        break;
      }

      case "connection.created": {
        logger.info("Nango connection.created webhook received", {
          connectionId,
          providerConfigKey,
          provider,
        });

        if (connectionId && providerConfigKey) {
          const integrationMapping = {
            "google-ads": {
              id: "google_ads",
              secretType: "nango_connection",
              secretName: "Google Ads Connection",
            },
            "facebook-ads": {
              id: "meta_ads",
              secretType: "nango_connection",
              secretName: "Meta Ads Connection",
            },
          };

          const integrationConfig = integrationMapping[providerConfigKey];
          if (integrationConfig) {
            const encryptionKey = process.env.USER_SECRETS_ENCRYPTION_KEY;
            if (encryptionKey) {
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
                    source: "nango_webhook",
                  },
                },
              );

              if (secretError) {
                logger.error("Error storing Nango connection from webhook", {
                  message: secretError.message,
                  code: secretError.code,
                });
              } else {
                logger.info("Nango connection saved via webhook", {
                  orgId,
                  provider: providerConfigKey,
                });

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
                      logger.warn("n8n webhook warning", {
                        message: err.message,
                      }),
                    );
                  } catch (e) {
                    logger.warn("n8n webhook error (non-critical)", {
                      message: e.message,
                    });
                  }
                }
              }
            } else {
              logger.error(
                "Missing USER_SECRETS_ENCRYPTION_KEY for connection.created webhook",
              );
            }
          } else {
            logger.warn("Unknown provider in connection.created webhook", {
              providerConfigKey,
            });
          }
        }
        break;
      }

      default:
        logger.debug("Unhandled Nango webhook type", { type });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error("Error processing Nango webhook", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
