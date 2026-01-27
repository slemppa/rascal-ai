import { withOrganization } from "../../_middleware/with-organization.js";
import axios from "axios";
import logger from "../../_lib/logger.js";

async function handleNangoConnect(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { integration_id } = req.body;

    if (!integration_id) {
      return res.status(400).json({
        error: "Puuttuvat parametrit",
        details: "integration_id vaaditaan",
      });
    }

    const orgId = req.organization?.id;
    const authUserId = req.authUser?.id;

    if (!orgId || !authUserId) {
      return res
        .status(400)
        .json({ error: "Käyttäjän organisaatio ei löytynyt" });
    }

    const nangoSecretKey = process.env.NANGO_SECRET_KEY;
    if (!nangoSecretKey) {
      logger.error("Missing NANGO_SECRET_KEY environment variable");
      return res.status(500).json({ error: "Nango asetukset puuttuvat" });
    }

    logger.info("Creating Nango connect session", {
      orgId,
      integration_id,
    });

    const response = await axios.post(
      "https://api.nango.dev/connect/sessions",
      {
        end_user: {
          id: orgId,
          display_name: orgId,
        },
        allowed_integrations: [integration_id],
      },
      {
        headers: {
          Authorization: `Bearer ${nangoSecretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    logger.info("Nango API response received", {
      status: response.status,
      data: response.data,
    });

    const connectLink = response.data?.data?.connect_link;

    if (!connectLink) {
      logger.error("Nango API did not return connect_link", {
        responseData: response.data,
        responseStatus: response.status,
      });
      return res.status(500).json({
        error: "Nango API ei palauttanut connect-linkkiä",
        debug: response.data,
      });
    }

    logger.info("Nango connect session created successfully", {
      orgId,
      integration_id,
      connectLink: connectLink.substring(0, 50) + "...",
    });

    return res.status(200).json({
      connect_link: connectLink,
    });
  } catch (error) {
    logger.error("Error creating Nango connect session", {
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      stack: error.stack,
    });

    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message;

    return res.status(error.response?.status || 500).json({
      error: "Virhe Nango-yhteyden luomisessa",
      details: errorMessage,
      nangoError: error.response?.data,
    });
  }
}

export default withOrganization(handleNangoConnect);
