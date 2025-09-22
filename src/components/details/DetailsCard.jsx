// src/components/details/DetailsCard.jsx
import React, { useState } from "react";
import { THEME } from "../../theme";
import YearTotalSelector from "../common/YearTotalSelector";
import TransactionRow from "./TransactionRow";
import { useMemberDashboard } from "../../contexts/MemberDashboardContext";

const { colors, spacing, divider } = THEME;
const ENDED_BORDER = colors.navy || "#0a2252";

function TransactionsTable({ headers = [], transactions = [] }) {
  const { memberDashboard, isLoading, error } = useMemberDashboard();
  const dashboardAppearance =
    memberDashboard?.dashboardAppearance ?? { layoutStyle: "stacked", colorTheme: "gold" };
  
  const perColMin = 180;

  return (
    <div style={{ marginTop: 16, overflowX: "auto", maxWidth: "92vw", maxHeight: "70vh" }}>
      <table
        role="table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          whiteSpace: "nowrap",
          minWidth: headers.length * perColMin,
        }}
      >
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={header}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  fontWeight: 800,
                  fontSize: 14,
                  backgroundColor: colors.navy,
                  color: dashboardAppearance.color == "blue" ? colors.white : colors.gold,
                  borderBottom: `3px solid ${colors.gold}`,
                  borderRight: i < headers.length - 1 ? `1px solid ${divider}` : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: 12, textAlign: "center" }}>
                No transactions found.
              </td>
            </tr>
          ) : (
            transactions.map((t, i) => (
              <TransactionRow key={i} data={t} index={i} columns={headers.length} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loan accordion list                                                         */
/* -------------------------------------------------------------------------- */
function LoanAccordionList({ loans = [] }) {
  const { memberDashboard } = useMemberDashboard();
  const { dashboardAppearance } = memberDashboard;
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i));

  // container scrollable area (so page stays static)
  return (
    <div style={{ marginTop: 12, maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
      {loans.length === 0 && (
        <div style={{ padding: 12, textAlign: "center", background: colors.white, border: `1px solid ${divider}`, borderRadius: 8 }}>
          No loan records found.
        </div>
      )}

      {loans.map((loan, i) => {
        // normalize fields
        const issueDate = loan.issueDate ?? loan.date ?? "-";
        const amount = loan.loanAmount ?? loan.amount ?? "-";
        const amountLeft = loan.amountLeft ?? loan.principalLeft ?? "-";
        const status = (loan.loan_status ?? loan.status ?? "-");
        const duration = loan.agreedLoanDuration ?? loan.duration ?? "-";
        const paymentHistory = loan.paymentHistory ?? loan.payments ?? [];
        const pointsSpent = loan.pointsSpent ?? loan.points_spent ?? 0;
        const unclearedInterest = loan.unclearedInterest ?? loan.interestDue ?? "-";
        const paid_interest = loan.paid_interest ?? loan.interestPaid ?? "-";
        const comment = loan.comment;

        const isOngoing = String(status).toLowerCase() === "ongoing";
        const borderColor = isOngoing && dashboardAppearance.color == "gold" ? colors.gold : isOngoing && dashboardAppearance.color == "blue" ? "rgb(70,130,180)" : ENDED_BORDER;
        const isOpen = openIndex === i;

        // build detail rows (left = field, right = value)
        const details = [
          ["Issue date", issueDate],
          ["Loan amount", typeof amount === "number" ? `UGX ${amount.toLocaleString()}` : amount],
          ["Amount left", typeof amountLeft === "number" ? `UGX ${amountLeft.toLocaleString()}` : amountLeft],
          ["Uncleared interest", typeof unclearedInterest === "number" ? `UGX ${unclearedInterest.toLocaleString()}` : unclearedInterest],
          ["Interest paid", typeof paid_interest === "number" ? `UGX ${paid_interest.toLocaleString()}` : paid_interest],
          ["Duration", duration],
          ["Points spent", `${pointsSpent} pts`],
          ["Status", status],
          ["Notes", comment],
        ];

        return (
          <div
            key={loan.loanId ?? loan._id ?? i}
            style={{
              border: `2px solid ${borderColor}`,
              borderRadius: 8,
              marginBottom: 8,
              backgroundColor: colors.white,
              overflow: "hidden",
            }}
          >
            {/* header */}
            <button
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontSize: 14, color: colors.navy, fontWeight: 700 }}>
                  {issueDate} — {typeof amount === "number" ? `UGX ${amount.toLocaleString()}` : amount}
                </div>
                <div style={{ fontSize: 13, color: "#556", marginTop: 6 }}>
                  Status: <strong style={{ color: colors.navy }}>{status}</strong>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 14, color: colors.navy, fontWeight: 800 }}>
                  {typeof amountLeft === "number" ? `UGX ${amountLeft.toLocaleString()}` : amountLeft}
                </div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}
                >
                  <path d="M6 9L12 15L18 9" stroke={colors.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {/* body (collapsible) */}
            {isOpen && (
              <div style={{ padding: 16, background: "#fff" }}>
                {/* details table (field | value) */}
                <div style={{ marginBottom: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "8px 10px", border: `1px solid ${divider}`, background: colors.navy, color: dashboardAppearance.color == "gold" ? colors.gold : colors.white, fontWeight: 700 }}>Field</th>
                        <th style={{ textAlign: "left", padding: "8px 10px", border: `1px solid ${divider}`, background: colors.navy, color: dashboardAppearance.color == "gold" ? colors.gold : colors.white, fontWeight: 700 }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map(([label, val], idx) => (
                        <tr key={label + idx} style={{ borderBottom: idx < details.length - 1 ? `1px solid ${divider}` : "none" }}>
                          <td style={{ padding: "10px", border: `1px solid ${divider}`, width: "40%", verticalAlign: "top", fontWeight: 600 }}>{label}</td>
                          <td style={{ padding: "10px", border: `1px solid ${divider}`, verticalAlign: "top" }}>{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* payment history */}
                <div>
                  <h4 style={{ margin: "8px 0 10px 0", fontSize: 14, fontWeight: "bold", color: colors.navy }}>Payment history</h4>
                  {paymentHistory.length === 0 ? (
                    <div style={{ padding: 10, color: "#666", border: `1px solid ${divider}`, borderRadius: 6 }}>No payment history available.</div>
                  ) : (
                    <div style={{ maxHeight: "28vh", overflowY: "auto", border: `1px solid ${divider}`, borderRadius: 6 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: `2px solid ${divider}`, fontWeight: 700, background: "#fafafa" }}>Date</th>
                            <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: `2px solid ${divider}`, fontWeight: 700, background: "#fafafa" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.map((ph, idx) => {
                            const [pdate, pamount] = ph;
                            return (
                              <tr key={idx} style={{ borderBottom: idx < paymentHistory.length - 1 ? `1px solid ${divider}` : "none" }}>
                                <td style={{ padding: "8px 10px" }}>{pdate}</td>
                                <td style={{ padding: "8px 10px", fontWeight: 700 }}>{typeof pamount === "number" ? `UGX ${pamount.toLocaleString()}` : pamount}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main DetailsCard component                                                  */
/* -------------------------------------------------------------------------- */
function DetailsCard({ isMobile, selectedYear, onYearChange, years, total, transactions, tableHeaders }) {
  const cardStyle = {
    backgroundColor: colors.white,
    padding: spacing.cardPadding,
    borderRadius: 10,
    boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
    border: `1px solid ${divider}`,
    boxSizing: "border-box",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  };

  // detect loan-format: object with loanId or loanAmount+paymentHistory
  const isLoanFormat =
    Array.isArray(transactions) &&
    transactions.length > 0 &&
    (transactions[0].loanId !== undefined ||
      (transactions[0].loanAmount !== undefined && transactions[0].paymentHistory !== undefined));

  return (
    <section style={{ ...cardStyle, padding: "2vw" }}>
      <div style={{ marginBottom: 12 }}>
        <YearTotalSelector selectedYear={selectedYear} total={total} years={years} onYearChange={onYearChange} />
      </div>

      {/* content: loans -> accordion list (scrollable), else table */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {isLoanFormat ? (
          <LoanAccordionList loans={transactions} />
        ) : (
          <TransactionsTable headers={tableHeaders} transactions={transactions} />
        )}
      </div>
    </section>
  );
}

export default DetailsCard;
