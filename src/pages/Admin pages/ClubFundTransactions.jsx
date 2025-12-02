// src/pages/ClubFundAnnualPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { THEME } from "../../theme";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { useAdminDashboard } from "../../contexts/AdminDashboardContext";
import { useAuth } from "../../contexts/auth-context";
import { API_BASE } from "../../../config";

const { colors, spacing } = THEME;

// ---------- helpers ----------
function parseYearToInt(y) {
  const n = Number(String(y || "").trim());
  return Number.isFinite(n) ? n : null;
}
function getSortedYears(yearKeys) {
  return (yearKeys || [])
    .map((y) => String(y))
    .map((y) => ({ key: y, n: parseYearToInt(y) }))
    .filter((x) => x.n !== null)
    .sort((a, b) => a.n - b.n)
    .map((x) => x.key);
}
function filterRecordsByYearRange(recordsObj, startY, endY) {
  const allYears = getSortedYears(Object.keys(recordsObj || {}));
  if (!allYears.length) return {};

  const s = startY ? parseYearToInt(startY) : parseYearToInt(allYears[0]);
  const e = endY ? parseYearToInt(endY) : parseYearToInt(allYears[allYears.length - 1]);

  if (s === null && e === null) return {};
  const from = Math.min(s ?? parseYearToInt(allYears[0]), e ?? parseYearToInt(allYears[allYears.length - 1]));
  const to = Math.max(s ?? parseYearToInt(allYears[0]), e ?? parseYearToInt(allYears[allYears.length - 1]));

  const out = {};
  allYears.forEach((y) => {
    const yn = parseYearToInt(y);
    if (yn !== null && yn >= from && yn <= to) out[y] = recordsObj[y];
  });
  return out;
}

function safeMoney(v) {
  const num = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(num) ? num.toLocaleString() : String(v ?? "");
}
function normalizeDateCell(v) {
  if (!v) return "";
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
  return String(v);
}
function computeIncomeExpenseTotals(yearData) {
  const totals = { totalIncome: 0, totalExpenses: 0 };
  const records = Array.isArray(yearData?.records) ? yearData.records : [];
  records.forEach((r) => {
    const amt = typeof r.amount === "number" ? r.amount : Number(String(r.amount).replace(/,/g, ""));
    if (!Number.isFinite(amt)) return;
    if (r.isOutflow) totals.totalExpenses += amt;
    else totals.totalIncome += amt;
  });
  return totals;
}

