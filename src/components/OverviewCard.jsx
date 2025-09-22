import React from "react";
import DataRow from "./DataRow";

export default function OverviewCard() {
  const savingsData = [
    ["Savings this year", "UGX 15M"],
    ["Avg. monthly savings", "UGX 1.25M"],
    ["Earnings this year", "UGX 4M"],
    ["Avg. monthly earnings", "UGX 0.33M"],
  ];

  const loansData = [
    ["Loans this year", "UGX 8M"],
    ["Interest paid", "UGX 0.8M"],
    ["Current interest due", "UGX 0.3M"],
    ["Loan limit", "UGX 12M"],
  ];

  return (
    <div className="large-card">
      <h3 className="large-card-title">Overview</h3>
      <div className="title-underline" />
      <div className="card-section">
        <h4 className="section-title">Savings & Earnings</h4>
        {savingsData.map(([label, value], i) => (
          <DataRow key={i} label={label} value={value} index={i} />
        ))}
      </div>
      <div className="card-section">
        <h4 className="section-title">Loans</h4>
        {loansData.map(([label, value], i) => (
          <DataRow key={i} label={label} value={value} index={i} />
        ))}
      </div>
    </div>
  );
}
