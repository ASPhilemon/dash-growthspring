// src/components/dashboard/HomeOverview.jsx
import React from "react";
import { THEME } from "../../theme";
import StatCard from "../common/StatCard";

const { colors, spacing } = THEME;

/**
 * SummaryList - small helper to render label / value pairs inside the large card.
 * If `sideBySide` is true, show label on left and value on right (desktop). On mobile it stacks.
 */
function SummaryList({ rows = [], isMobile }) {
  return (
    <div style={{ marginTop: isMobile ? 12 : 0, width: "100%" }}>
      {rows.map(([label, value], i) => (
        <div
          key={label + i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 0",
            borderTop: i === 0 ? "none" : `1px solid rgba(0,0,0,0.04)`,
            color: colors.navy,
            fontSize: 14,
          }}
        >
          <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
          <div style={{ fontWeight: 700 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * HomeOverview
 * Props:
 *  - isMobile: boolean (comes from DashboardLayout)
 *  - statsData: [{ title, value }, ...]  (length should correspond to number of cards or at least include primary stat per card)
 *  - overviewGroups: [{ title, rows: [[label, value], ...] }, ...]  (we expect 4 groups ideally)
 *  - userName: optional
 */
export default function HomeOverview({ isMobile, statsData = [], overviewGroups = [], userName = "Mwebe" }) {
  // Create 4 card slots. If overviewGroups length < 4, we'll fill remaining from statsData.
  const groups = overviewGroups.slice(0, 4);

  // If the first group is "Savings & Earnings" but not split, the caller should pre-split.
  // We render as many cards as we have groups; if less than 4, we still render blanks using statsData.
  const cardsCount = 4;
  const cards = new Array(cardsCount).fill(null).map((_, i) => {
    const group = groups[i] || { title: statsData[i]?.title || `Card ${i + 1}`, rows: [] };
    const stat = statsData[i] || { title: group.title || `Card ${i + 1}`, value: (group.rows && group.rows[0] && group.rows[0][1]) || "-" };
    return { group, stat };
  });

  const containerStyle = {
    backgroundColor: colors.lightGray,
    padding: isMobile ? `0 0 8px ${spacing.pagePadding}px` : 20,
  };

  const gridStyle = {
    display: "grid",
    gap: 16,
    // 2 columns on desktop, 1 column on mobile
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
    marginTop: 12,
  };

  const largeCardBase = {
    backgroundColor: colors.white,
    borderRadius: 10,
    boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
    border: `1px solid rgba(0,0,0,0.06)`,
    padding: 14,
    boxSizing: "border-box",
    minHeight: 140,
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: 12,
    alignItems: isMobile ? "flex-start" : "center",
  };

  // stat column style
  const statColStyle = {
    minWidth: isMobile ? "auto" : 180,
    maxWidth: isMobile ? "100%" : 260,
    flex: isMobile ? "none" : "0 0 40%",
    display: "flex",
    alignItems: "center",
    justifyContent: isMobile ? "flex-start" : "center",
  };

  // summary column style
  const summaryColStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    paddingLeft: isMobile ? 0 : 8,
  };

  return (
    <div style={containerStyle}>
      {/* Welcome */}
      <div>
        <h1 style={{ fontSize: isMobile ? 20 : 22, color: colors.navy, margin: isMobile ? "6px 0" : 0 }}>
          Welcome back, {userName}
        </h1>
        <p style={{ color: isMobile ? "#344b5a" : "#666", marginBottom: isMobile ? 12 : 15 }}>
          Here’s your financial snapshot today.
        </p>
      </div>

      {/* 2x2 grid of cards */}
      <div style={gridStyle}>
        {cards.map(({ group, stat }, idx) => (
          <div key={idx} style={largeCardBase}>
            <div style={statColStyle}>
              <StatCard title={stat.title} value={stat.value} />
            </div>

            <div style={summaryColStyle}>
              <h4 style={{ margin: 0, color: colors.navy, fontSize: 15, fontWeight: 700 }}>{group.title}</h4>
              <div style={{ height: 6 }} />
              <SummaryList rows={group.rows || []} isMobile={isMobile} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
