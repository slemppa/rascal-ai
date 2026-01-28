import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

const ALL_FEATURES = [
  "Campaigns",
  "Segments",
  "CRM",
  "Phone Calls",
  "Social Media",
  "Marketing assistant",
  "Email marketing integration",
  "Dev",
  "Voicemail",
  "Leads",
  "UGC",
  "Media Monitoring",
  "sitebuilder",
];

const ALL_PLATFORMS = [
  "Blog",
  "Newsletter",
  "Instagram Photo",
  "LinkedIn",
  "Instagram Carousel",
  "Instagram Reels",
];

const getFeatureLabel = (feature) => {
  const labels = {
    Voicemail: "Vastaaja",
    Leads: "Liidit",
    "Marketing assistant": "Markkinointiassistentti",
    "Email marketing integration": "Sähköpostimarkkinoinnin integraatio",
    "Phone Calls": "Puhelut",
    "Social Media": "Sosiaalinen media",
    Campaigns: "Kampanjat",
    Segments: "Segmentit",
    CRM: "CRM",
    Dev: "Kehitys",
    UGC: "UGC",
    "Media Monitoring": "Mediaseuranta",
    sitebuilder: "Sivustorakentaja",
  };
  return labels[feature] || feature;
};

export default function FeaturesTab({
  features = [],
  isSaving,
  onFeatureToggle,
  userId, // Käyttäjän/organisaation ID
}) {
  const { organization, user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingMessage, setOnboardingMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [localChanges, setLocalChanges] = useState({});
  const [wordpressConfigured, setWordpressConfigured] = useState(false);
  const [wordpressLoading, setWordpressLoading] = useState(true);

  // Lataa käyttäjän kaikki tiedot
  useEffect(() => {
    if (!userId) {
      setOnboardingLoading(false);
      setWordpressLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("[FeaturesTab] Error loading user data:", error);
        } else {
          console.log("[FeaturesTab] Loaded user data:", {
            id: data?.id,
            onboarding_completed: data?.onboarding_completed,
            platforms_type: typeof data?.platforms,
            platforms_value: data?.platforms,
            platforms_parsed: Array.isArray(data?.platforms)
              ? data.platforms
              : "not array",
          });
          setUserData(data || {});
          setOnboardingCompleted(data?.onboarding_completed || false);
        }
      } catch (error) {
        console.error("[FeaturesTab] Error in loadUserData:", error);
      } finally {
        setOnboardingLoading(false);
      }
    };

    // Tarkista WordPress-integraation tila
    const checkWordPressIntegration = async () => {
      try {
        const { data, error } = await supabase
          .from("user_secrets")
          .select("id")
          .eq("user_id", userId)
          .eq("secret_type", "wordpress_api_key")
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          console.error(
            "[FeaturesTab] Error checking WordPress integration:",
            error,
          );
        } else {
          setWordpressConfigured(!!data);
        }
      } catch (error) {
        console.error(
          "[FeaturesTab] Error in checkWordPressIntegration:",
          error,
        );
      } finally {
        setWordpressLoading(false);
      }
    };

    loadUserData();
    checkWordPressIntegration();
  }, [userId]);

  // Tallenna onboarding_completed arvo
  const handleOnboardingToggle = async (newValue) => {
    if (!userId || onboardingSaving) return;

    setOnboardingSaving(true);
    setOnboardingMessage("");

    try {
      // Tarkista onko käyttäjä admin/moderator/owner
      // Tarkistetaan SEKÄ system role (users.role) ETTÄ organization role (org_members.role)
      const isSystemAdmin =
        user?.systemRole === "admin" ||
        user?.systemRole === "superadmin" ||
        user?.systemRole === "moderator";
      const isOrgAdmin =
        organization?.role === "admin" ||
        organization?.role === "owner" ||
        organization?.role === "moderator";
      const isAdmin = isSystemAdmin || isOrgAdmin;

      if (isAdmin) {
        // Käytä admin-data endpointia admin-käyttäjille (ohittaa RLS:n)
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Session expired or invalid");
        }

        const response = await fetch("/api/admin/data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: "update-onboarding",
            user_id: userId,
            onboarding_completed: newValue,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to update onboarding status",
          );
        }

        setOnboardingCompleted(newValue);
        setOnboardingMessage("Onboarding-status päivitetty onnistuneesti!");
        setTimeout(() => setOnboardingMessage(""), 3000);
      } else {
        // Normaali käyttäjä: käytä suoraa Supabase-kyselyä
        const { error } = await supabase
          .from("users")
          .update({
            onboarding_completed: newValue,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          throw error;
        }

        setOnboardingCompleted(newValue);
        setOnboardingMessage("Onboarding-status päivitetty onnistuneesti!");
        setTimeout(() => setOnboardingMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      setOnboardingMessage(
        "Virhe onboarding-statusin tallennuksessa: " +
          (error.message || "Tuntematon virhe"),
      );
      setTimeout(() => setOnboardingMessage(""), 5000);
    } finally {
      setOnboardingSaving(false);
    }
  };

  // Tallenna alustavalinnat
  const handlePlatformToggle = async (newPlatforms) => {
    if (!userId) return;

    console.log(
      "[FeaturesTab] handlePlatformToggle called with:",
      newPlatforms,
    );
    setOnboardingSaving(true);
    setSaveMessage("");

    try {
      // Varmista että newPlatforms on array
      const platformsToSave = Array.isArray(newPlatforms) ? newPlatforms : [];

      // Tarkista onko käyttäjä admin/moderator/owner
      // Tarkistetaan SEKÄ system role (users.role) ETTÄ organization role (org_members.role)
      const isSystemAdmin =
        user?.systemRole === "admin" ||
        user?.systemRole === "superadmin" ||
        user?.systemRole === "moderator";
      const isOrgAdmin =
        organization?.role === "admin" ||
        organization?.role === "owner" ||
        organization?.role === "moderator";
      const isAdmin = isSystemAdmin || isOrgAdmin;

      if (isAdmin) {
        // Käytä admin-data endpointia admin-käyttäjille (ohittaa RLS:n)
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Session expired or invalid");
        }

        const response = await fetch("/api/admin/data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: "update-platforms",
            user_id: userId,
            platforms: platformsToSave,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update platforms");
        }

        // Päivitä state arrayina (ei stringinä)
        setUserData((prev) => ({
          ...prev,
          platforms: platformsToSave, // Pidä arrayina staten sisällä
        }));

        setSaveMessage("Alustat päivitetty!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        // Normaali käyttäjä: käytä suoraa Supabase-kyselyä
        const platformsToSaveString = JSON.stringify(platformsToSave);

        const { error } = await supabase
          .from("users")
          .update({
            platforms: platformsToSaveString,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          throw error;
        }

        // Päivitä state arrayina (ei stringinä)
        setUserData((prev) => ({
          ...prev,
          platforms: platformsToSave, // Pidä arrayina staten sisällä
        }));

        setSaveMessage("Alustat päivitetty!");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch (error) {
      console.error("[FeaturesTab] Error saving platforms:", error);
      setSaveMessage(
        "Virhe alustojen tallennuksessa: " +
          (error.message || "Tuntematon virhe"),
      );
      setTimeout(() => setSaveMessage(""), 5000);
    } finally {
      setOnboardingSaving(false);
    }
  };

  // Käsittele platforms-kenttä eri muodoista (sama logiikka kuin admin-sivulla)
  const getCurrentPlatforms = () => {
    const platformsData = userData?.platforms || [];

    // Jos on jo array, palauta sellaisenaan
    if (Array.isArray(platformsData)) {
      console.log(
        "[FeaturesTab] getCurrentPlatforms: already array:",
        platformsData,
      );
      return platformsData;
    }

    // Jos on string, käsittele sitä
    if (typeof platformsData === "string") {
      // Tyhjä string
      if (!platformsData.trim()) {
        console.log("[FeaturesTab] getCurrentPlatforms: empty string");
        return [];
      }

      // Yritä parsia JSON array stringinä
      try {
        const parsed = JSON.parse(platformsData);
        if (Array.isArray(parsed)) {
          console.log(
            "[FeaturesTab] getCurrentPlatforms: parsed from JSON string:",
            parsed,
          );
          return parsed;
        }
      } catch (e) {
        // Ei JSON, käsittele pilkuilla eroteltuna
        const result = platformsData
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p);
        console.log(
          "[FeaturesTab] getCurrentPlatforms: split by comma:",
          result,
        );
        return result;
      }
    }

    console.log("[FeaturesTab] getCurrentPlatforms: returning empty array");
    return [];
  };

  // Varmista että features on aina array
  const enabledFeatures = React.useMemo(() => {
    if (!features) return [];
    if (!Array.isArray(features)) {
      console.warn("Features is not an array:", features);
      return [];
    }
    return features;
  }, [features]);

  const currentPlatforms = getCurrentPlatforms();

  return (
    <div className="features-tab-container">
      {/* Onboarding-osio */}
      <div
        className="onboarding-section"
        style={{
          marginBottom: "32px",
          padding: "20px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "16px",
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          Onboarding
        </h3>
        <p
          style={{
            margin: "0 0 16px 0",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Onko käyttäjän onboarding suoritettu? Jos onboarding on valmis,
          onboarding-modaali ei näy käyttäjälle.
        </p>

        {onboardingMessage && (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: "16px",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: onboardingMessage.includes("Virhe")
                ? "#fef2f2"
                : "#f0fdf4",
              color: onboardingMessage.includes("Virhe")
                ? "#dc2626"
                : "#16a34a",
              border: `1px solid ${onboardingMessage.includes("Virhe") ? "#fecaca" : "#bbf7d0"}`,
            }}
          >
            {onboardingMessage}
          </div>
        )}

        {onboardingLoading ? (
          <div style={{ color: "#6b7280", fontSize: "14px" }}>Ladataan...</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <label
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: !onboardingCompleted ? "#1f2937" : "#9ca3af",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              Ei valmis
            </label>

            {/* Liukukytkin */}
            <button
              type="button"
              onClick={() => handleOnboardingToggle(!onboardingCompleted)}
              disabled={onboardingSaving}
              style={{
                position: "relative",
                width: "52px",
                height: "28px",
                borderRadius: "14px",
                border: "none",
                cursor: onboardingSaving ? "not-allowed" : "pointer",
                backgroundColor: onboardingCompleted ? "#10b981" : "#6b7280",
                transition: "background-color 0.3s",
                outline: "none",
                padding: "2px",
              }}
              onMouseEnter={(e) => {
                if (!onboardingSaving) {
                  e.target.style.opacity = "0.9";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = "1";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: onboardingCompleted ? "26px" : "2px",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  transition: "left 0.3s",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                }}
              />
            </button>

            <label
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: onboardingCompleted ? "#1f2937" : "#9ca3af",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              Valmis
            </label>
          </div>
        )}
      </div>

      {/* Alustat-osio */}
      <div
        className="platforms-section"
        style={{
          marginBottom: "32px",
          padding: "20px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "16px",
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          Alustat
        </h3>
        <p
          style={{
            margin: "0 0 16px 0",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Valitse mitkä alustat ovat käytössä asiakkaalla.
        </p>

        {saveMessage && (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: "16px",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: saveMessage.includes("Virhe")
                ? "#fef2f2"
                : "#f0fdf4",
              color: saveMessage.includes("Virhe") ? "#dc2626" : "#16a34a",
              border: `1px solid ${saveMessage.includes("Virhe") ? "#fecaca" : "#bbf7d0"}`,
            }}
          >
            {saveMessage}
          </div>
        )}

        {onboardingLoading ? (
          <div style={{ color: "#6b7280", fontSize: "14px" }}>Ladataan...</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {ALL_PLATFORMS.map((platform) => {
              const isSelected = currentPlatforms.includes(platform);

              return (
                <label
                  key={platform}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    backgroundColor: isSelected ? "#f0fdf4" : "#f9fafb",
                    border: `2px solid ${isSelected ? "#10b981" : "#e5e7eb"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: isSelected ? "#1f2937" : "#6b7280",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const platformsArray = getCurrentPlatforms();
                      let newPlatforms;
                      if (e.target.checked) {
                        newPlatforms = [...platformsArray, platform];
                      } else {
                        newPlatforms = platformsArray.filter(
                          (p) => p !== platform,
                        );
                      }
                      handlePlatformToggle(newPlatforms);
                    }}
                    disabled={onboardingSaving}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      accentColor: "#10b981",
                    }}
                  />
                  <span>{platform}</span>
                </label>
              );
            })}
          </div>
        )}

        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#f9fafb",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          <strong>Valittuna:</strong> {currentPlatforms.length} /{" "}
          {ALL_PLATFORMS.length}
        </div>
      </div>

      {/* WordPress-plugin latausosio - näytetään vain jos WordPress on konfiguroitu */}
      {wordpressLoading ? (
        <div
          style={{
            marginBottom: "32px",
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ color: "#6b7280", fontSize: "14px" }}>
            Tarkistetaan WordPress-integraatiota...
          </div>
        </div>
      ) : (
        wordpressConfigured && (
          <div
            className="wordpress-plugin-section"
            style={{
              marginBottom: "32px",
              padding: "20px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "16px",
                fontWeight: 600,
                color: "#1f2937",
              }}
            >
              WordPress-plugin
            </h3>
            <p
              style={{
                margin: "0 0 16px 0",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              WordPress-integraatio on konfiguroitu. Voit ladata Rascal AI
              WordPress-pluginin alla olevasta linkistä.
            </p>

            <a
              href="/plugins/rascal-ai.zip"
              download="rascal-ai.zip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                backgroundColor: "#10b981",
                color: "#fff",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "background-color 0.2s",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#059669";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#10b981";
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 15.5V8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.5 12L12 15.5L15.5 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Lataa WordPress-plugin
            </a>

            <div
              style={{ marginTop: "12px", fontSize: "12px", color: "#9ca3af" }}
            >
              Versio: 1.0 | Tiedoston koko: ~100KB
            </div>
          </div>
        )
      )}

      <div className="features-description">
        <p>
          Hallitse käyttäjän käytössä olevia ominaisuuksia. Ota ominaisuudet
          käyttöön tai poista ne käytöstä vaihtamalla kytkintä.
        </p>
      </div>

      <div className="features-list">
        {ALL_FEATURES.map((feature) => {
          const isEnabled = enabledFeatures.includes(feature);

          return (
            <div key={feature} className="feature-item">
              <div className="feature-info">
                <span className="feature-name">{getFeatureLabel(feature)}</span>
                <span className="feature-key">{feature}</span>
              </div>
              <label className="feature-switch">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => {
                    const current = Array.isArray(features) ? features : [];
                    const next = e.target.checked
                      ? Array.from(new Set([...current, feature]))
                      : current.filter((x) => x !== feature);
                    if (onFeatureToggle) {
                      onFeatureToggle(next);
                    } else {
                      console.error(
                        "FeaturesTab - onFeatureToggle is not defined!",
                      );
                    }
                  }}
                  disabled={isSaving}
                  aria-label={getFeatureLabel(feature)}
                />
                <span className="switch-slider" />
              </label>
            </div>
          );
        })}
      </div>

      {enabledFeatures.length === 0 && (
        <div className="no-features-message">
          <p>Käyttäjällä ei ole yhtään aktiivista ominaisuutta.</p>
        </div>
      )}

      <div className="features-summary">
        <div className="summary-item">
          <span className="summary-label">Aktiivisia ominaisuuksia:</span>
          <span className="summary-value">
            {enabledFeatures.length} / {ALL_FEATURES.length}
          </span>
        </div>
      </div>
    </div>
  );
}