function hexToRgbArray(hex) {
  const h = (hex || "").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function formatDateTimeForPdf(d = new Date()) {
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
const svgToPngDataUrl = (svgString, sizePx = 64) =>
  new Promise((resolve, reject) => {
    try {
      const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = sizePx * scale;
        canvas.height = sizePx * scale;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load SVG image"));
      img.src = svgDataUrl;
    } catch (e) {
      reject(e);
    }
  });

// ---------- Modal ----------
function AddClubFundRecordModal({
  open,
  onClose,
  onCreated,
  cashLocations = [],
  token,
  apiEndpoint = `${API_BASE}/fund-transactions`, // <-- adjust to your actual route
}) {
  const isDisabled = !open;

  const normalizedCashLocations = useMemo(() => {
    // expected from context: [{_id, name, ...}] ; tolerate strings as fallback
    return (cashLocations || []).map((c) =>
      typeof c === "string"
        ? { _id: c, name: c }
        : { _id: c?._id || c?.id, name: c?.name || c?._id || "Unknown" }
    );
  }, [cashLocations]);

  const initial = useMemo(() => {
    const first = normalizedCashLocations?.[0]?._id || "";
    return {
      transaction_type: "Income",
      name: "",
      reason: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
      account: first,
    };
  }, [normalizedCashLocations]);

  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial);
      setSubmitting(false);
      setError("");
    }
  }, [open, initial]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open && !submitting) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  if (isDisabled) return null;

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.transaction_type) return setError("Please choose Income or Expense.");
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.reason.trim()) return setError("Reason is required.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Amount must be greater than 0.");
    if (!form.date) return setError("Please choose a date.");

    // allow empty account for now (old records are Unavailable), but for new we expect one
    if (!form.account) return setError("Please select an Account.");

    setSubmitting(true);
    try {
      const payload = {
        transaction_type: form.transaction_type,
        name: form.name.trim(),
        reason: form.reason.trim(),
        amount: Number(form.amount),
        date: form.date, // keep YYYY-MM-DD like deposits
        account: form.account, // cash-location id
      };

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      let saved = null;
      try {
        saved = await res.json();
      } catch {
        saved = null;
      }

      // If API returns a created document, prefer it; else fallback to payload
      const accountName =
        normalizedCashLocations.find((c) => String(c._id) === String(form.account))?.name || "Unavailable";

      const createdFrontendRecord = {
        date: (saved && (saved.date || saved.createdAt)) || payload.date,
        name: (saved && saved.name) || payload.name,
        reason: (saved && saved.reason) || payload.reason,
        amount: (saved && (saved.amount ?? payload.amount)) ?? payload.amount,
        account: accountName,
        isOutflow: String(payload.transaction_type).toLowerCase() === "expense",
      };

      onCreated?.(createdFrontendRecord);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Something went wrong while saving the record.");
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Record"
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
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 18px 48px rgba(0,0,0,0.18)",
          border: "1px solid rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#f8fafc" }}>
          <div style={{ fontWeight: 700, color: colors.navy, fontSize: 16 }}>Add Record</div>
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
          {/* Transaction Type */}
          <div>
            <label htmlFor="transaction_type" style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#111827" }}>
              Type
            </label>
            <select
              id="transaction_type"
              name="transaction_type"
              value={form.transaction_type}
              onChange={onChange}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgb(128,128,128, 0.5)", outline: "none" }}
            >
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>

          {/* Account */}
          <div>
            <label htmlFor="account" style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#111827" }}>
              Account
            </label>
            <select
              id="account"
              name="account"
              value={form.account}
              onChange={onChange}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgb(128,128,128, 0.5)", outline: "none" }}
            >
              {normalizedCashLocations.length === 0 ? (
                <option value="">No accounts found</option>
              ) : (
                normalizedCashLocations.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Name */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="name" style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#111827" }}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={onChange}
              placeholder="e.g., Tax, IT refund..."
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgb(128,128,128, 0.5)", outline: "none" }}
            />
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

          {/* Reason */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="reason" style={{ display: "block", fontWeight: "bold", fontSize: 13, marginBottom: 6, color: "#111827" }}>
              Reason
            </label>
            <textarea
              id="reason"
              name="reason"
              value={form.reason}
              onChange={onChange}
              rows={3}
              placeholder="e.g., Web hosting services..."
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgb(128,128,128, 0.5)", outline: "none", resize: "vertical" }}
            />
          </div>

          {error ? <div style={{ gridColumn: "1 / -1", color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
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
            style={{
              background: "#117a7a",
              color: "#fff",
              border: "1px solid transparent",
              padding: "8px 14px",
              borderRadius: 8,
              cursor: "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- Page ----------
export default function ClubFundAnnualPage({ dashboard = "admin" }) {
  const headerRef = useRef(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : true);

  const toggleSidebar = () => setIsSidebarOpen((s) => !s);
  const sidebarTransform = isSidebarOpen ? "translateX(0)" : "translateX(-100%)";

  const navLinks = [
    { text: "Home", to: "/admin" },
    { text: "Deposits", to: "/admin/deposits" },
    { text: "Loans", to: "/admin/loans" },
    { text: "Club Fund", to: "/admin/fundTransactions" },
  ];

  const { adminDashboard } = useAdminDashboard();
  const { token } = useAuth();

  // These should come from your admin context (populated from the service)
  // Expected shape: { "2024": { records: [{date,name,reason,amount,account,isOutflow}, ...] }, ... }
  const annualFromCtx = adminDashboard?.clubFundAnnualSummaries ?? {};

  // cash locations for "Account" dropdown (expects [{_id,name}...])
  const cashLocationsFromCtx = adminDashboard?.cashLocations ?? [];

  // local state mirrors context (so user can add a record and see it instantly)
  const [annualSummaries, setAnnualSummaries] = useState(annualFromCtx);
  useEffect(() => {
    setAnnualSummaries(annualFromCtx ?? {});
  }, [annualFromCtx]);

  const [showYearFilters, setShowYearFilters] = useState(false);
  const [startYear, setStartYear] = useState(null);
  const [endYear, setEndYear] = useState(null);
  const [filteredRecords, setFilteredRecords] = useState({});
  const [isAddOpen, setIsAddOpen] = useState(false);

  const yearKeys = useMemo(() => Object.keys(annualSummaries || {}), [annualSummaries]);
  const yearKeyHash = useMemo(() => yearKeys.join("|"), [yearKeys]);

  // compute cumulative balances across ALL years (not just filtered) for correctness
  const balanceByYear = useMemo(() => {
    const years = getSortedYears(Object.keys(annualSummaries || {}));
    let running = 0;
    const out = {};
    years.forEach((y) => {
      const totals = computeIncomeExpenseTotals(annualSummaries?.[y]);
      running += totals.totalIncome - totals.totalExpenses;
      out[y] = running;
    });
    return out;
  }, [annualSummaries]);

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // init default year filters (pick last available)
  useEffect(() => {
    if (!yearKeys.length) {
      setStartYear(null);
      setEndYear(null);
      setFilteredRecords({});
      return;
    }
    const sorted = getSortedYears(yearKeys);
    const last = sorted[sorted.length - 1];
    const initial = last ?? String(new Date().getFullYear());
    setStartYear((prev) => prev ?? initial);
    setEndYear((prev) => prev ?? initial);
    setFilteredRecords(filterRecordsByYearRange(annualSummaries, initial, initial));
  }, [yearKeyHash]); // eslint-disable-line react-hooks/exhaustive-deps

  // keep filtered view in sync as records change
  useEffect(() => {
    if (!startYear || !endYear) return;
    setFilteredRecords(filterRecordsByYearRange(annualSummaries, startYear, endYear));
  }, [annualSummaries, startYear, endYear]);

  function toggleYearFilters() {
    setShowYearFilters((s) => !s);
  }

  function handleApplyFilters() {
    const s = parseYearToInt(startYear);
    const e = parseYearToInt(endYear);
    if (s !== null && e !== null && s > e) {
      const tmp = startYear;
      setStartYear(endYear);
      setEndYear(tmp);
      setFilteredRecords(filterRecordsByYearRange(annualSummaries, endYear, tmp));
    } else {
      setFilteredRecords(filterRecordsByYearRange(annualSummaries, startYear, endYear));
    }
    setShowYearFilters(false);
  }

  function handleCreatedRecord(frontendRecord) {
    // Insert record into local annualSummaries under its year (fast UI update)
    const d = new Date(frontendRecord?.date);
    const y = !Number.isNaN(d.getTime()) ? String(d.getFullYear()) : String(startYear || new Date().getFullYear());

    setAnnualSummaries((prev) => {
      const next = { ...(prev || {}) };
      const bucket = next[y] ? { ...next[y] } : { records: [] };
      const records = Array.isArray(bucket.records) ? bucket.records.slice() : [];
      records.unshift(frontendRecord);
      bucket.records = records;
      next[y] = bucket;
      return next;
    });
  }

  async function handleDownload(format) {
    if (format === "excel") exportToExcel(filteredRecords);
    if (format === "pdf") await exportToPDF(filteredRecords);
    setShowYearFilters(false);
  }

  // ---------- Exports ----------
  function exportToExcel(filtered) {
    const wb = XLSX.utils.book_new();
    const years = getSortedYears(Object.keys(filtered || {}));

    years.forEach((year) => {
      const data = filtered?.[year] || {};
      const totals = computeIncomeExpenseTotals(data);
      const balance = balanceByYear?.[year] ?? (totals.totalIncome - totals.totalExpenses);

      const wsData = [
        [`Total Income: ${totals.totalIncome.toLocaleString()}`, `Total Expenses: ${totals.totalExpenses.toLocaleString()}`],
        [`Account Balance: ${safeMoney(balance)}`],
        [],
        ["Date", "Name", "Reason", "Amount", "Account"],
        ...(Array.isArray(data.records)
          ? data.records.map((r) => [normalizeDateCell(r.date), r.name, r.reason, safeMoney(r.amount), r.account])
          : []),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wpx: 110 }, { wpx: 160 }, { wpx: 260 }, { wpx: 110 }, { wpx: 170 }];
      XLSX.utils.book_append_sheet(wb, ws, String(year).slice(0, 31));
    });

    XLSX.writeFile(wb, "club_fund_annual_records.xlsx");
  }

  async function exportToPDF(filtered) {
    try {
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const navyRgb = hexToRgbArray(colors.navy);
      const goldRgb = hexToRgbArray(colors.gold);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const marginX = 40;
      const headerH = 72;
      const footerH = 44;

      const totalPagesExp = "{total_pages_count_string}";
      const generatedAt = formatDateTimeForPdf(new Date());

      const years = getSortedYears(Object.keys(filtered || {}));
      const rangeLabel =
        years.length === 0 ? "No range selected" : years.length === 1 ? years[0] : `${years[0]}  –  ${years[years.length - 1]}`;

      const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:2"><path d="M34.586 56V35.13c0-4.982 1.796-9.796 5.059-13.561l2.209-2.548M34.586 34.189l-.542-4.88a10.567 10.567 0 0 0-3.231-6.5l-7.855-7.446" style="fill:none;stroke:#222a33;stroke-width:1.5px"/><path d="M31.573 23.53s1.466-5.289-1.347-9.69c-2.106-3.294-10.288-5.185-14.271-5.928a2.017 2.017 0 0 0-2.381 1.953c-.041 3.013.538 8.394 4.539 12.696 5.897 6.34 11.144 3.876 11.144 3.876M37.526 24.015s-1.84-3.921-.233-7.717c1.14-2.691 6.685-5.123 9.818-6.311a2.016 2.016 0 0 1 2.706 1.573c.359 2.418.407 6.336-1.948 9.922-3.75 5.712-8.157 4.488-8.157 4.488M27.975 20.119h-5.549M34.586 40.574l-3.733 4.978A6.616 6.616 0 0 1 27.167 48l-4.206 1.051a6.61 6.61 0 0 0-4.067 3.013l-2.019 3.365M26.231 48.255 25.23 54.5M34.586 45.716l4.029 5.64a6.612 6.612 0 0 0 4.561 2.718l6.265.783" style="fill:none;stroke:#222a33;stroke-width:1.5px"/></svg>`;

      let logoPng = null;
      try {
        logoPng = await svgToPngDataUrl(logoSvg, 64);
      } catch {
        logoPng = null;
      }

      function drawHeader({ yearLabel }) {
        doc.setDrawColor(...goldRgb);
        doc.setLineWidth(3);
        doc.line(marginX, 20, pageWidth - marginX, 20);

        const logoSize = 26;
        const logoX = marginX;
        const logoY = 28;
        if (logoPng) doc.addImage(logoPng, "PNG", logoX, logoY, logoSize, logoSize);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(...goldRgb);
        const brandX = logoX + logoSize + 10;
        doc.text("GrowthSpring", brandX, 48);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...navyRgb);
        // Measure brand text and add a small gap
        const brandW = doc.getTextWidth("GrowthSpring");
        doc.text("Fund Transactions Report", brandX + brandW + 65, 48);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text(`Generated: ${generatedAt}`, pageWidth - marginX, 40, { align: "right" });
        doc.text(`Range: ${rangeLabel}`, pageWidth - marginX, 54, { align: "right" });

        if (yearLabel) {
          doc.setTextColor(...navyRgb);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(yearLabel, pageWidth - marginX, 68, { align: "right" });
        }

        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(1);
        doc.line(marginX, headerH, pageWidth - marginX, headerH);
      }

      function drawFooter() {
        const pageNumber = doc.internal.getNumberOfPages();
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(1);
        doc.line(marginX, pageHeight - footerH, pageWidth - marginX, pageHeight - footerH);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text("GrowthSpring • Internal Use", marginX, pageHeight - 20);

        const pageStr = `Page ${pageNumber} of ${totalPagesExp}`;
        doc.text(pageStr, pageWidth - marginX, pageHeight - 20, { align: "right" });
      }

      if (!years.length) {
        drawHeader({ yearLabel: "" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(...navyRgb);
        doc.text("No records found for the selected range.", marginX, headerH + 40);
        drawFooter();
        if (typeof doc.putTotalPages === "function") doc.putTotalPages(totalPagesExp);
        doc.save("club_fund_annual_records.pdf");
        return;
      }

      years.forEach((year, idx) => {
        const data = filtered?.[year] || {};
        if (idx > 0) doc.addPage();

        const totals = computeIncomeExpenseTotals(data);
        const balance = balanceByYear?.[year] ?? (totals.totalIncome - totals.totalExpenses);

        drawHeader({ yearLabel: `Year: ${year}` });

        // Summary card
        const boxY = headerH + 18;
        const boxH = 86;
        const boxW = pageWidth - marginX * 2;

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(marginX, boxY, boxW, boxH, 10, 10, "F");

        doc.setFillColor(...goldRgb);
        doc.roundedRect(marginX, boxY, 6, boxH, 10, 10, "F");

        // vertical divider
        const midX = marginX + boxW / 2;
        doc.setDrawColor(228, 228, 228);
        doc.setLineWidth(1);
        doc.line(midX, boxY + 12, midX, boxY + boxH - 12);

        const col1X = marginX + 18;
        const col2X = midX + 18;

        const row1Y = boxY + 30;
        const row2Y = boxY + 58;
        const row3Y = boxY + 82;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);

        // labels
        doc.text("Total Income", col1X, row1Y);
        doc.text("Total Expenses", col2X, row1Y);

        doc.text("Account Balance", col1X, row2Y); // IMPORTANT: stays on LEFT side of divider

        // values
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...navyRgb);

        // left value (income) aligns near divider
        doc.text(safeMoney(totals.totalIncome), midX - 14, row1Y, { align: "right" });

        // right value (expenses) aligns to page right
        doc.text(safeMoney(totals.totalExpenses), pageWidth - marginX, row1Y, { align: "right" });

        // balance value ALSO stays on LEFT side (not across divider)
        doc.text(safeMoney(balance), midX - 14, row2Y, { align: "right" });

        const body = (Array.isArray(data.records) ? data.records : []).map((r) => [
          normalizeDateCell(r.date),
          String(r.name || ""),
          String(r.reason || ""),
          safeMoney(r.amount),
          String(r.account || ""),
        ]);

        const startTableY = boxY + boxH + 18;

        autoTable(doc, {
          startY: startTableY,
          margin: { left: marginX, right: marginX, top: headerH + 10, bottom: footerH + 10 },
          head: [["Date", "Name", "Reason", "Amount", "Account"]],
          body,
          theme: "grid",
          styles: {
            font: "helvetica",
            fontSize: 9.5,
            cellPadding: 6,
            textColor: [40, 40, 40],
            lineColor: [225, 225, 225],
            lineWidth: 0.8,
          },
          headStyles: {
            fillColor: navyRgb,
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            3: { halign: "right" }, // Amount
            2: { cellWidth: 220 }, // Reason
          },
          didDrawPage: () => {
            drawHeader({ yearLabel: `Year: ${year}` });
            drawFooter();
          },
        });

        if (!body.length) {
          const y = Math.max(startTableY + 28, doc.lastAutoTable?.finalY + 18 || startTableY + 60);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(110, 110, 110);
          doc.text("No records for this year.", marginX, y);
        }
      });

      if (typeof doc.putTotalPages === "function") doc.putTotalPages(totalPagesExp);
      doc.save("club_fund_annual_records.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Check console for details.");
    }
  }

  // ---------- UI bits ----------
  const ToggleFiltersButton = ({ onClick, open }) => (
    <button
      onClick={onClick}
      style={{
        color: "white",
        backgroundColor: open ? colors.navy : "#117a7a",
        border: "none",
        padding: "8px 12px",
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      {open ? "Hide Year Filters" : "Show Year Filters"}
    </button>
  );

  const AddRecordButton = ({ onClick }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: "none",
        borderRadius: 8,
        backgroundColor: "#117a7a",
        padding: "8px 12px",
        cursor: "pointer",
        color: "white",
        fontWeight: 600,
      }}
      aria-label="Add record"
      title="Add record"
    >
      Add Record
    </button>
  );

  const YearFilters = ({ startVal, endVal, onChangeStart, onChangeEnd, onApply, onDownloadExcel, onDownloadPdf }) => (
    <div
      style={{
        padding: 12,
        backgroundColor: "#fff",
        border: `1px solid rgba(0,0,0,0.06)`,
        borderRadius: 8,
        boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
        overflowX: "auto",
        marginTop: "1vh",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 14, color: colors.navy }}>Start Year:</label>
          <input type="number" value={startVal ?? ""} onChange={(e) => onChangeStart(e.target.value)} style={{ width: 110 }} placeholder="e.g. 2024" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 14, color: colors.navy }}>End Year:</label>
          <input type="number" value={endVal ?? ""} onChange={(e) => onChangeEnd(e.target.value)} style={{ width: 110 }} placeholder="e.g. 2025" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8vw", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={onApply}
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                border: "none",
                background: "#3b82f6",
                color: "#fff",
                minWidth: 96,
              }}
            >
              Apply Filters
            </button>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.navy, marginRight: 8 }}>Download Files</div>

            <button
              onClick={onDownloadExcel}
              title="Download Excel"
              aria-label="Download Excel"
              style={{ padding: "8px 10px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M19 2H8C6.9 2 6 2.9 6 4V20C6 21.1 6.9 22 8 22H19C20.1 22 21 21.1 21 20V4C21 2.9 20.1 2 19 2Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 2V6H17" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 11H15" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 14H15" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 17H13" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              onClick={onDownloadPdf}
              title="Download PDF"
              aria-label="Download PDF"
              style={{ padding: "8px 10px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M14 2H6C5 2 4 3 4 4V20C4 21 5 22 6 22H18C19 22 20 21 20 20V8L14 2Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2V8H20" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 13H15" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 17H15" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const YearSummary = ({ year, data = {} }) => {
    const totals = computeIncomeExpenseTotals(data);
    const balance = balanceByYear?.[year] ?? (totals.totalIncome - totals.totalExpenses);

    return (
      <div style={{ marginBottom: 16, overflow: "hidden", border: "2px solid #ccc", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ background: "#f9fafb" }}>
              <td style={{ padding: "10px 14px", fontWeight: "bold" }}>Total Income:</td>
              <td style={{ padding: "10px 14px", fontWeight: "bold", color: "green", textAlign: "right" }}>
                {(totals.totalIncome || 0).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "10px 14px", fontWeight: "bold" }}>Total Expenses:</td>
              <td style={{ padding: "10px 14px", fontWeight: "bold", color: "red", textAlign: "right" }}>
                {(totals.totalExpenses || 0).toLocaleString()}
              </td>
            </tr>
            <tr style={{ background: "#f9fafb" }}>
              <td style={{ padding: "10px 14px", fontWeight: "bold" }}>Account Balance:</td>
              <td style={{ padding: "10px 14px", fontWeight: "bold", color: colors.navy, textAlign: "right" }}>{safeMoney(balance)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const RecordsTable = ({ records = [] }) => (
    <div style={{ overflowX: "auto", border: "2px solid #ccc", borderRadius: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
        <thead>
          <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #ccc" }}>
            <th style={{ padding: "10px 14px", textAlign: "left" }}>Date</th>
            <th style={{ padding: "10px 14px", textAlign: "left" }}>Name</th>
            <th style={{ padding: "10px 14px", textAlign: "left" }}>Reason</th>
            <th style={{ padding: "10px 14px", textAlign: "right" }}>Amount</th>
            <th style={{ padding: "10px 14px", textAlign: "left" }}>Account</th>
          </tr>
        </thead>
        <tbody>
          {(records || []).map((r, i) => {
            const bg = i % 2 === 0 ? "#fff" : "#f9fafb";
            return (
              <tr key={`${r.date}-${r.name}-${i}`} style={{ background: bg, borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "10px 14px" }}>{normalizeDateCell(r.date)}</td>
                <td style={{ padding: "10px 14px", color: r.isOutflow ? "red" : "green" }}>{r.name}</td>
                <td style={{ padding: "10px 14px" }}>{r.reason}</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>{safeMoney(r.amount)}</td>
                <td style={{ padding: "10px 14px" }}>{r.account || "Unavailable"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const YearBlock = ({ year, data }) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h5 style={{ margin: 0, color: colors.navy }}>{year}</h5>
      </div>

      <YearSummary year={year} data={data} />
      <RecordsTable records={data.records || []} />
    </div>
  );

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
        <Header isMobile={isMobile} onToggle={toggleSidebar} headerRef={headerRef} dashboard={dashboard} />

        <div style={{ padding: 0.5 * spacing.pagePadding }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <ToggleFiltersButton onClick={toggleYearFilters} open={showYearFilters} />
            <AddRecordButton onClick={() => setIsAddOpen(true)} />
          </div>

          {showYearFilters && (
            <YearFilters
              startVal={startYear}
              endVal={endYear}
              onChangeStart={(v) => setStartYear(v)}
              onChangeEnd={(v) => setEndYear(v)}
              onApply={handleApplyFilters}
              onDownloadExcel={() => handleDownload("excel")}
              onDownloadPdf={() => handleDownload("pdf")}
            />
          )}
        </div>

        <main style={{ flex: 1, overflowY: "auto", padding: 0.5 * spacing.pagePadding, paddingTop: 0 }}>
          <div>
            {Object.entries(filteredRecords).length === 0 && <div style={{ color: "#666" }}>No records found for the selected range.</div>}

            {Object.entries(filteredRecords).map(([year, data]) => (
              <YearBlock key={year} year={year} data={data} />
            ))}
          </div>
        </main>

        <AddClubFundRecordModal
          open={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onCreated={handleCreatedRecord}
          cashLocations={cashLocationsFromCtx}
          token={token}
          apiEndpoint={`${API_BASE}/fund-transactions`} 
        />
      </div>
    </div>
  );
}
