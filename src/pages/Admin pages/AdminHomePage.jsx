// src/pages/AdminHome.jsx
import React, { useEffect, useRef, useState } from "react";
import { THEME } from "../../theme";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { useAdminDashboard } from "../../contexts/AdminDashboardContext";

const { colors, spacing, sizes } = THEME;

export default function AdminHomePage({dashboard = "admin" }) {
  // layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const headerRef = useRef(null);
  const toggleSidebar = () => setIsSidebarOpen((s) => !s);
  const sidebarTransform = isSidebarOpen ? "translateX(0)" : "translateX(-100%)";


  const navLinks = [
    { text: "Home", to: "/admin" },
    { text: "Deposits", to: "/admin/deposits" },
    { text: "Loans", to: "/admin/loans" },
    { text: "Club Fund", to: "/admin/fundTransactions" },
  ];
  
  const { adminDashboard, isLoading, error } = useAdminDashboard();
  const adminOverview = adminDashboard?.adminOverview;

  // derive records safely (can be empty object during loading)
  const records = React.useMemo(
    () => adminOverview?.monthlySummaries ?? {},
    [adminOverview]
  );

 
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [startMonth, setStartMonth] = React.useState(null);
  const [endMonth, setEndMonth] = React.useState(null);
  const [filteredRecords, setFilteredRecords] = React.useState({});  
  const [showMonthFilters, setShowMonthFilters] = React.useState(false);

  // keep a stable sorted list of month keys
  const monthsSorted = getSortedMonths(Object.keys(records));

  // helpers: parse & format
  function parseMonthStringToDate(monthStr) {
    // monthStr expected like "January 2025" — parse to Date at first of month
    const d = new Date(monthStr);
    if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), 1);
    // fallback try splitting
    const [monthName, year] = (monthStr || "").split(" ");
    if (!monthName || !year) return null;
    const test = new Date(`${monthName} 1, ${year}`);
    return isNaN(test) ? null : new Date(test.getFullYear(), test.getMonth(), 1);
  }

  function formatMonthForInput(month) {
    // month is e.g. "January 2025" -> "2025-01"
    const d = parseMonthStringToDate(month);
    if (!d) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  }

  function formatInputToMonthString(value) {
    // value is "YYYY-MM" -> "MonthName YYYY"
    if (!value) return "";
    const [yyyy, mm] = value.split("-");
    const d = new Date(Number(yyyy), Number(mm) - 1, 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  }

  // sort month keys by their date value (ascending)
  function getSortedMonths(monthKeys) {
    return (monthKeys || [])
      .map((m) => ({ key: m, date: parseMonthStringToDate(m) }))
      .filter((x) => x.date)
      .sort((a, b) => a.date - b.date)
      .map((x) => x.key);
  }

// Filter records between startMonth and endMonth inclusive
function filterRecordsByMonthRange(recordsObj, startM, endM) {
  const allMonths = getSortedMonths(Object.keys(recordsObj));
  if (!allMonths.length) return {};

  // helper: find index of the first month >= requested month
  function findNextIndex(monthList, monthStr) {
    const target = parseMonthStringToDate(monthStr);
    if (!target) return -1;
    return monthList.findIndex((m) => {
      const d = parseMonthStringToDate(m);
      return d && d.getTime() >= target.getTime();
    });
  }

  // default to full range if missing (we'll try to resolve provided values first)
  const defaultStart = allMonths[0];
  const defaultEnd = allMonths[allMonths.length - 1];

  // attempt to locate start and end indices; if not found, choose the next available month after requested
  let startIdx = startM ? allMonths.indexOf(startM) : allMonths.indexOf(defaultStart);
  if (startM && startIdx === -1) startIdx = findNextIndex(allMonths, startM);

  let endIdx = endM ? allMonths.indexOf(endM) : allMonths.indexOf(defaultEnd);
  if (endM && endIdx === -1) endIdx = findNextIndex(allMonths, endM);

  // if both unresolved, return empty
  if (startIdx === -1 && endIdx === -1) return {};

  // fallback to sensible defaults if one side still unresolved
  if (startIdx === -1) startIdx = 0;
  if (endIdx === -1) endIdx = allMonths.length - 1;

  const from = Math.min(startIdx, endIdx);
  const to = Math.max(startIdx, endIdx);
  const picked = allMonths.slice(from, to + 1);
  const out = {};
  picked.forEach((k) => {
    out[k] = recordsObj[k];
  });
  return out;
}


  // initialize default current month filters (use last month key if available)
  const monthKeys = React.useMemo(() => Object.keys(records), [records]);
  const monthKeyHash = React.useMemo(() => monthKeys.join("|"), [monthKeys]);

  // initialize defaults when records (month set) changes
  useEffect(() => {
    if (!monthKeys.length) {
      setStartMonth(null);
      setEndMonth(null);
      setFilteredRecords({});
      return;
    }
    const sorted = getSortedMonths(monthKeys);
    const current = sorted.length ? sorted[sorted.length - 1] : null; // last available month
    const initial =
      current ?? new Date().toLocaleString("default", { month: "long", year: "numeric" });
    setStartMonth(initial);
    setEndMonth(initial);
    setFilteredRecords(filterRecordsByMonthRange(records, initial, initial));
  }, [monthKeyHash, records, monthKeys]);


  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // apply filters (ensures start <= end, swaps only if necessary)
  function handleApplyFilters() {
    const sDate = parseMonthStringToDate(startMonth);
    const eDate = parseMonthStringToDate(endMonth);
    if (!sDate || !eDate) {
      // fallback: compute from strings (no-op)
    }
    // if start is after end, swap
    if (sDate && eDate && sDate > eDate) {
      const tmp = startMonth;
      setStartMonth(endMonth);
      setEndMonth(tmp);
      const updated = filterRecordsByMonthRange(records, endMonth, tmp);
      setFilteredRecords(updated);
    } else {
      const updated = filterRecordsByMonthRange(records, startMonth, endMonth);
      setFilteredRecords(updated);
    }
    setShowMonthFilters(false);
  }

  function handleMonthChange(isStart, val) {
    // val is YYYY-MM from <input type="month">
    const formatted = formatInputToMonthString(val);
    if (isStart) setStartMonth(formatted);
    else setEndMonth(formatted);
  }

  function toggleMonthFilters() {
    setShowMonthFilters((s) => !s);
  }

// download handlers
async function handleDownload(format) {
  if (format === "excel") {
    exportToExcel(filteredRecords);
  } else if (format === "pdf") {
    // wait for async PDF export to finish (handles dynamic import)
    await exportToPDF(filteredRecords);
  }
  setShowMonthFilters(false);
}


  // compute totals if not present on month data
  function computeTotalsFromRecords(data) {
    // return object with totals: totalInflow, totalOutflow, totalLoanPayments, totalDeposits, totalLoans
    const totals = {
      totalInflow: 0,
      totalOutflow: 0,
      totalLoanPayments: 0,
      totalDeposits: 0,
      totalLoans: 0,
    };
    if (!data || !Array.isArray(data.records)) return totals;
    data.records.forEach((r) => {
      const isOutflow = !!r.isOutflow || (r.type && !["Deposit", "Loan Payment"].includes(r.type));
      if (isOutflow) totals.totalOutflow += r.amount;
      else totals.totalInflow += r.amount;

      if (r.type === "Loan Payment") totals.totalLoanPayments += r.amount;
      if (r.type === "Loan") totals.totalLoans += r.amount;
      if (r.type === "Deposit") totals.totalDeposits += r.amount;
    });
    return totals;
  }

  // Exports
  function exportToExcel(filtered) {
    const wb = XLSX.utils.book_new();
    Object.entries(filtered).forEach(([month, data]) => {
      // compute totals either from provided totals or from records
      const totalsProvided = {
        totalInflow: data.totalInflow ?? 0,
        totalOutflow: data.totalOutflow ?? 0,
        totalLoanPayments: data.totalLoanPayments ?? 0,
        totalDeposits: data.totalDeposits ?? 0,
        totalLoans: data.totalLoans ?? 0,
      };
      const computed = computeTotalsFromRecords(data);
      const totals = {
        totalInflow: totalsProvided.totalInflow || computed.totalInflow,
        totalOutflow: totalsProvided.totalOutflow || computed.totalOutflow,
        totalDeposits: totalsProvided.totalDeposits || computed.totalDeposits,
        totalLoans: totalsProvided.totalLoans || computed.totalLoans,
        totalLoanPayments: totalsProvided.totalLoanPayments || computed.totalLoanPayments,
      };

      const wsData = [
        [`Total Inflow: ${totals.totalInflow.toLocaleString()}`, `Total Outflow: ${totals.totalOutflow.toLocaleString()}`],
        [`Total Deposits: ${totals.totalDeposits.toLocaleString()}`, `Total Loans: ${totals.totalLoans.toLocaleString()}`, `Total Loan Payments: ${totals.totalLoanPayments.toLocaleString()}`],
        [],
        ["Date", "Type", "Name", "Amount", "Source/Destination"],
        ...(Array.isArray(data.records)
          ? data.records.map((record) => [
              new Date(record.date).toLocaleDateString(),
              record.type,
              record.name,
              record.amount?.toLocaleString?.() ?? String(record.amount),
              record.destination || record.source || "",
            ])
          : []),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wpx: 100 }, { wpx: 150 }, { wpx: 150 }, { wpx: 100 }, { wpx: 180 }];
      XLSX.utils.book_append_sheet(wb, ws, month.slice(0, 31)); // sheet name limited length
    });

    XLSX.writeFile(wb, "financial_records.xlsx");
  }

  function hexToRgbArray(hex) {
    const h = (hex || "").replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return [0, 0, 0];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  
  function formatDateTimeForPdf(d = new Date()) {
    // e.g. "29 Nov 2025, 14:07"
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  
  function safeMoney(v) {
    const num = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
    return Number.isFinite(num) ? num.toLocaleString() : String(v ?? "");
  }
  
  function normalizeDateCell(v) {
    // tries to make date look consistent; falls back to original
    if (!v) return "";
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
    return String(v);
  }
  
  // A clean “sample logo” drawn as vector (no asset needed).
  // If you later want a real image logo, see note inside exportToPDF.
  function drawSampleLogo(doc, x, y, size, navyRgb, goldRgb) {
    // gold circle
    doc.setFillColor(...goldRgb);
    doc.circle(x + size / 2, y + size / 2, size / 2, "F");
    // "GS" in navy
    doc.setTextColor(...navyRgb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(Math.max(10, Math.floor(size * 0.45)));
    doc.text("GS", x + size * 0.22, y + size * 0.68);
  }
  
  async function exportToPDF(filtered) {
    try {
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
  
      // ---- local helpers (drop-in)
      const hexToRgbArray = (hex) => {
        const h = (hex || "").replace("#", "").trim();
        const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
        const n = parseInt(full, 16);
        if (Number.isNaN(n)) return [0, 0, 0];
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      };
  
      const formatDateTimeForPdf = (d = new Date()) =>
        d.toLocaleString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  
      const safeMoney = (v) => {
        const num = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
        return Number.isFinite(num) ? num.toLocaleString() : String(v ?? "");
      };
  
      const normalizeDateCell = (v) => {
        if (!v) return "";
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
        return String(v);
      };
  
      const svgToPngDataUrl = (svgString, sizePx = 64) =>
        new Promise((resolve, reject) => {
          try {
            const svgDataUrl =
              "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
  
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
  
      // ---- Theme colors
      const navyRgb = hexToRgbArray(colors.navy);
      const goldRgb = hexToRgbArray(colors.gold);
  
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
  
      const marginX = 40;
      const headerH = 72;
      const footerH = 44;
  
      const totalPagesExp = "{total_pages_count_string}";
      const generatedAt = formatDateTimeForPdf(new Date());
  
      const months = getSortedMonths(Object.keys(filtered || {}));
      const rangeLabel =
        months.length === 0
          ? "No range selected"
          : months.length === 1
          ? months[0]
          : `${months[0]}  –  ${months[months.length - 1]}`;
  
      // ---- SVG logo
      const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:2"><path d="M34.586 56V35.13c0-4.982 1.796-9.796 5.059-13.561l2.209-2.548M34.586 34.189l-.542-4.88a10.567 10.567 0 0 0-3.231-6.5l-7.855-7.446" style="fill:none;stroke:#222a33;stroke-width:1.5px"/><path d="M31.573 23.53s1.466-5.289-1.347-9.69c-2.106-3.294-10.288-5.185-14.271-5.928a2.017 2.017 0 0 0-2.381 1.953c-.041 3.013.538 8.394 4.539 12.696 5.897 6.34 11.144 3.876 11.144 3.876M37.526 24.015s-1.84-3.921-.233-7.717c1.14-2.691 6.685-5.123 9.818-6.311a2.016 2.016 0 0 1 2.706 1.573c.359 2.418.407 6.336-1.948 9.922-3.75 5.712-8.157 4.488-8.157 4.488M27.975 20.119h-5.549M34.586 40.574l-3.733 4.978A6.616 6.616 0 0 1 27.167 48l-4.206 1.051a6.61 6.61 0 0 0-4.067 3.013l-2.019 3.365M26.231 48.255 25.23 54.5M34.586 45.716l4.029 5.64a6.612 6.612 0 0 0 4.561 2.718l6.265.783" style="fill:none;stroke:#222a33;stroke-width:1.5px"/></svg>`;
  
      let logoPng = null;
      try {
        logoPng = await svgToPngDataUrl(logoSvg, 64);
      } catch {
        logoPng = null;
      }
  
      function drawHeader({ monthLabel }) {
        // Top accent
        doc.setDrawColor(...goldRgb);
        doc.setLineWidth(3);
        doc.line(marginX, 20, pageWidth - marginX, 20);
  
        // Logo
        const logoSize = 26;
        const logoX = marginX;
        const logoY = 28;
        if (logoPng) doc.addImage(logoPng, "PNG", logoX, logoY, logoSize, logoSize);
  
        // Brand name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(...goldRgb);
        const brandX = logoX + logoSize + 10;
        const brandY = 48;
        doc.text("GrowthSpring", brandX, brandY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...navyRgb);
        // Measure brand text and add a small gap
        const brandW = doc.getTextWidth("GrowthSpring");
        doc.text("Financial Records Report", brandX + brandW + 65, brandY);        
  
        // Right meta
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text(`Generated: ${generatedAt}`, pageWidth - marginX, 40, { align: "right" });
        doc.text(`Range: ${rangeLabel}`, pageWidth - marginX, 54, { align: "right" });
  
        if (monthLabel) {
          doc.setTextColor(...navyRgb);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(monthLabel, pageWidth - marginX, 68, { align: "right" });
        }
  
        // Divider under header
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
  
      // Empty state
      if (!months.length) {
        drawHeader({ monthLabel: "" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(...navyRgb);
        doc.text("No records found for the selected range.", marginX, headerH + 40);
        drawFooter();
        if (typeof doc.putTotalPages === "function") doc.putTotalPages(totalPagesExp);
        doc.save("financial_records.pdf");
        return;
      }
  
      months.forEach((month, idx) => {
        const data = filtered[month] || {};
        if (idx > 0) doc.addPage();
  
        const totalsProvided = {
          totalInflow: data.totalInflow ?? 0,
          totalOutflow: data.totalOutflow ?? 0,
          totalLoanPayments: data.totalLoanPayments ?? 0,
          totalDeposits: data.totalDeposits ?? 0,
          totalLoans: data.totalLoans ?? 0,
        };
        const computed = computeTotalsFromRecords(data);
        const totals = {
          totalInflow: totalsProvided.totalInflow || computed.totalInflow,
          totalOutflow: totalsProvided.totalOutflow || computed.totalOutflow,
          totalDeposits: totalsProvided.totalDeposits || computed.totalDeposits,
          totalLoans: totalsProvided.totalLoans || computed.totalLoans,
          totalLoanPayments: totalsProvided.totalLoanPayments || computed.totalLoanPayments,
        };
  
        drawHeader({ monthLabel: `Month: ${month}` });
  
        // ---- Summary card (reverted arrangement + fonts, keep vertical divider)
        const boxY = headerH + 18;
        const boxH = 86;
        const boxW = pageWidth - marginX * 2;
  
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(marginX, boxY, boxW, boxH, 10, 10, "F");
  
        // left accent
        doc.setFillColor(...goldRgb);
        doc.roundedRect(marginX, boxY, 6, boxH, 10, 10, "F");
  
        // vertical separator line
        const midX = marginX + boxW / 2;
        doc.setDrawColor(228, 228, 228);
        doc.setLineWidth(1);
        doc.line(midX, boxY + 12, midX, boxY + boxH - 12);
  
        const col1X = marginX + 18;
        const col2X = midX + 18;
  
        const row1Y = boxY + 26;
        const row2Y = boxY + 52;
        const row3Y = boxY + 78;
  
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
  
        // labels
        doc.text("Total Inflow", col1X, row1Y);
        doc.text("Total Outflow / Loans", col1X, row2Y);
        doc.text("Total Deposits", col1X, row3Y);
  
        doc.text("Total Loan Payments", col2X, row1Y);
        doc.text("Total Loans", col2X, row2Y);
  
        // values
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...navyRgb);
  
        // left values align near mid divider (right-aligned)
        doc.text(safeMoney(totals.totalInflow), midX - 14, row1Y, { align: "right" });
        doc.text(safeMoney(totals.totalOutflow), midX - 14, row2Y, { align: "right" });
        doc.text(safeMoney(totals.totalDeposits), midX - 14, row3Y, { align: "right" });
  
        // right values align to page right margin
        doc.text(safeMoney(totals.totalLoanPayments), pageWidth - marginX, row1Y, { align: "right" });
        doc.text(safeMoney(totals.totalLoans), pageWidth - marginX, row2Y, { align: "right" });
  
        // ---- Table (4 columns; no Name)
        const body = (Array.isArray(data.records) ? data.records : []).map((r) => [
          normalizeDateCell(r.date),
          String(r.type || ""),
          safeMoney(r.amount),
          String(r.destination || r.source || ""),
        ]);
  
        const startTableY = boxY + boxH + 18;
  
        autoTable(doc, {
          startY: startTableY,
          margin: { left: marginX, right: marginX, top: headerH + 10, bottom: footerH + 10 },
          head: [["Date", "Type", "Amount", "Source / Destination"]],
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
            2: { halign: "right" }, // Amount
          },
          didDrawPage: () => {
            drawHeader({ monthLabel: `Month: ${month}` });
            drawFooter();
          },
        });
  
        if (!body.length) {
          const y = Math.max(startTableY + 34, doc.lastAutoTable?.finalY + 18 || startTableY + 60);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(110, 110, 110);
          doc.text("No records for this month.", marginX, y);
        }
      });
  
      if (typeof doc.putTotalPages === "function") doc.putTotalPages(totalPagesExp);
      doc.save("financial_records.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Check console for details.");
    }
  }
  
      

  // UI components inside this file (can be moved to separate files later)
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
      {open ? "Hide Month Filters" : "Show Month Filters"}
    </button>
  );

  const MonthFilters = ({ startVal, endVal, onChangeStart, onChangeEnd, onApply, onDownloadExcel, onDownloadPdf }) => {
    // compute top/left/right so the fixed panel sits nicely under header and to the right of sidebar
    const headerHeight = headerRef.current?.getBoundingClientRect?.().height || 64;
    const leftOffset = isMobile ? spacing.pagePadding : (isSidebarOpen ? 260 : 220);
    const rightOffset = spacing.pagePadding;
  
    return (
      <div
        style={{
          padding: 12,
          backgroundColor: "#fff",
          border: `1px solid rgba(0,0,0,0.06)`,
          borderRadius: 8,
          boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
          // make sure it doesn't push layout and is scrollable horizontally if needed
          overflowX: "auto",
          marginTop: "1vh"
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
           
          {/* Start month */}
          <div style={{ display: "flex", alignItems: "center", gap: 8,  }}>
            <label style={{ fontSize: 14, color: colors.navy }}>Start Month:</label>
            <input type="month" value={formatMonthForInput(startVal)} onChange={(e) => onChangeStart(e.target.value)} />
          </div>
  
          {/* End month */}
          <div style={{ display: "flex", alignItems: "center", gap: 8,}}>
            <label style={{ fontSize: 14, color: colors.navy }}>End Month:</label>
            <input type="month" value={formatMonthForInput(endVal)} onChange={(e) => onChangeEnd(e.target.value)} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8vw", justifyContent: "space-between" }}>         
          {/* Apply button positioned first on mobile (so it's left-aligned) */}
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
  
          {/* Download group: label then icons */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", whiteSpace: "nowrap"}}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.navy, marginRight: 8 }}>Download Files</div>
  
            {/* Icon-only Excel button */}
            <button
              onClick={onDownloadExcel}
              title="Download Excel"
              aria-label="Download Excel"
              style={{ padding: "8px 10px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M19 2H8C6.9 2 6 2.9 6 4V20C6 21.1 6.9 22 8 22H19C20.1 22 21 21.1 21 20V4C21 2.9 20.1 2 19 2Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 2V6H17" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11H15" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 14H15" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 17H13" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
  
            {/* Icon-only PDF button */}
            <button
              onClick={onDownloadPdf}
              title="Download PDF"
              aria-label="Download PDF"
              style={{ padding: "8px 10px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M14 2H6C5 2 4 3 4 4V20C4 21 5 22 6 22H18C19 22 20 21 20 20V8L14 2Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 13H15" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 17H15" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          </div>
        </div>
      </div>
    );
  };
  
  const MonthSummary = ({ data = {} }) => {
    const computed = computeTotalsFromRecords(data);
    const totals = {
      totalInflow: data.totalInflow ?? computed.totalInflow,
      totalOutflow: data.totalOutflow ?? computed.totalOutflow,
      totalLoanPayments: data.totalLoanPayments ?? computed.totalLoanPayments,
      totalDeposits: data.totalDeposits ?? computed.totalDeposits,
    };
    return (
      <div
        style={{
          marginBottom: 16,
          overflow: "hidden",
          border: "2px solid #ccc",
          borderRadius: 8,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ background: "#f9fafb" }}>
              <td style={{ padding: "10px 14px", fontWeight: "bold" }}>Total Inflow:</td>
              <td style={{ padding: "10px 14px", fontWeight: "bold", color: "green", textAlign: "right" }}>
                {(totals.totalInflow || 0).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "10px 14px", fontWeight: "bold" }}>Total Outflow/Loans:</td>
              <td style={{ padding: "10px 14px", fontWeight: "bold", color: "red", textAlign: "right" }}>
                {(totals.totalOutflow || 0).toLocaleString()}
              </td>
            </tr>
            <tr style={{ background: "#f9fafb" }}>
              <td style={{ padding: "10px 14px", fontWeight: "bold" }}>Total Loan Payments:</td>
              <td style={{ padding: "10px 14px", fontWeight: "bold", color: "goldenrod", textAlign: "right" }}>
                {(totals.totalLoanPayments || 0).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "10px 14px", fontWeight: "bold" }}>Total Deposits:</td>
              <td style={{ padding: "10px 14px", fontWeight: "bold", color: "blue", textAlign: "right" }}>
                {(totals.totalDeposits || 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };
  
  const RecordsTable = ({ records = [] }) => (
  <div
    style={{
      overflowX: "auto",
      border: "2px solid #ccc",
      borderRadius: 8,
    }}
  >
    <table style={{ width: "100%", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
      <thead>
        <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #ccc" }}>
          <th style={{ padding: "10px 14px", textAlign: "left" }}>Date</th>
          <th style={{ padding: "10px 14px", textAlign: "left" }}>Type</th>
          <th style={{ padding: "10px 14px", textAlign: "left" }}>Name</th>
          <th style={{ padding: "10px 14px", textAlign: "right" }}>Amount</th>
          <th style={{ padding: "10px 14px", textAlign: "left" }}>Destination/Source</th>
        </tr>
      </thead>
      <tbody>
        {(records || []).map((r, i) => {
          const isInflow = r.type === "Deposit" || r.type === "Loan Payment";
          const bg = i % 2 === 0 ? "#fff" : "#f9fafb";
          return (
            <tr key={i} style={{ background: bg, borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "10px 14px" }}>{r.date}</td>
              <td style={{ padding: "10px 14px", color: isInflow ? "green" : "red" }}>{r.type}</td>
              <td style={{ padding: "10px 14px" }}>{r.name}</td>
              <td style={{ padding: "10px 14px", textAlign: "right", color: isInflow ? "green" : "red" }}>
                {r.amount}
              </td>
              <td style={{ padding: "10px 14px" }}>{r.destination || r.source || ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

  const MonthBlock = ({ month, data }) => (
    <div style={{ background: "#fff", borderRadius: 8, padding: 12, marginBottom: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h5 style={{ margin: 0, color: colors.navy }}>{month}</h5>
      </div>

      <MonthSummary data={data} />

      <RecordsTable records={data.records || []} />
    </div>
  );

  // main render
  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.lightGray, display: "flex" }}>
      <Sidebar dashboard={dashboard} navLinks={navLinks} isMobile={isMobile} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} transform={sidebarTransform} />

      {isMobile && isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 999 }} />}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <Header isMobile={isMobile} onToggle={toggleSidebar} headerRef={headerRef} dashboard={dashboard} />
        {/* fixed toggle placed under the top nav so it remains visible while scrolling */}
        <div style={{ padding: 0.5 * spacing.pagePadding,}}>
          <ToggleFiltersButton onClick={toggleMonthFilters} open={showMonthFilters} />
          {showMonthFilters && (
            <MonthFilters
              startVal={startMonth}
              endVal={endMonth}
              onChangeStart={(v) => handleMonthChange(true, v)}
              onChangeEnd={(v) => handleMonthChange(false, v)}
              onApply={handleApplyFilters}
              onDownloadExcel={() => handleDownload("excel")}
              onDownloadPdf={() => handleDownload("pdf")}
            />
          )}
        </div>
                
        <main style={{ flex: 1, overflowY: "auto", padding: 0.5* spacing.pagePadding, paddingTop: 0}}>

          <div>
            {Object.entries(filteredRecords).length === 0 && <div style={{ color: "#666" }}>No records found for the selected range.</div>}

            {Object.entries(filteredRecords).map(([month, data]) => (
              <MonthBlock key={month} month={month} data={data} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
