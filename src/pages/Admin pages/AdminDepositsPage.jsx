// src/pages/DepositsPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { THEME } from "../../theme";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { useAdminDashboard } from "../../contexts/AdminDashboardContext";
import { useAuth } from "../../contexts/auth-context";
import { API_BASE } from "../../../config";


const { colors, spacing } = THEME;

export default function AdminDepositsPage({ dashboard = "admin" }) {
  const { adminDashboard } = useAdminDashboard();

  // pull members and deposits from context (safe defaults)
  const membersFromCtx = adminDashboard?.allUsers;
  const depositsFromCtx = adminDashboard?.allDeposits?.items ?? [];
  const { token } = useAuth();

  const [users, setUsers] = useState(membersFromCtx);
  const [records, setRecords] = useState(depositsFromCtx);
  const [loading, setLoading] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : true);

  // --- Add Deposit modal toggles/state ---
const [isAddOpen, setIsAddOpen] = useState(false);
// If null => adding; if set => editing this deposit
const [selectedDeposit, setSelectedDeposit] = useState(null);

// Open for NEW deposit
function handleOpenAdd() {
  setSelectedDeposit(null);
  setIsAddOpen(true);
}

// Open for EDIT of an existing deposit
function handleOpenEdit(dep) {
  setSelectedDeposit(dep);
  setIsAddOpen(true);
}

// When a deposit is saved (created or updated)
function handleDepositSaved(saved) {
  setRecords((prev) => {
    const idx = prev.findIndex((d) => d._id === saved._id);
    if (idx === -1) return [saved, ...prev];          // new
    const next = prev.slice();
    next[idx] = { ...prev[idx], ...saved };           // update in place
    return next;
  });
}


// Optional: cash locations (if provided by your context; safe fallback to [])
const cashLocationsFromCtx = adminDashboard?.cashLocations.map(l => l.name);
const [cashLocations, setCashLocations] = useState(cashLocationsFromCtx);

// Keep records in sync after a successful create
function handleDepositCreated(created) {
  // prepend the new record so it shows immediately
  setRecords((prev) => [created, ...prev]);
}


  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Sync local state with context when adminDashboard changes
  useEffect(() => {
    setUsers(adminDashboard?.allUsers ?? []);
    setRecords(adminDashboard?.allDeposits?.items ?? []);
    setCashLocations(adminDashboard?.cashLocations ?? []);
    setLoading(false);
  }, [adminDashboard]);
  

  // ---------- helpers ----------
  function fmtCurrency(n) {
    try {
      return "UGX " + Number(n || 0).toLocaleString();
    } catch (e) {
      return String(n || "");
    }
  }
  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  }

  // ---------- inner components ----------
 // --- helpers used below (assume fmtDate, fmtCurrency, colors, Link exist in scope) ---
const Chevron = ({ open }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 160ms ease" }}
  >
    <path fill="currentColor" d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6l1.41-1.42Z" />
  </svg>
);

