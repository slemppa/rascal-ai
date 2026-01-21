import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import SimpleSocialConnect from "../SimpleSocialConnect";
import styles from "../../pages/SettingsPage.module.css";

export default function AccountTypeSection({
  userProfile,
  onProfileUpdate,
  isInvitedUser,
}) {
  const { organization } = useAuth();
  const { t } = useTranslation("common");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Form data state
  const [formData, setFormData] = useState({
    account_type: "company",
    company_type: null,
    content_language: "Suomi",
  });

  // Initialize form data from userProfile
  useEffect(() => {
    if (userProfile) {
      setFormData({
        account_type: userProfile.account_type || "company",
        company_type: userProfile.company_type || null,
        content_language: userProfile.content_language || "Suomi",
      });
    } else {
      setFormData({
        account_type: "company",
        company_type: null,
        content_language: "Suomi",
      });
    }
  }, [userProfile]);

  // Save original values for cancel
  const [originalValues, setOriginalValues] = useState(null);

  const handleAccountTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      account_type: type,
    }));
  };

  const handleCompanyTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      company_type: type,
    }));
  };

  const handleContentLanguageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      content_language: e.target.value,
    }));
  };

  const handleEdit = () => {
    setOriginalValues({ ...formData });
    setIsEditing(true);
    setMessage("");
  };

  const handleCancel = () => {
    if (originalValues) {
      setFormData(originalValues);
    }
    setIsEditing(false);
    setMessage("");
  };

  const handleSave = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    setMessage("");

    try {
      const updateData = {
        account_type: formData.account_type,
        company_type: formData.company_type || null,
        content_language: formData.content_language || "Suomi",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userProfile.id);

      if (error) {
        setMessage(`${t("settings.common.error")}: ${error.message}`);
      } else {
        setMessage(t("settings.accountSettings.saveSuccess"));
        setIsEditing(false);

        // Fetch updated profile
        const { data: updatedProfile, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userProfile.id)
          .single();

        if (!fetchError && updatedProfile) {
          onProfileUpdate(updatedProfile);
        }
      }
    } catch (error) {
      setMessage(`${t("settings.common.error")}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get current selection summary
  const getCurrentSelection = () => {
    const accountTypeText =
      formData.account_type === "company"
        ? t("settings.accountSettings.company")
        : t("settings.accountSettings.personalBrand");
    const marketText =
      formData.company_type === "B2B"
        ? t("settings.accountSettings.businessCustomers")
        : formData.company_type === "B2C"
          ? t("settings.accountSettings.consumers")
          : formData.company_type === "Both"
            ? t("settings.accountSettings.both")
            : "";

    if (marketText) {
      return `${accountTypeText} → ${marketText}`;
    }
    return accountTypeText;
  };

  if (isInvitedUser) {
    return null;
  }

  // Don't render if userProfile is not loaded yet
  if (!userProfile) {
    return (
      <div className={styles.card}>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "16px", color: "#6b7280" }}>
            {t("settings.accountSettings.loading")}
          </div>
        </div>
      </div>
    );
  }

  // Color scheme
  const companyColor = "#3b82f6"; // Sininen
  const personalBrandColor = "#8b5cf6"; // Violetti
  const companyTypeColor = "#10b981"; // Vihreä
  const defaultColor = "#6b7280"; // Harmaa

  return (
    <div
      className={styles.card}
      style={{ padding: "16px", minHeight: "auto", alignSelf: "start" }}
    >
      {/* Header with current selection when not editing */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: "#1f2937",
              marginBottom: 4,
            }}
          >
            {t("settings.accountSettings.title")}
          </h2>
          {!isEditing && (
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
              {getCurrentSelection()}
            </div>
          )}
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={{ fontSize: 13, padding: "6px 12px" }}
          >
            {t("settings.accountSettings.edit")}
          </button>
        ) : (
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ fontSize: 13, padding: "6px 12px" }}
            >
              {loading ? t("ui.buttons.saving") : t("ui.buttons.save")}
            </button>
            <button
              onClick={handleCancel}
              className={`${styles.btn} ${styles.btnNeutral}`}
              style={{ fontSize: 13, padding: "6px 12px" }}
            >
              {t("settings.accountSettings.cancel")}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`${styles.message} ${message.includes("Virhe") ? styles.messageError : styles.messageSuccess}`}
          style={{ marginBottom: 12, fontSize: 13 }}
        >
          {message}
        </div>
      )}

      {/* Sisällön ääni - Account Type Selector (2 columns grid) */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            marginBottom: 8,
            display: "block",
            fontWeight: 600,
            color: "#374151",
            fontSize: 14,
          }}
        >
          {t("settings.accountSettings.contentVoice")}
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => handleAccountTypeChange("company")}
            disabled={!isEditing}
            onMouseEnter={(e) => {
              if (isEditing && formData.account_type !== "company") {
                e.currentTarget.style.borderColor = companyColor;
                e.currentTarget.style.background = "#eff6ff";
              }
            }}
            onMouseLeave={(e) => {
              if (formData.account_type !== "company") {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.background = "#ffffff";
              }
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: `2px solid ${formData.account_type === "company" ? companyColor : "#e5e7eb"}`,
              background:
                formData.account_type === "company" ? "#eff6ff" : "#ffffff",
              color:
                formData.account_type === "company"
                  ? companyColor
                  : defaultColor,
              fontWeight: 600,
              fontSize: 13,
              cursor: isEditing ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              opacity: isEditing ? 1 : 0.6,
            }}
          >
            {t("settings.accountSettings.company")}
          </button>
          <button
            type="button"
            onClick={() => handleAccountTypeChange("personal_brand")}
            disabled={!isEditing}
            onMouseEnter={(e) => {
              if (isEditing && formData.account_type !== "personal_brand") {
                e.currentTarget.style.borderColor = personalBrandColor;
                e.currentTarget.style.background = "#f5f3ff";
              }
            }}
            onMouseLeave={(e) => {
              if (formData.account_type !== "personal_brand") {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.background = "#ffffff";
              }
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: `2px solid ${formData.account_type === "personal_brand" ? personalBrandColor : "#e5e7eb"}`,
              background:
                formData.account_type === "personal_brand"
                  ? "#f5f3ff"
                  : "#ffffff",
              color:
                formData.account_type === "personal_brand"
                  ? personalBrandColor
                  : defaultColor,
              fontWeight: 600,
              fontSize: 13,
              cursor: isEditing ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              opacity: isEditing ? 1 : 0.6,
            }}
          >
            {t("settings.accountSettings.personalBrand")}
          </button>
        </div>
      </div>

      {/* Kohderyhmätyyppi - Target Market Selector (4 columns grid) */}
      <div style={{ marginBottom: 0 }}>
        <label
          style={{
            marginBottom: 8,
            display: "block",
            fontWeight: 600,
            color: "#374151",
            fontSize: 14,
          }}
        >
          {t("settings.accountSettings.targetAudience")}{" "}
          <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 12 }}>
            {t("settings.accountSettings.optional")}
          </span>
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 8,
          }}
        >
          {["B2B", "B2C", "Both"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                handleCompanyTypeChange(type === "Both" ? "Both" : type)
              }
              disabled={!isEditing}
              onMouseEnter={(e) => {
                if (isEditing && formData.company_type !== type) {
                  e.currentTarget.style.borderColor = companyTypeColor;
                  e.currentTarget.style.background = "#f0fdf4";
                }
              }}
              onMouseLeave={(e) => {
                if (formData.company_type !== type) {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.background = "#ffffff";
                }
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: `2px solid ${formData.company_type === type ? companyTypeColor : "#e5e7eb"}`,
                background:
                  formData.company_type === type ? "#f0fdf4" : "#ffffff",
                color:
                  formData.company_type === type
                    ? companyTypeColor
                    : defaultColor,
                fontWeight: 600,
                fontSize: 13,
                cursor: isEditing ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                opacity: isEditing ? 1 : 0.6,
              }}
            >
              {type === "B2B"
                ? t("settings.accountSettings.b2b")
                : type === "B2C"
                  ? t("settings.accountSettings.b2c")
                  : t("settings.accountSettings.both")}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleCompanyTypeChange(null)}
            disabled={!isEditing}
            onMouseEnter={(e) => {
              if (isEditing && formData.company_type !== null) {
                e.currentTarget.style.borderColor = defaultColor;
                e.currentTarget.style.background = "#f9fafb";
              }
            }}
            onMouseLeave={(e) => {
              if (formData.company_type !== null) {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.background = "#ffffff";
              }
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: `2px solid ${formData.company_type === null ? defaultColor : "#e5e7eb"}`,
              background:
                formData.company_type === null ? "#f9fafb" : "#ffffff",
              color:
                formData.company_type === null ? defaultColor : defaultColor,
              fontWeight: 600,
              fontSize: 13,
              cursor: isEditing ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              opacity: isEditing ? 1 : 0.6,
            }}
          >
            {t("settings.accountSettings.noSelection")}
          </button>
        </div>
      </div>

      {/* Sisällön kieli */}
      <div style={{ marginTop: 16 }}>
        <label
          style={{
            marginBottom: 8,
            display: "block",
            fontWeight: 600,
            color: "#374151",
            fontSize: 14,
          }}
        >
          {t("settings.accountSettings.contentLanguage")}
        </label>
        <p
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 8,
            marginTop: -4,
          }}
        >
          {t("settings.accountSettings.contentLanguageDescription")}
        </p>
        <input
          type="text"
          value={formData.content_language}
          onChange={handleContentLanguageChange}
          disabled={!isEditing}
          placeholder={t("settings.accountSettings.contentLanguagePlaceholder")}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            color: "#374151",
            background: isEditing ? "#ffffff" : "#f9fafb",
            cursor: isEditing ? "text" : "not-allowed",
            opacity: isEditing ? 1 : 0.7,
          }}
        />
      </div>

      {/* Sosiaalisen median yhdistäminen - vain owner/admin */}
      {organization?.role !== "member" && (
        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <SimpleSocialConnect />
        </div>
      )}
    </div>
  );
}
