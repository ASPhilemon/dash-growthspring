// src/pages/LoansPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { THEME } from "../../theme";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import LoanFilter from "../../components/layout/LoanFilter";
import LoansFilterSummary from "../../components/layout/LoansFilterSummary";
import { API_BASE } from "../../../config";               
import { useAuth } from "../../contexts/auth-context"; 

import { useAdminDashboard } from "../../contexts/AdminDashboardContext";

const { colors, spacing } = THEME;

export default function AdminLoansPage({ dashboard = "admin" }) {
  const { adminDashboard } = useAdminDashboard();

  // Where to read loans from context:
  const loansFromCtx = adminDashboard?.allLoans?.items ?? adminDashboard?.allLoans ?? [];
  const [records, setRecords] = useState(loansFromCtx);
  const [loading, setLoading] = useState(true);
  const users = adminDashboard?.allUsers;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : true);
  
  const [showAdd, setShowAdd] = useState(false);
  const [showApprove, setShowApprove] = useState({ open:false, loan:null });
  const [showPay, setShowPay] = useState({ open:false, loan:null });
  
  const cashLocations = adminDashboard?.cashLocations ?? [];

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Sync when context changes
  useEffect(() => {
    setRecords(loansFromCtx);
    setLoading(false);
  }, [adminDashboard]);
// default filter shape (match your LoanFilter fields)
const [filters, setFilters] = useState({
  year: "",          // "" means All
  month: "",         // "1"..."12" or ""
  loan_status: "",   // "Ongoing" | "Ended" | "Overdue" | ""
  member: "",        // user _id or ""
  sortBy: "loan_date", // "loan_date" | "loan_amount"
  order: "-1",       // "-1" desc, "1" asc
  perPage: "100",    // string for now (from select)
  page: "1",
});

function toNumber(v) {
  if (typeof v === "number") return v;
  const n = Number(String(v || "").replace(/[^\d.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parseDateFlexible(v) {
  if (!v) return null;

  // Already a Date?
  if (v instanceof Date && !isNaN(v)) return v;

  // Numeric timestamp
  if (typeof v === "number") {
    const d = new Date(v);
    return isNaN(d) ? null : d;
  }

  if (typeof v === "string") {
    const s = v.trim();

    // ISO-8601 (YYYY-MM-DD ...): let native handle
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(s);
      return isNaN(d) ? null : d;
    }

    // DD/MM/YYYY or D/M/YYYY  (STRICT DD/MM — not MM/DD)
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10); // 1..12
      const year = parseInt(m[3], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        const d = new Date(year, month - 1, day);
        return isNaN(d) ? null : d;
      }
      return null;
    }

    // Fallback try native (covers things like "Tue, 17 Sep 2024")
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }

  return null;
}


function getMonthIndex(dateLike) {
  const d = parseDateFlexible(dateLike);
  return d ? d.getMonth() + 1 : null; // 1..12
}

function getYearNum(dateLike) {
  const d = parseDateFlexible(dateLike);
  return d ? d.getFullYear() : null;
}



function matchesFilters(loan, f) {
  const month = getMonthIndex(loan.issueDate || loan.date || loan.createdAt);
  const year  = getYearNum(loan.issueDate || loan.date || loan.createdAt);
  const member = loan.borrower?._id || loan.borrower;

  const wantYear  = f.year !== ""  ? Number(f.year)  : null;
  const wantMonth = f.month !== "" ? Number(f.month) : null;
  const wantStatus = String(f.loan_status || f.status || f.loanStatus || "")
    .trim()
    .toLowerCase();

  const loanStatus = String(loan.loan_status ?? loan.status ?? "")
    .trim()
    .toLowerCase();

  if (wantYear  != null && Number(year)  !== wantYear)  return false;
  if (wantMonth != null && Number(month) !== wantMonth) return false;
  if (wantStatus && loanStatus !== wantStatus) return false;
  if (f.member && String(loan.borrowerId || loan.memberId || "") !== String(f.member)) return false;

  return true;
}



function sortLoans(list, f) {
  const key = f.sortBy === "loan_amount" ? "loanAmount" : "issueDate";
  const dir = f.order === "1" ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = key === "loanAmount" ? toNumber(a.loanAmount ?? a.amount) : new Date(a.issueDate || a.date || 0).getTime();
    const bv = key === "loanAmount" ? toNumber(b.loanAmount ?? b.amount) : new Date(b.issueDate || b.date || 0).getTime();
    if (av < bv) return -1 * dir;
    if (av > bv) return  1 * dir;
    return 0;
  });
}
function paginate(list, f) {
  const per = Math.max(1, parseInt(f.perPage || "100", 10));
  const page = Math.max(1, parseInt(f.page || "1", 10));
  const start = (page - 1) * per;
  return list.slice(start, start + per);
}

