// src/components/layout/ProfileModal.jsx
import React, { useEffect, useState, useRef } from "react";
import { THEME } from "../../theme";
import { API_BASE } from "../../../config";           // e.g. export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
import { useAuth } from "../../contexts/auth-context";

const { colors: THEME_COLORS } = THEME;

function uiLayoutToDb(ui) {
  // UI: "stacked" | "compact"  -> DB: "Layout 2" | "Layout 1"
  if (ui === "compact") return "Layout 1";
  return "Layout 2"; // default to stacked
}
function dbLayoutToUi(db) {
  // DB: "Layout 1" | "Layout 2" -> UI: "compact" | "stacked"
  if (db === "Layout 1") return "compact";
  return "stacked";
}

/**
 * ProfileModal
 * Props:
 * - open (bool)
 * - onClose()   -> called when modal closes
 * - profile (object) -> current memberDashboard object
 *      expected shape: { user:{...}, dashboardAppearance:{ layout, color }, ... }
 * - setProfileInContext(updatedMemberDashboard)
 * - onSaveRemote (optional) – not used for appearance here (we call API directly)
 */
export default function ProfileModal({
  open,
  onClose,
  profile = {},
  setProfileInContext,
  onSaveRemote, // unused for appearance in this version, still supported for other tabs
  appearanceEndpoint = `${API_BASE}/users/me/appearance`,
}) {
  const { token } = useAuth() || {};

  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState({
    fullName: "",
    displayName: "",
    email: "",
    phoneContact: "",
    emailAlerts: false,
    layoutStyle: "stacked",     // UI values: "stacked" | "compact"
    colorTheme: "gold",         // arbitrary string, your API expects it in req.body.color
    photoPreview: "",
    photoFile: null,
  });

  const [activeTab, setActiveTab] = useState("personal");
  const backdropRef = useRef(null);

  // seed local state from profile when opened/changed
  useEffect(() => {
    const user = profile?.user || {};
    const da = profile?.dashboardAppearance || {};
    setLocal({
      fullName: user.fullName ?? "",
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      phoneContact: user.phoneContact ?? "",
      emailAlerts: Boolean(profile?.preferences?.emailAlerts), // you can remove if you don't use this
      layoutStyle: dbLayoutToUi(da.layout || "Layout 2"),
      colorTheme: da.color || "gold",
      photoPreview: user.photoURL || "",
      photoFile: null,
    });
    setEditing(false);
  }, [profile, open]);

  if (!open) return null;

  const themeAccent = local.colorTheme === "blue" ? "#2B9EDB" : THEME_COLORS.gold;

  const handleFileChange = (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setLocal((s) => ({ ...s, photoPreview: url, photoFile: f }));
  };

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  async function saveAppearanceIfChanged() {
    const currentLayoutDb = profile?.dashboardAppearance?.layout || "Layout 2";
    const currentColorDb = profile?.dashboardAppearance?.color || "gold";

    const nextLayoutDb = uiLayoutToDb(local.layoutStyle);
    const nextColorDb = local.colorTheme;

    const sameLayout = currentLayoutDb === nextLayoutDb;
    const sameColor = currentColorDb === nextColorDb;

    if (sameLayout && sameColor) return; // nothing to do

    // call API: POST /users/me/appearance { layOut, color }
    const body = {
      layOut: nextLayoutDb,     // API expects layOut (note casing)
      color: nextColorDb,
    };

    const res = await fetch(appearanceEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include", // send cookies (jwt)
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Appearance update failed (${res.status})`);
    }
  }

  const handleSave = async () => {
    // minimal validation for personal tab
    if (!local.fullName?.trim() || !local.email?.trim()) {
      alert("Please enter name and email.");
      return;
    }

    // Build updated profile for local context
    const updated = {
      ...profile,
      user: {
        ...(profile?.user || {}),
        fullName: local.fullName,
        displayName: local.displayName,
        email: local.email,
        phoneContact: local.phoneContact,
        photoURL: local.photoPreview,
      },
      // keep existing structure but update dashboardAppearance
      dashboardAppearance: {
        ...(profile?.dashboardAppearance || {}),
        layout: uiLayoutToDb(local.layoutStyle),
        color: local.colorTheme,
      },
      // (optional) if you still keep preferences:
      preferences: {
        ...(profile?.preferences ?? {}),
        emailAlerts: !!local.emailAlerts,
      },
    };

    // Optimistic local update
    if (typeof setProfileInContext === "function") {
      setProfileInContext(updated);
    }

    // Persist appearance remotely (only if changed)
    try {
      await saveAppearanceIfChanged();
    } catch (err) {
      console.error("Remote appearance save failed:", err);
      alert("Failed to save appearance to server. Local changes shown only.");
    }

    // (Optional) If you want to handle photo upload or other fields remotely:
    if (typeof onSaveRemote === "function") {
      try {
        await onSaveRemote(updated, local.photoFile);
      } catch (err) {
        console.error("Remote save (other fields) failed:", err);
      }
    }

    setEditing(false);
    onClose();
  };

  return (
    <div
      ref={backdropRef}
      className="gs-modal-backdrop"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.45)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="gs-modal"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "86vh",
          overflow: "auto",
          borderRadius: 12,
          background: "#fff",
          padding: 20,
          boxShadow: "0 8px 30px rgba(2,6,23,0.45)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, color: THEME_COLORS.navy }}>Edit profile</h3>
            <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>Update your personal details and preferences</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 18,
              cursor: "pointer",
              color: "#666",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 16, marginTop: 14, borderBottom: `1px solid #ddd`, paddingBottom: 8 }}>
          <button
            onClick={() => setActiveTab("personal")}
            style={{
              fontWeight: activeTab === "personal" ? 700 : 400,
              color: activeTab === "personal" ? themeAccent : "#666",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            style={{
              fontWeight: activeTab === "notifications" ? 700 : 400,
              color: activeTab === "notifications" ? themeAccent : "#666",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            style={{
              fontWeight: activeTab === "appearance" ? 700 : 400,
              color: activeTab === "appearance" ? themeAccent : "#666",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Appearance
          </button>
        </div>

        {/* Tab content */}
        <div style={{ marginTop: 16, minHeight: 200 }}>
          {activeTab === "personal" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 110, height: 110, borderRadius: 10, overflow: "hidden", border: `1px solid #eee` }}>
                  <img
                    src={local.photoPreview || "https://via.placeholder.com/110"}
                    alt="profile preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontWeight: 700 }}>Profile photo</label>
                  <input type="file" accept="image/*" disabled={!editing} onChange={handleFileChange} />
                  <div style={{ fontSize: 12, color: "#666" }}>PNG/JPG. Max 3MB.</div>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Full name</label>
                <input
                  value={local.fullName}
                  disabled={!editing}
                  onChange={(e) => setLocal((s) => ({ ...s, fullName: e.target.value }))}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid #ddd` }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Display name</label>
                <input
                  value={local.displayName}
                  disabled={!editing}
                  onChange={(e) => setLocal((s) => ({ ...s, displayName: e.target.value }))}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid #ddd` }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Email</label>
                <input
                  value={local.email}
                  disabled={!editing}
                  onChange={(e) => setLocal((s) => ({ ...s, email: e.target.value }))}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid #ddd` }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Phone</label>
                <input
                  value={local.phoneContact}
                  disabled={!editing}
                  onChange={(e) => setLocal((s) => ({ ...s, phoneContact: e.target.value }))}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid #ddd` }}
                />
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <label
              style={{ display: "flex", gap: 8, alignItems: "center", cursor: editing ? "pointer" : "not-allowed" }}
            >
              <input
                type="checkbox"
                checked={!!local.emailAlerts}
                disabled={!editing}
                onChange={(e) => setLocal((s) => ({ ...s, emailAlerts: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: themeAccent }}
              />
              <span style={{ fontWeight: 700 }}>Email alerts</span>
            </label>
          )}

          {activeTab === "appearance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Layout style</div>
                <label style={{ display: "inline-flex", gap: 8, alignItems: "center", marginRight: 12 }}>
                  <input
                    type="radio"
                    name="layoutStyle"
                    value="stacked"
                    disabled={!editing}
                    checked={local.layoutStyle === "stacked"}
                    onChange={(e) => setLocal((s) => ({ ...s, layoutStyle: e.target.value }))}
                  />
                  <span>Stacked</span>
                </label>
                <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="radio"
                    name="layoutStyle"
                    value="compact"
                    disabled={!editing}
                    checked={local.layoutStyle === "compact"}
                    onChange={(e) => setLocal((s) => ({ ...s, layoutStyle: e.target.value }))}
                  />
                  <span>Compact</span>
                </label>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Color theme</div>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    marginRight: 12,
                    cursor: editing ? "pointer" : "not-allowed",
                  }}
                >
                  <input
                    type="radio"
                    name="colorTheme"
                    value="gold"
                    disabled={!editing}
                    checked={local.colorTheme === "gold"}
                    onChange={(e) => setLocal((s) => ({ ...s, colorTheme: e.target.value }))}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: THEME_COLORS.gold,
                        border: `1px solid ${THEME_COLORS.navy}`,
                      }}
                    />
                    <div style={{ fontWeight: 700 }}>Gold (default)</div>
                  </div>
                </label>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: editing ? "pointer" : "not-allowed",
                  }}
                >
                  <input
                    type="radio"
                    name="colorTheme"
                    value="blue"
                    disabled={!editing}
                    checked={local.colorTheme === "blue"}
                    onChange={(e) => setLocal((s) => ({ ...s, colorTheme: e.target.value }))}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: "#2B9EDB",
                        border: `1px solid ${THEME_COLORS.navy}`,
                      }}
                    />
                    <div style={{ fontWeight: 700 }}>Ocean blue</div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              style={{
                border: `1px solid ${themeAccent}`,
                background: themeAccent,
                color: THEME_COLORS.navy,
                padding: "8px 12px",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  const user = profile?.user || {};
                  const da = profile?.dashboardAppearance || {};
                  setLocal({
                    fullName: user.fullName ?? "",
                    displayName: user.displayName ?? "",
                    email: user.email ?? "",
                    phoneContact: user.phoneContact ?? "",
                    emailAlerts: Boolean(profile?.preferences?.emailAlerts),
                    layoutStyle: dbLayoutToUi(da.layout || "Layout 2"),
                    colorTheme: da.color || "gold",
                    photoPreview: user.photoURL || "",
                    photoFile: null,
                  });
                  setEditing(false);
                }}
                style={{
                  border: `1px solid ${THEME_COLORS.navy}`,
                  background: "transparent",
                  color: THEME_COLORS.navy,
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  border: `1px solid ${themeAccent}`,
                  background: themeAccent,
                  color: THEME_COLORS.navy,
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
