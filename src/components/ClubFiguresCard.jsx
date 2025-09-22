import React from "react";
import DataRow from "./DataRow";

export default function ClubFiguresCard() {
  const clubData = [
    ["Total worth", "UGX 60.5M"],
    ["Savings this year", "UGX 30M"],
    ["Earnings this year", "UGX 9M"],
    ["Loans this year", "UGX 25M"],
  ];

  return (
    <div className="large-card">
      <h3 className="large-card-title">Club Figures</h3>
      <div className="title-underline" />
      {clubData.map(([label, value], i) => (
        <DataRow key={i} label={label} value={value} index={i} />
      ))}
    </div>
  );
}