// keep raw context records in state
useEffect(() => {
  setRecords(loansFromCtx);
  setLoading(false);
}, [loansFromCtx]);

// derive filtered+sorted+paginated list
const filteredRecords = React.useMemo(() => {
  const base = Array.isArray(records) ? records : [];
  const passed = base.filter((ln) => matchesFilters(ln, filters));
  const sorted = sortLoans(passed, filters);
  return paginate(sorted, filters);
}, [records, filters]);

// OPTIONAL: compute summary from filtered set
const loansSummary = React.useMemo(() => {
  const ongoing = filteredRecords.filter(l => (l.loan_status || l.status) === "Ongoing");
  const ended   = filteredRecords.filter(l => (l.loan_status || l.status) === "Ended");

  const totalPrincipal = filteredRecords.reduce((s, l) => s + toNumber(l.loanAmount ?? l.amount), 0);
  const principalLeft  = filteredRecords.reduce((s, l) => s + toNumber(l.amountLeft ?? l.principalLeft), 0);
  const expectedInterest = filteredRecords.reduce((s, l) => s + toNumber(l.unclearedInterest), 0);
  const interestPaid   = filteredRecords.reduce((s, l) => s + toNumber(l.paid_interest ?? l.interestPaid), 0);
  const members = new Set(filteredRecords.map(l => String(l.borrower))).size;
  const membersOngoing = new Set(ongoing.map(l => String(l.borrower))).size;
  const membersEnded   = new Set(ended.map(l => String(l.borrower))).size;

  return {
    ongoingLoansCount: ongoing.length,
    endedLoansCount: ended.length,
    totalPrincipal,
    principalLeft,
    expectedInterest: expectedInterest, // set if you can compute it
    interestPaid,
    members,
    membersOngoingLoans: { size: membersOngoing },
    membersEndedLoans:   { size: membersEnded },
  };
}, [filteredRecords]);

  // ---------- helpers ----------
  function fmtCurrency(n) {
    try {
      return "UGX " + Number(n || 0).toLocaleString();
    } catch {
      return String(n || "");
    }
  }
  // Try to format, otherwise show raw (handles “5/4/2024” etc.)
  function fmtDateSmart(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return String(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  }
  const FirstName = (name = "Unknown") => (name || "").trim().split(/\s+/)[0] || "Unknown";

  // ---------- small building blocks ----------
  function Labeled({ label, value }) {
    return (
      <div
        style={{
          background: "#fafbff",
          border: "1px solid rgb(128,128,128, 0.5)",
          borderRadius: 8,
          padding: "8px 10px",
          minWidth: 0,
        }}
      >
        <div style={{ fontSize: 13, color: "rgb(0,0,0,1)", marginBottom: 3 }}>{label}</div>
        <div
          style={{
            fontWeight: 600,
            color: colors.navy,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value ?? "—"}
        </div>
      </div>
    );
  }

  function PaymentsTable({ rows = [] }) {
    // rows like: [ ["1/5/2024", 87000], ... ]
    return (
      <div
        style={{
          overflowX: "auto",
          border: "1px solid #e6ebf5",
          borderRadius: 8,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
              <th style={{ textAlign: "left", fontSize: 13, padding: "10px 12px" }}>Date</th>
              <th style={{ textAlign: "right", fontSize: 13, padding: "10px 12px" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r, i) => {
              const rowDate = Array.isArray(r) ? r[0] : r?.date;
              const rowAmount = Array.isArray(r) ? r[1] : r?.amount;
              const bg = i % 2 === 0 ? "#fff" : "#f9fafb";
              return (
                <tr key={i} style={{ background: bg, borderBottom: "1px solid #eef2f7" }}>
                  <td style={{ padding: "10px 12px" }}>{(rowDate)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmtCurrency(rowAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // ---------- Loan Card ----------
  function LoanCard({ loan, isMobile, onApprove, onPay }) {
    const name = loan.borrower ?? loan.memberName ?? "Member";
    const firstName = (name || "").split(/\s+/)[0] || "Member";
    const issueDate = loan.issueDate;
    const loanAmount = loan.loanAmount ?? loan.amount ?? 0;
  
    const amountLeft = loan.amountLeft ?? 0;
    const paidInterest = loan.paid_interest ?? 0;
    const duration = loan.agreedLoanDuration ?? "—";
    const unclearedInterest = loan.unclearedInterest ?? 0;
  
    // Desktop: toggles only the payments section.
    // Mobile: toggles the whole accordion (details + scroller + pay button).
    const [open, setOpen] = React.useState(false);
    const toggle = () => setOpen((v) => !v);
  
    const initials = (name || "M")
      .split(" ")
      .map((s) => s?.[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase();
  
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
            background: loan.loan_status == "Ended" ? colors.navy : loan.loan_status == "Pending Approval" ? "#117a7a" : colors.gold,
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
            paddingBottom: 8,
            justifyContent: "space-between",
            gap: 12,
            cursor: isMobile ? "pointer" : "default",
          }}
          onClick={isMobile ? toggle : undefined}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                background: "#e9eef9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 500,
                color: colors.navy,
                flex: "0 0 auto",
              }}
            >
              {initials}
            </div>
            <div>            
              <div
              style={{
                fontWeight: 500,
                color: colors.navy,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: 18,
              }}
              title={name}
            >
              {isMobile ? firstName : name}
            </div>
              <div style={{ fontSize: 12, fontWeight: "bold", opacity: 0.9 }}>{ loan.loan_status}</div>
            </div>

          </div>
  
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: colors.navy }}>{fmtCurrency(loanAmount)}</div>
            {/* Chevron ONLY on mobile */}
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
  
        {/* Divider only when open on mobile (keeps padding symmetric when closed) */}
        {(!isMobile || open) && (
        <div style={{ height: 1, background: "rgb(0,0,0, 0.5)", margin: "6px 0 10px 0" }} />
      )}
  
        {/* DESKTOP: details always visible; payments toggled by button below */}
        {!isMobile ? (
          <>
            {/* Details row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 10,
                fontSize: 14,
              }}
            >
              <Labeled label="Amount Left" value={fmtCurrency(amountLeft)} />
              <Labeled label="Loan Date" value={(issueDate)} />
              <Labeled label="Paid Interest" value={fmtCurrency(paidInterest)} />
              <Labeled label="Agreed Duration" value={duration} />
              <Labeled label="Uncleared Interest" value={fmtCurrency(unclearedInterest)} />
            </div>
  
            {/* Action buttons (below details) */}
            {loan.loan_status == "Pending Approval" ?
            (<>
             <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
             <button
  type="button"
  onClick={() => onApprove?.(loan)}
  className="btn"
  style={{
    background: "#0ea5e9",
    color: "#fff",
    border: "1px solid #0ea5e9",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  }}
>            <svg width="14" height="14" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8.5l-9 9z"
                  />
                </svg>
  Approve
</button>

             </div>
             </>    
            ): 
            (<>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            
            {loan.loan_status == "Ended" ? (<><div style={{marginTop: 10 }}></div></>) : 
            (<>
<button
  type="button"
  onClick={() => onPay?.(loan)}
  className="btn"
  style={{
    background: "#0ea5e9",
    color: "#fff",
    border: "1px solid #0ea5e9",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  }}
>   
              <svg width="14" height="14" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M21 18H6c-1.11 0-2 .9-2 2v2H2V7c0-1.11.89-2 2-2h18c1.11 0 2 .89 2 2v9c0 1.11-.89 2-2 2zM4 7v2h16V7H4zm0 13v-1h16v1H4z"
                  />
                </svg>
  Pay
</button>

           
                </>) }
              <button
                type="button"
                onClick={toggle}
                className="btn"
                style={{
                  background: "transparent",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {open ? "Hide payments" : "See payments"}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  style={{
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 150ms ease",
                  }}
                >
                  <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6l-6-6z" />
                </svg>
              </button>
            </div>
            </>
          ) }

            {/* Payments accordion body */}
            {open && (
              <div style={{ marginTop: 12 }}>
                <PaymentsTable rows={loan.paymentHistory || []} />
              </div>
            )}
          </>
        ) : (
          // MOBILE
          open && (
            <>
              {/* Horizontal scroller with two panels */}
              <div
                style={{
                  marginTop: 8,
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch",
                  display: "flex",
                  gap: 12,
                  scrollSnapType: "x mandatory",
                }}
              >
                {/* Details panel */}
                <div style={{ minWidth: "100%", scrollSnapAlign: "start" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 10,
                      fontSize: 14,
                      marginBottom: 8
                    }}
                  >
                    <Labeled label="Amount Left" value={fmtCurrency(amountLeft)} />
                    <Labeled label="Loan Date" value={(issueDate)} />
                    <Labeled label="Paid Interest" value={fmtCurrency(paidInterest)} />
                    <Labeled label="Agreed Duration" value={duration} />
                    <Labeled label="Uncleared Interest" value={fmtCurrency(unclearedInterest)} />
                  </div>
                </div>
  
                {/* Payments panel */}
                <div style={{ minWidth: "100%", scrollSnapAlign: "start" }}>
                  <h6>Payments</h6>
                  <PaymentsTable rows={loan.paymentHistory || []} />
                </div>
              </div>
  
              {/* Pay or approve button below scroller */}
              {loan.loan_status == "Ended" ? (<><div style={{marginTop: 10 }}></div></>) : 
              loan.loan_status == "Pending Approval" ?
            (<>
             <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
             <button
  type="button"
  onClick={() => onApprove?.(loan)}
  className="btn"
  style={{
    background: "#0ea5e9",
    color: "#fff",
    border: "1px solid #0ea5e9",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  }}
>            <svg width="14" height="14" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8.5l-9 9z"
                  />
                </svg>
  Approve
</button>
             </div>
             </>
            ): 
            (<>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button
  type="button"
  onClick={() => onPay?.(loan)}
  className="btn"
  style={{
    background: "#0ea5e9",
    color: "#fff",
    border: "1px solid #0ea5e9",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  }}
>   
              <svg width="14" height="14" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M21 18H6c-1.11 0-2 .9-2 2v2H2V7c0-1.11.89-2 2-2h18c1.11 0 2 .89 2 2v9c0 1.11-.89 2-2 2zM4 7v2h16V7H4zm0 13v-1h16v1H4z"
                  />
                </svg>
  Pay
</button>
              </div>
              </>) }
            </>
          )
        )}
      </div>
    );
  }
  

  function LoanList({ items, isMobile, onApprove, onPay }) {
    if (!Array.isArray(items) || items.length === 0) {
      return <div style={{ color: "#666", padding: 12 }}>No loans found.</div>;
    }
    return (
      <div>
        {items.map((loan, i) => (
          <LoanCard
            key={loan.loanId || loan._id || i}
            loan={loan}
            isMobile={isMobile}
            onApprove={onApprove}
            onPay={onPay}
          />
        ))}
      </div>
    );
  }
  

/***** Reusable Modal Shell *****/
/***** Reusable Modal Shell (update) *****/
function Modal({ isOpen, title, onClose, children, footer, verticalCenter = false }) {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : true
  );

  React.useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 640); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: verticalCenter ? "center" : "flex-start",
        padding: isMobile ? 12 : "8vh 16px",      // keeps a margin from edges
        overflowY: "auto",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(1px)",
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "relative",
          zIndex: 1001,
          width: "100%",
          maxWidth: isMobile ? 720 : 560,
          maxHeight: isMobile ? "calc(100vh - 24px)" : "calc(100vh - 10vh)", // fits inside padded area
          overflowY: "auto",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          border: "1px solid #e6ebf5",
        }}
      >
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #eef2f7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: THEME.colors.navy }}>{title}</div>
          <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "none", fontSize: 20, lineHeight: 1, color: "#475569", cursor: "pointer" }}>X</button>
        </div>

        <div style={{ padding: 16 }}>{children}</div>

        {footer ? (
          <div style={{ padding: 12, borderTop: "1px solid #eef2f7", display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}



/***** Helpers *****/
function toNumberStrict(v) {
  const n = Number(String(v || "").replace(/[^\d.-]/g, ""));
  return isNaN(n) ? 0 : n;
}
function fmtUGX(n) {
  try { return "UGX " + Number(n || 0).toLocaleString(); } catch { return String(n || ""); }
}

/***** 1) Add Loan Modal *****
props:
- isOpen, onClose
- users: [{_id, name}] (from your context)
- onSubmit(payload)  -> payload = { borrowerId, amount, issueDate, durationMonths, loanType, comment }
*****************************/

function toNumberStrict(v) {
  if (v === null || v === undefined || v === "") return NaN;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

// add months but clamp to the last valid day in the resulting month
function addMonthsClamped(isoYmd, monthsToAdd = 1) {
  try {
    const [y, m, d] = isoYmd.split("-").map(Number);
    // create date at 1st of target month
    const target = new Date(y, m - 1 + monthsToAdd, 1);
    // days in target month
    const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    const day = Math.min(d || 1, daysInTarget);
    const result = new Date(target.getFullYear(), target.getMonth(), day);
    const yyyy = result.getFullYear();
    const mm = String(result.getMonth() + 1).padStart(2, "0");
    const dd = String(result.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return isoYmd; // fallback: return original string
  }
}

function AddLoanModal({
  isOpen,
  onClose,
  users = [],                 // [{ _id, fullName, ... }]
  onSaved,                    // optional callback(savedResponse)
  apiEndpoint = `${API_BASE}/loans/initiate`,
}) {
  const { token } = useAuth() || {};

  const [form, setForm] = React.useState({
    borrowerId: "",
    amount: "",
    issueDate: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
    durationMonths: "",
    loanType: "Standard", // "Standard" | "Interest Free"
    comment: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  // reset when opened
  React.useEffect(() => {
    if (isOpen) {
      setForm({
        borrowerId: "",
        amount: "",
        issueDate: new Date().toISOString().slice(0, 10),
        durationMonths: "",
        loanType: "Standard",
        comment: "",
      });
      setSubmitting(false);
    }
  }, [isOpen]);

  const isNarrow = React.useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => (typeof window !== "undefined" ? window.innerWidth < 640 : true),
    () => true
  );

  const canSubmit =
    form.borrowerId &&
    toNumberStrict(form.amount) > 0 &&
    form.issueDate &&
    Number(form.durationMonths) > 0 &&
    (form.loanType === "Standard" || form.loanType === "Interest Free");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    try {
      const amount = toNumberStrict(form.amount);
      const duration = Number(form.durationMonths);

      const earliestDate = form.issueDate;                         // yyyy-mm-dd
      const latestDate = addMonthsClamped(form.issueDate, 1);      // default: +1 month window like your example
      const payload = {
        amount,
        duration,               // server expects "duration" (months)
        earliestDate,
        latestDate,
        borrowerId: form.borrowerId,
        loanType: form.loanType, // "Standard" | "Interest Free"
        comment: form.comment ? form.comment : ""
      };

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include", // send cookies (jwt) if present
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

      onSaved?.(saved ?? null);
      onClose?.();
    } catch (err) {
      alert(err?.message || "Failed to create loan.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="New Loan Request"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{ background: "transparent", border: "1px solid #cbd5e1", color: "#475569", padding: "8px 12px", borderRadius: 6 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-loan-form"
            className="btn"
            disabled={!canSubmit || submitting}
            style={{ background: "#117a7a", color: "#fff", border: "1px solid #117a7a", padding: "8px 12px", borderRadius: 6, opacity: !canSubmit || submitting ? 0.7 : 1 }}
          >
            {submitting ? "Saving…" : "Add Loan"}
          </button>
        </>
      }
    >
      <form id="add-loan-form" onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        {/* Borrower */}
        <div>
          <label style={{ display: "block", fontWeight: "bold", fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
            Borrower
          </label>
          <select
            value={form.borrowerId}
            onChange={(e) => setForm((s) => ({ ...s, borrowerId: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
          >
            <option value="">Select member…</option>
            {(users || []).map((u) => (
              <option key={u._id || u.id} value={u._id || u.id}>
                {u.fullName || u.name || u.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Amount + Date */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "2fr 1fr",
            gap: 10,
          }}
        >
          <div>
            <label style={{ display: "block", fontWeight: "bold", fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
              Amount
            </label>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
              Date
            </label>
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) => setForm((s) => ({ ...s, issueDate: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#fff",
              }}
            />
          </div>
        </div>

        {/* Duration + Loan Type */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "1fr 2fr",
            gap: 10,
          }}
        >
          <div>
            <label style={{ display: "block", fontWeight: "bold", fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
              Duration (months)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 6"
              value={form.durationMonths}
              onChange={(e) => setForm((s) => ({ ...s, durationMonths: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
              Loan Type
            </label>
            <select
              value={form.loanType}
              onChange={(e) => setForm((s) => ({ ...s, loanType: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
            >
              <option value="Standard">Standard</option>
              <option value="Interest Free">Interest Free</option>
            </select>
          </div>
        </div>

        {/* Comment (optional; not sent unless backend supports it) */}
        <div>
          <label style={{ display: "block", fontWeight: "bold", fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
            Comment
          </label>
          <textarea
            rows={3}
            placeholder="Optional note…"
            value={form.comment}
            onChange={(e) => setForm((s) => ({ ...s, comment: e.target.value }))}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              resize: "vertical",
            }}
          />
        </div>
      </form>
    </Modal>
  );
}

function toNumberStrict(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function fmtUGX(n) {
  const num = toNumberStrict(n);
  return "UGX " + num.toLocaleString();
}

function ApproveLoanModal({
  isOpen,
  onClose,
  loanId,
  requestedAmount = 0,
  cashLocations = [],  // [{ _id, name }]|[{ id, name }]
  onApproved,          // optional callback(responseJson)
  apiBase = `${API_BASE}/loans/approve`, // final URL: ${apiBase}/${loanId}
}) {
  const { token } = useAuth() || {};

  const [rows, setRows] = React.useState([
    { id: "", amount: "" },
    { id: "", amount: "" },
  ]);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setRows([
        { id: "", amount: "" },
        { id: "", amount: "" },
      ]);
      setSubmitting(false);
    }
  }, [isOpen]);

  const total = rows.reduce((s, r) => s + toNumberStrict(r.amount), 0);
  const matches = total === toNumberStrict(requestedAmount);
  const hasIds = rows.every((r) => r.id);
  const positive = rows.every((r) => toNumberStrict(r.amount) > 0);
  const canSubmit = matches && hasIds && positive && !submitting && !!loanId;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      // Build the Postman-equivalent payload
      const payload = {
        sources: rows.map((r) => ({
          id: r.id,                          // cash location id
          amount: toNumberStrict(r.amount),  // number
        })),
      };

      const url = `${apiBase}/${loanId}`;
      const method = "POST"; // <-- change to "PUT" if your API expects PUT
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include", // send cookies (jwt) if present
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      let json = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      onApproved?.(json);
      onClose?.();
    } catch (err) {
      alert(err?.message || "Failed to approve loan.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Approve Loan Request"
      onClose={onClose}
      verticalCenter
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{ background: "transparent", border: "1px solid #cbd5e1", color: "#475569", padding: "8px 12px", borderRadius: 6 }}
          >
            Close
          </button>
          <button
            type="submit"
            form="approve-loan-form"
            className="btn"
            disabled={!canSubmit}
            style={{ background: "#0ea5e9", color: "#fff", border: "1px solid #0ea5e9", padding: "8px 12px", borderRadius: 6, opacity: canSubmit ? 1 : 0.7 }}
          >
            {submitting ? "Approving…" : "Approve"}
          </button>
        </>
      }
    >
      <div
        style={{
          padding: "10px 12px",
          marginBottom: 12,
          background: "#f1f5f9",
          border: "1px dashed #cbd5e1",
          borderRadius: 8,
          color: "#0f172a",
          lineHeight: 1.5,
        }}
      >
        <strong>Note:</strong> The total from the cash locations <em>must equal</em> the requested amount{" "}
        <strong>{fmtUGX(requestedAmount)}</strong>. Current total: <strong>{fmtUGX(total)}</strong>
        {!matches ? (
          <span style={{ color: "#b91c1c" }}>
            {" "}
            (difference: {fmtUGX(Math.abs(toNumberStrict(requestedAmount) - total))})
          </span>
        ) : (
          <span style={{ color: "#166534" }}> ✓ OK</span>
        )}
      </div>

      <form id="approve-loan-form" onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        {rows.map((row, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 10, alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontWeight: "bold", fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
                Cash Location {idx + 1}
              </label>
              <select
                value={row.id}
                onChange={(e) =>
                  setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, id: e.target.value } : r)))
                }
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
              >
                <option value="">Select location…</option>
                {(cashLocations || []).map((c) => {
                  const value = c.id || c._id || c.value || ""; // be flexible
                  const label = c.name || c.label || value;
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "bold", fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
                Amount
              </label>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="0"
                value={row.amount}
                onChange={(e) =>
                  setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, amount: e.target.value } : r)))
                }
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>
        ))}
      </form>
    </Modal>
  );
}



function toNumberStrict(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function PayLoanModal({
  isOpen,
  onClose,
  loanId,
  cashLocations = [],   // [{ id/_id, name }]
  onPaid,               // optional callback(responseJson)
  apiBase = `${API_BASE}/loans/payment`, // final URL: ${apiBase}/${loanId}
}) {
  const { token } = useAuth() || {};
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = React.useState({
    amount: "",
    date: today,          // yyyy-mm-dd
    cashLocationId: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setForm({ amount: "", date: today, cashLocationId: "" });
      setSubmitting(false);
    }
  }, [isOpen]);

  const canSubmit =
    toNumberStrict(form.amount) > 0 &&
    !!form.date &&
    !!form.cashLocationId &&
    !submitting &&
    !!loanId;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        paymentAmount: toNumberStrict(form.amount),
        cashLocationId: form.cashLocationId,
        paymentDate: form.date, // "YYYY-MM-DD" exactly as in Postman
      };

      const url = `${apiBase}/${loanId}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include", // send cookies (jwt) too
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      let json = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      onPaid?.(json);
      onClose?.();
    } catch (err) {
      alert(err?.message || "Failed to record payment.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Record Loan Payment"
      verticalCenter
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{ background: "transparent", border: "1px solid #cbd5e1", color: "#475569", padding: "8px 12px", borderRadius: 6 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="pay-loan-form"
            className="btn"
            disabled={!canSubmit}
            style={{ background: "#0ea5e9", color: "#fff", border: "1px solid #0ea5e9", padding: "8px 12px", borderRadius: 6, opacity: canSubmit ? 1 : 0.7 }}
          >
            {submitting ? "Saving…" : "Record Payment"}
          </button>
        </>
      }
    >
      <form id="pay-loan-form" onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        {/* Amount */}
        <div>
          <label style={{ display: "block", fontWeight: "bold", fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
            Amount
          </label>
          <input
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="0"
            value={form.amount}
            onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
          />
        </div>

        {/* Date */}
        <div>
          <label style={{ display: "block", fontWeight: "bold", fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
            Payment Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
          />
        </div>

        {/* Destination */}
        <div>
          <label style={{ display: "block", fontWeight: "bold", fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
            Cash Destination
          </label>
          <select
            value={form.cashLocationId}
            onChange={(e) => setForm((s) => ({ ...s, cashLocationId: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
          >
            <option value="">Select destination…</option>
            {(cashLocations || []).map((c) => {
              const value = c.id || c._id || c.value || "";
              const label = c.name || c.label || value;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </form>
    </Modal>
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
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 999 }}
        />
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <Header isMobile={isMobile} onToggle={() => setIsSidebarOpen((s) => !s)} headerRef={null} dashboard={dashboard} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            padding: spacing.pagePadding,
            paddingBottom: 0,
          }}
        >
          {/* Add Loan / New – optional */}
          <button
  type="button"
  onClick={() => setShowAdd(true)}
  className="btn"
  style={{ display:'inline-flex', alignItems:'center', gap:8, border:'1px solid', borderRadius:5, background:'#117a7a', color:'#fff' }}
>
  <span style={{ fontSize: 16, color: "white" }}>New Loan</span>
</button> 
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <LoanFilter
  users={users}
  value={filters}                   // ⬅️ this populates the dropdowns
  onChange={(next) => setFilters(next)}  // ⬅️ doesn’t reset other fields
/>

</div>


        </div>

        <main style={{ flex: 1, overflowY: "auto", padding: spacing.pagePadding, paddingTop: 0 }}>
        <AddLoanModal
  isOpen={showAdd}
  onClose={() => setShowAdd(false)}
  users={users}
  onSubmit={async (payload) => {
    // hit your API (create loan request) then update local list:
    // const created = await apiCreateLoan(payload)
    // setRecords(r => [created, ...r])
  }}
/>
<ApproveLoanModal
  isOpen={showApprove.open}
  onClose={() => setShowApprove({ open:false, loan:null })}
  loanId={showApprove.loan?._id || showApprove.loan?.loanId}
  requestedAmount={showApprove.loan?.loanAmount ?? showApprove.loan?.amount ?? 0}
  cashLocations={cashLocations /* [{id,name}] */}
  onSubmit={async (loanId, sources) => {
    // await approveStandardLoanRequest(loanId, sources)
    // refresh or update local state to mark loan approved:
    // setRecords(r => r.map(l => (idMatch ? {...l, loan_status:"Ongoing"} : l)))
  }}
/>
<PayLoanModal
  isOpen={showPay.open}
  onClose={() => setShowPay({ open:false, loan:null })}
  loanId={showPay.loan?._id || showPay.loan?.loanId}
  cashLocations={cashLocations /* [{id,name}] */}
  onSubmit={async (loanId, amount, cashLocationId, date) => {
    // await processLoanPayment(loanId, amount, cashLocationId, date)
    // update record payments / amountLeft locally
  }}
/>

        <details>
  <summary className="btn btn-m fw-bold" style={{backgroundColor: 'white', width: '100%', color: 'gold', borderColor: 'grey', marginBottom: 10}}>
    Filter Summary
  </summary>
  <div style={{marginBottom: "1vh", marginTop: "-10px"}}>
    <LoansFilterSummary loans_summary={loansSummary} />
  </div>
</details>

{loading ? (
  <div style={{ padding: 12 }}>Loading…</div>
) : (
  <LoanList
  items={filteredRecords}
  isMobile={isMobile}
  onApprove={(loan) => setShowApprove({ open: true, loan })}
  onPay={(loan) => setShowPay({ open: true, loan })}
/>
)}
</main>
      </div>
    </div>
  );
}