function DepositCard({ deposit, isMobile, onEdit }) {
  const name = deposit.depositor?.fullName ?? "Unknown";
  const firstName = name.split(" ")[0] || name;
  const date = deposit.date ?? deposit.dateISO ?? deposit.createdAt;
  const amount = deposit.amount ?? 0;
  const type = deposit.type ?? "—";
  const recordedBy = deposit.recordedBy?.fullName ?? "—";
  const source = deposit.source ?? "—";
  const cashLocation = deposit.cashLocation?.name ?? deposit.cashLocation ?? "—";

  const photoURL =
    deposit.depositor?.photoURL || deposit.depositor?.photoUrl || deposit.depositor?.avatar || null;
  const initials = name
    .split(" ")
    .map((s) => s?.[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [open, setOpen] = React.useState(false);
  const toggle = () => setOpen((v) => !v);

  // --- shell ---
  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 5,
        boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
        border: "1px solid rgba(0,0,0,0.1)",
      }}
    >
      {/* Accent stripe */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: deposit.type == "Permanent" ? colors.navy : colors.gold,
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingLeft: 8,
          paddingTop: 8,
          fontSize: 18,         
          paddingBottom: 8,
          justifyContent: "space-between",
          cursor: isMobile ? "pointer" : "default",
        }}
        onClick={isMobile ? toggle : undefined}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {photoURL ? (
            <img
              src={photoURL}
              alt={name}
              width={40}
              height={40}
              style={{ borderRadius: 19, objectFit: "cover", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}
            />
          ) : (
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                background: "#e9eef9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 100,
                color: colors.navy,
                flex: "0 0 auto",
              }}
            >
              {initials}
            </div>
          )}
          <div
            style={{
              fontWeight: 500,
              color: colors.navy,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {isMobile ? firstName : name}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 900, color: colors.navy }}>{fmtCurrency(amount)}</div>
          {isMobile ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              style={{
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 150ms ease",
                color: "#475569",
              }}
            >
              <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6l-6-6z" />
            </svg>
          ) : null}
        </div>
      </div>

      {/* Divider: desktop always; mobile only when open */}
      {(!isMobile || open) && (
        <div style={{ height: 1, background: "rgb(0,0,0, 0.5)", margin: "6px 0 10px 0" }} />
      )}

      {/* Details + Edit (inside details block on mobile) */}
      {!isMobile ? (
        <>
          {/* Desktop: single row details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 10,
              fontSize: 13,
            }}
          >
            <Labeled label="Date" value={fmtDate(date)} />
            <Labeled label="Account / Type" value={type} />
            <Labeled label="Source" value={source} />
            <Labeled label="Cash Location" value={cashLocation} />
            <Labeled label="Recorded By" value={recordedBy} />
          </div>

          {/* Edit button (desktop) */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button
                type="button"
                onClick={() => onEdit?.(deposit)}
                className="btn"
                style={{ background: "transparent", color: "#475569", border: "2px solid gold", padding: "6px 10px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                aria-label="Edit deposit"
                title="Edit"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                  <path fill="currentColor" d="M14.06 9.02l.92.92L6 18.92H5v-1L14.06 9.02M17.66 3c-.25 0-.51.1-.71.29L15.13 5.1l3.75 3.75l1.82-1.82a1.003 1.003 0 0 0 0-1.41L18.37 3.3c-.2-.19-.46-.3-.71-.3zM14.06 6.17L4 16.25V20h3.75l10.06-10.08l-3.75-3.75Z" />
                </svg>
                Edit
              </button>
            </div>

        </>
      ) : open ? (
        <>
          {/* Mobile: accordion body (2-up) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
              fontSize: 14,
            }}
          >
            <Labeled label="Date" value={fmtDate(date)} />
            <Labeled label="Account / Type" value={type} />
            <Labeled label="Source" value={source} />
            <Labeled label="Cash Location" value={cashLocation} />
            <Labeled label="Recorded By" value={recordedBy} />
          </div>

          {/* Edit button INSIDE the accordion (mobile) */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button
                type="button"
                onClick={() => onEdit?.(deposit)}
                className="btn"
                style={{ background: "transparent", color: "#475569", border: "2px solid gold", padding: "6px 10px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                aria-label="Edit deposit"
                title="Edit"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                  <path fill="currentColor" d="M14.06 9.02l.92.92L6 18.92H5v-1L14.06 9.02M17.66 3c-.25 0-.51.1-.71.29L15.13 5.1l3.75 3.75l1.82-1.82a1.003 1.003 0 0 0 0-1.41L18.37 3.3c-.2-.19-.46-.3-.71-.3zM14.06 6.17L4 16.25V20h3.75l10.06-10.08l-3.75-3.75Z" />
                </svg>
                Edit
              </button>
            </div>
        </>
      ) : null}
    </div>
  );
}


function monthKeyFromDate(dateLike) {
  const d = new Date(dateLike);
  if (isNaN(d)) return "Unknown";
  return d.toLocaleString("default", { month: "long", year: "numeric" }); // e.g., "August 2025"
}

function groupDepositsByMonth(items = []) {
  const groups = {};
  for (const dep of items) {
    const when = dep.date ?? dep.dateISO ?? dep.createdAt;
    const key = monthKeyFromDate(when);
    if (!groups[key]) groups[key] = { total: 0, items: [] };
    groups[key].items.push(dep);
    groups[key].total += Number(dep.amount || 0);
  }
  // sort months descending by date
  const entries = Object.entries(groups).sort((a, b) => {
    const da = new Date(a[0]).getTime() || 0;
    const db = new Date(b[0]).getTime() || 0;
    return db - da;
  });
  return entries; // [ [monthKey, { total, items }], ... ]
}


// labeled block (mobile grid cell)
function Labeled({ label, value }) {
  return (
    <div style={{ background: "#fafbff", border: "1px solid rgb(128,128,128, 0.5)", borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: 13, color: "rgb(0,0,0,1)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 15, color: colors.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value || "—"}
      </div>
    </div>
  );
}

function MonthSection({ month, total, items, isMobile, onEdit }) {
  return (
    <div style={{ marginBottom: 24 /* larger gap between months */ }}>
      {/* Month header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
          padding: "0 2px",
        }}
      >
        <h5 style={{ margin: 0, color: colors.navy }}>{month}</h5>
        {/*<div style={{ fontWeight: 800, color: colors.navy }}>{fmtCurrency(total)}</div>*/}
      </div>

      {/* Cards (each has smaller marginBottom=8) */}
      <div>
        {items.map((d) => (
          <DepositCard key={d._id} deposit={d} isMobile={isMobile} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

function DepositList({ items, isMobile, onEdit }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <div style={{ color: "#666", padding: 12 }}>No deposits found.</div>;
  }
  const grouped = groupDepositsByMonth(items);
  return (
    <div>
      {grouped.map(([month, data]) => (
        <MonthSection key={month} month={month} total={data.total} items={data.items} isMobile={isMobile} onEdit={onEdit}/>
      ))}
    </div>
  );
}

// --- Add Deposit Modal (inline component for now; safe to extract later) ---
// AddDepositModal.jsx

// simple unique id for new deposits (schema requires _id: String)
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const colors = { navy: "#0f172a" };

function AddDepositModal({
  open,
  onClose,
  users = [],                 // [{ _id, fullName }]
  cashLocations = [],         // [{ _id, name }] or strings
  apiEndpoint = `${API_BASE}/deposits`,
  apiUpdateBase = `${API_BASE}/deposits`,
  deposit = null,             // if set => edit mode; should include {_id, ...}
  onSaved,                    // callback(savedPayloadOrNull)
}) {
  const isEdit = !!(deposit && deposit._id);

  // Normalize initial form state
  const initial = React.useMemo(() => {
    if (!isEdit) {
      const firstUserId =
        users?.[0]?._id ?? (users?.[0]?.id ?? (users?.[0] ?? "")); // fallback tolerated
      const firstLoc =
        cashLocations?.[0]
          ? (typeof cashLocations[0] === "string"
              ? cashLocations[0]
              : (cashLocations[0]?._id || cashLocations[0]?.name || ""))
          : "";

      return {
        depositorId: firstUserId || "",
        amount: "",
        date: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
        cashLocation: firstLoc, // prefer id
        type: "Permanent",
        source: "Savings",
        comment: "",
      };
    }

    // Edit mode — read from deposit defensively
    const d = deposit || {};
    const depositorId =
      d.depositor?._id || d.depositorId || d.depositor || d.depositor?.id || "";
    const iso = d.date || d.dateISO || d.createdAt || new Date().toISOString();
    const ymd = new Date(iso);
    const date = isNaN(ymd) ? new Date().toISOString().slice(0, 10) : ymd.toISOString().slice(0, 10);
    const cashLoc =
      typeof d.cashLocation === "string"
        ? d.cashLocation
        : (d.cashLocation?._id || d.cashLocation?.name || "");
    return {
      depositorId,
      amount: d.amount ?? "",
      date,
      cashLocation: cashLoc,
      type: d.type || "Permanent",
      source: d.source || "Savings",
      comment: d.comment || d.notes || "",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, deposit, users, cashLocations]);

  const [form, setForm] = React.useState(initial);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  // Reset when opening or target deposit changes
  React.useEffect(() => {
    if (open) {
      setForm(initial);
      setError("");
      setSubmitting(false);
    }
  }, [open, initial]);

  const escToClose = React.useCallback((e) => {
    if (e.key === "Escape" && open && !submitting) onClose?.();
  }, [open, submitting, onClose]);

  React.useEffect(() => {
    document.addEventListener("keydown", escToClose);
    return () => document.removeEventListener("keydown", escToClose);
  }, [escToClose]);

  if (!open) return null;

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // basic client validation
    if (!form.depositorId) return setError("Please select a depositor.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Amount must be greater than 0.");
    if (!form.date) return setError("Please choose a date.");
    if (!form.cashLocation) return setError("Please select a cash location.");
    if (!form.type) return setError("Please select a deposit type.");
    if (!form.source) return setError("Please select a source.");

    setSubmitting(true);
    try {
// find selected user & location to build subdocs
const selectedUser =
  (users || []).find(u => String(u._id || u.id) === String(form.depositorId)) || {};
const selectedLocRaw =
  (cashLocations || []).find(l =>
    String(typeof l === "string" ? l : (l._id || l.name)) === String(form.cashLocation)
  );

// normalize cash location subdoc
const selectedLoc = typeof selectedLocRaw === "string"
  ? { _id: selectedLocRaw, name: selectedLocRaw } // if you only had a string, use it as both id/name
  : { _id: selectedLocRaw?._id, name: selectedLocRaw?.name };

// NOTE: backend example uses "YYYY-MM-DD" (not ISO). Keep it that way:
const dateYMD = form.date; // already yyyy-mm-dd from <input type="date">

// ensure an id (use crypto if available)
const newId = (typeof crypto !== "undefined" && crypto.randomUUID)
  ? crypto.randomUUID()
  : String(Date.now());

// --- create payload (unchanged; works like Postman) ---
const createPayload = {
  _id: newId,
  depositor: {
    _id: selectedUser._id || selectedUser.id || form.depositorId,
    fullName: selectedUser.fullName || selectedUser.name || "",
  },
  amount: Number(form.amount),
  date: dateYMD, // "YYYY-MM-DD"
  type: form.type,
  source: form.source,
  cashLocation: {
    _id: selectedLoc._id || selectedLoc.name || form.cashLocation,
    name: selectedLoc.name || String(form.cashLocation),
  },
  // recordedBy handled by server (or your temporary fallback)
};

const updatePayload = {
  amount: Number(form.amount),
  date: form.date, // or new Date(form.date).toISOString()
  cashLocationToAdd: {
    _id: selectedLoc._id,
    name: selectedLoc.name,
  },
  cashLocationToDeduct: (deposit?.cashLocation && {
    _id: deposit.cashLocation._id ?? deposit.cashLocation.id ?? deposit.cashLocation,
    name: deposit.cashLocation.name ?? String(deposit.cashLocation),
  }) || undefined,
};


const url = isEdit ? `${apiUpdateBase}/${deposit._id}` : apiEndpoint;
const method = isEdit ? "PUT" : "POST";

const res = await fetch(url, {
  method,
  headers: { "Content-Type": "application/json",  ...(token ? { Authorization: `Bearer ${token}` } : {}), },
  credentials: "include",
  body: JSON.stringify(isEdit ? updatePayload : createPayload),
});

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      // Controller uses sendSuccess(null, ...); may be empty body
      let saved = null;
      try {
        saved = await res.json();
      } catch (_) {
        saved = null;
      }

      onSaved?.(saved ?? null);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Something went wrong while saving the deposit.");
      setSubmitting(false);
    }
  }

  // Normalize cashLocations into { value, label }
  const cashLocationOptions = (cashLocations || []).map((loc) => {
    if (typeof loc === "string") return { value: loc, label: loc };
    return {
      value: loc?._id || loc?.name || String(loc),
      label: loc?.name || loc?._id || String(loc),
    };
  });

  // Sources enum from schema
  const sourceOptions = ["Savings", "Profits", "Excess Loan Payment", "Interest"];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit Deposit" : "Add Deposit"}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 18px 48px rgba(0,0,0,0.18)",
          border: "1px solid rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#f8fafc" }}>
          <div style={{ fontWeight: 700, color: colors.navy, fontSize: 16 }}>
            {isEdit ? "Edit Deposit" : "Add Deposit"}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 22, lineHeight: 1, color: "#475569" }}
          >
            X
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Depositor */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="depositorId" style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#111827" }}>
              Depositor
            </label>
            <select
              id="depositorId"
              name="depositorId"
              value={form.depositorId}
              onChange={onChange}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgb(128,128,128, 0.5)", outline: "none" }}
            >
              {users.length === 0 ? (
                <option value="">No members found</option>
              ) : (
                users.map((u) => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {u.fullName || u.name || "Unknown"}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#111827" }}>
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0"
              inputMode="numeric"
              value={form.amount}
              onChange={onChange}
              placeholder="e.g., 500000"
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgb(128,128,128, 0.5)", outline: "none" }}
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#111827" }}>
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              value={form.date}
              onChange={onChange}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgb(128,128,128, 0.5)", outline: "none" }}
            />
          </div>

          {/* Cash Location */}
          <div>
            <label htmlFor="cashLocation" style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#111827" }}>
              Cash Location
            </label>
            <select
              id="cashLocation"
              name="cashLocation"
              value={form.cashLocation}
              onChange={onChange}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgb(128,128,128, 0.5)", outline: "none" }}
            >
              {cashLocationOptions.length === 0 ? (
                <option value="">No locations found</option>
              ) : (
                cashLocationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#111827" }}>
              Type of Deposit
            </label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={onChange}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgb(128,128,128, 0.5)", outline: "none" }}
            >
              <option value="Permanent">Permanent</option>
              <option value="Temporary">Temporary</option>
            </select>
          </div>

          {/* Source (schema enum) */}
          <div>
            <label htmlFor="source" style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#111827" }}>
              Source
            </label>
            <select
              id="source"
              name="source"
              value={form.source}
              onChange={onChange}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgb(128,128,128, 0.5)", outline: "none" }}
            >
              {sourceOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Comment */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="comment" style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#111827" }}>
              Comment
            </label>
            <textarea
              id="comment"
              name="comment"
              value={form.comment}
              onChange={onChange}
              rows={3}
              placeholder="Optional notes…"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgb(128,128,128, 0.5)", outline: "none", resize: "vertical" }}
            />
          </div>

          {error ? (
            <div style={{ gridColumn: "1 / -1", color: "#b91c1c", fontSize: 13 }}>{error}</div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 16px", background: "#f8fafc" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{ background: "transparent", border: "1px solid #e5e7eb", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ background: "#117a7a", color: "#fff", border: "1px solid transparent", padding: "8px 14px", borderRadius: 8, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? (isEdit ? "Updating…" : "Saving…") : (isEdit ? "Update" : "Submit")}
          </button>
        </div>
      </form>
    </div>
  );
}




  // ---------- page render ----------
  const sidebarTransform = isSidebarOpen ? "translateX(0)" : "translateX(-100%)";
  const navLinks = [
    { text: "Home", to: "/admin" },
    { text: "Deposits", to: "/admin/deposits" },
    { text: "Loans", to: "/admin/loans" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.lightGray, display: "flex" }}>
      <Sidebar
        dashboard={dashboard}
        navLinks={navLinks}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        transform={sidebarTransform}
      />

      {isMobile && isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 999 }} />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <Header isMobile={isMobile} onToggle={() => setIsSidebarOpen((s) => !s)} headerRef={null} dashboard={dashboard} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: spacing.pagePadding, paddingBottom: "0" }}>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid", borderRadius: "5px", backgroundColor: "#117a7a" }}
            aria-label="Add deposit"
            title="Add deposit"
          >
            <span style={{ fontSize: 16, color: "white" }}>Add Deposit</span>
          </button>
          </div>

        <main style={{ flex: 1, overflowY: "auto", padding: spacing.pagePadding, paddingTop: 0 }}>
          {/* Add Deposit Modal */}
          <AddDepositModal
            open={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            users={users}
            cashLocations={cashLocations}
            apiEndpoint={`${API_BASE}/deposits`}           // POST for create
            apiUpdateBase={`${API_BASE}/deposits`}        // PATCH to `${apiUpdateBase}/${id}` for edit
            deposit={selectedDeposit}             // <= when set, modal is in EDIT mode
            onSaved={handleDepositSaved}          // unified callback for add/edit
          />
          {/* no filter/search component per request — records are read from context */}
          {loading ? <div style={{ padding: 12 }}>Loading…</div> : <DepositList items={records} isMobile={isMobile} onEdit={handleOpenEdit}/>}
        </main>
      </div>
    </div>
  );
}
