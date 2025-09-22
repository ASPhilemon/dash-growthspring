// src/components/LoansFilterSummary.jsx
import React from "react";

export default function LoansFilterSummary({ loans_summary = {} }) {
  const {
    ongoingLoansCount = 0,
    endedLoansCount = 0,
    totalPrincipal = 0,
    principalLeft = 0,
    expectedInterest = 0,
    interestPaid = 0,
    members = 0,
    membersOngoingLoans = { size: 0 },
    membersEndedLoans = { size: 0 },
  } = loans_summary || {};

  const fmt = (n) => {
    try { return Math.floor(Number(n || 0)).toLocaleString(); }
    catch { return String(n ?? 0); }
  };

  const card = {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
    padding: 12,
    overflow: "visible", // add this if needed
  };
  

  const row = (odd) => ({
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    padding: "10px 12px",
    background: odd ? "#f9fafb" : "#fff",
    borderBottom: "1px solid #eef2f7",
  });

  const th = { fontWeight: 700, color: "#0b2b4b" };
  const td = { display: "flex", alignItems: "center", gap: "2vw", color: "#0b2b4b", fontWeight: 600 };

  const pipe = { width: 1, height: 16, background: "#1f2937", opacity: 0.3 };

  const Info = ({ text }) => {
    const [show, setShow] = React.useState(false);
    // Split incoming string on "|" to create separate lines
    const lines = Array.isArray(text) ? text : String(text || "").split("|").map((s) => s.trim());

    return (
      <span
        style={{ position: "relative", display: "inline-flex", marginLeft: 6, color: "white" }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ color: "#64748b", cursor: "help" }}>
          <path
            fill="currentColor"
            d="M11 7h2v2h-2V7m1-5a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m1 15h-2v-6h2v6Z"
          />
        </svg>
        <span
          style={{
            position: "absolute",
            bottom: "140%",
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            color: "white",
            background: "#111827",
            fontSize: 12,
            padding: "6px 8px",
            borderRadius: 6,
            boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
            opacity: show ? 5 : 0,
            pointerEvents: "none",
            transition: "opacity 120ms ease",
          }}
        >
        {lines.map((ln, i) => (
          <div key={i} style={{ marginTop: i ? 4 : 0 }}>{ln}</div>
        ))}
        </span>
      </span>
    );
  };
  

  return (
    <div style={card}>
      {/* Loan count */}
      <div style={row(false)}>
        <div style={th}>
          Loan Count
          <Info text={"A: Ongoing loans  |  B: Ended loans"} />
        </div>
        <div style={td}>
          <span>{fmt(ongoingLoansCount)}</span>
          <div style={pipe} />
          <span>{fmt(endedLoansCount)}</span>
        </div>
      </div>

      {/* Principal */}
      <div style={row(true)}>
        <div style={th}>
          Principal (UGX)
          <Info text={"A: Total principal  |  B: Principal left"} />
        </div>
        <div style={td}>
          <span>{fmt(totalPrincipal)}</span>
          <div style={pipe} />
          <span>{fmt(principalLeft)}</span>
        </div>
      </div>

      {/* Interest */}
      <div style={row(false)}>
        <div style={th}>
          Interest (UGX)
          <Info text={"A: Expected interest (ongoing)  |  B: Interest paid (ended/overall)"} />
        </div>
        <div style={td}>
          <span>{fmt(expectedInterest)}</span>
          <div style={pipe} />
          <span>{fmt(interestPaid)}</span>
        </div>
      </div>

      {/* Member count */}
      <div style={{ ...row(true), borderBottom: "none" }}>
        <div style={th}>
          Member Count
          <Info text={"A: Members with ongoing loans  |  B: Members with ended loans  |  C: Members with any loan"} />
        </div>
        <div style={td}>
          <span>{fmt(membersOngoingLoans?.size || 0)}</span>
          <div style={pipe} />
          <span>{fmt(membersEndedLoans?.size || 0)}</span>
          <div style={pipe} />
          <span>{fmt(members)}</span>
        </div>
      </div>
    </div>
  );
}
