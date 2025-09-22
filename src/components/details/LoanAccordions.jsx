/* -- Loan accordion UI ----------------------------------------------------- */
export default function LoanAccordionList({ loans = [] }) {
    // Track which index is open
    const [openIndex, setOpenIndex] = useState(null);
  
    const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i));
  
    // Colors for ongoing vs ended (subtle)
    const ongoingBg = "rgba(46, 204, 113, 0.06)"; // soft green
    const endedBg = "rgba(10,34,66,0.03)"; // soft navy tint
  
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        {loans.length === 0 && (
          <div style={{ padding: 12, textAlign: "center", background: colors.white, border: `1px solid ${divider}`, borderRadius: 8 }}>
            No loan records found.
          </div>
        )}
  
        {loans.map((loan, i) => {
          const isOpen = openIndex === i;
          const isOngoing = String(loan.loan_status || loan.status || "").toLowerCase() === "ongoing";
          const headerBg = isOngoing ? ongoingBg : endedBg;
  
          // Friendly labels & fallback values
          const issueDate = loan.issueDate ?? loan.date ?? "-";
          const amount = loan.loanAmount ?? loan.amount ?? "-";
          const amountLeft = loan.amountLeft ?? loan.principalLeft ?? "-";
          const status = loan.loan_status ?? loan.status ?? "-";
          const duration = loan.agreedLoanDuration ?? loan.duration ?? "-";
          const paymentHistory = loan.paymentHistory ?? loan.payments ?? [];
  
          return (
            <div
              key={loan.loanId ?? loan.id ?? i}
              style={{
                border: `1px solid ${divider}`,
                borderRadius: 10,
                overflow: "hidden",
                backgroundColor: colors.white,
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              <button
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "12px 16px",
                  background: headerBg,
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
                    Status: <strong style={{ color: colors.navy }}>{status}</strong> • Duration: {duration}
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
  
              {isOpen && (
                <div style={{ padding: 16, background: "#fff" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#333", marginBottom: 6 }}>Loan amount</div>
                      <div style={{ fontWeight: 700 }}>{typeof amount === "number" ? `UGX ${amount.toLocaleString()}` : amount}</div>
                    </div>
  
                    <div>
                      <div style={{ fontSize: 13, color: "#333", marginBottom: 6 }}>Amount left</div>
                      <div style={{ fontWeight: 700 }}>{typeof amountLeft === "number" ? `UGX ${amountLeft.toLocaleString()}` : amountLeft}</div>
                    </div>
  
                    <div>
                      <div style={{ fontSize: 13, color: "#333", marginBottom: 6 }}>Interest (uncleared)</div>
                      <div style={{ fontWeight: 700 }}>{typeof loan.unclearedInterest === "number" ? `UGX ${loan.unclearedInterest.toLocaleString()}` : loan.unclearedInterest ?? "-"}</div>
                    </div>
  
                    <div>
                      <div style={{ fontSize: 13, color: "#333", marginBottom: 6 }}>Interest paid</div>
                      <div style={{ fontWeight: 700 }}>{typeof loan.paid_interest === "number" ? `UGX ${loan.paid_interest.toLocaleString()}` : loan.paid_interest ?? "-"}</div>
                    </div>
  
                    <div>
                      <div style={{ fontSize: 13, color: "#333", marginBottom: 6 }}>Points spent</div>
                      <div style={{ fontWeight: 700 }}>{loan.pointsSpent ?? loan.points_spent ?? 0} pts</div>
                    </div>
  
                    <div>
                      <div style={{ fontSize: 13, color: "#333", marginBottom: 6 }}>Loan status</div>
                      <div style={{ fontWeight: 700 }}>{status}</div>
                    </div>
                  </div>
  
                  <div>
                    <h4 style={{ margin: "8px 0", fontSize: 14, color: colors.navy }}>Payment history</h4>
  
                    {paymentHistory.length === 0 ? (
                      <div style={{ padding: 10, color: "#666" }}>No payment history available.</div>
                    ) : (
                      <div style={{ borderTop: `1px solid ${divider}`, marginTop: 8 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left", padding: "8px 6px", fontWeight: 700 }}>Date</th>
                              <th style={{ textAlign: "left", padding: "8px 6px", fontWeight: 700 }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paymentHistory.map((ph, idx) => {
                              const [pdate, pamount] = ph;
                              return (
                                <tr key={idx} style={{ borderBottom: idx < paymentHistory.length - 1 ? `1px solid ${divider}` : "none" }}>
                                  <td style={{ padding: "8px 6px" }}>{pdate}</td>
                                  <td style={{ padding: "8px 6px", fontWeight: 700 }}>{typeof pamount === "number" ? `UGX ${pamount.toLocaleString()}` : pamount}</td>
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