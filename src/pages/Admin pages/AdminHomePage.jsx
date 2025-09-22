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

  async function exportToPDF(filtered) {
    try {
      // dynamic import of jspdf-autotable (ensures autoTable function is available)
      const { default: autoTable } = await import("jspdf-autotable");
  
      const doc = new jsPDF();
      Object.entries(filtered).forEach(([month, data], i) => {
        if (i > 0) doc.addPage();
  
        // totals
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
  
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Month: ${month}`, 10, 14);
  
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Inflow: ${totals.totalInflow.toLocaleString()}`, 10, 26);
        doc.text(`Total Outflow: ${totals.totalOutflow.toLocaleString()}`, 10, 34);
        doc.text(`Total Deposits: ${totals.totalDeposits.toLocaleString()}`, 10, 42);
        doc.text(`Total Loans: ${totals.totalLoans.toLocaleString()}`, 10, 50);
        doc.text(`Total Loan Payments: ${totals.totalLoanPayments.toLocaleString()}`, 10, 58);
  
        // table: ensure each cell is a string to avoid issues
        const body = (Array.isArray(data.records) ? data.records : []).map((r) => [
          String(r.date || ""),
          String(r.type || ""),
          String(r.name || ""),
          String(r.amount || ""),
          String(r.destination || r.source || ""),
        ]);
  
        // call autoTable(doc, options) imported above
        autoTable(doc, {
          startY: 68,
          head: [["Date", "Type", "Name", "Amount", "Source/Destination"]],
          body,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [30, 60, 90] },
        });
      });
  
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
