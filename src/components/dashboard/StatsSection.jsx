// src/components/dashboard/StatsSection.jsx
import React from "react";
import { THEME } from "../../theme";
import StatCard from "../common/StatCard";

const { colors, spacing } = THEME;

function WelcomeMessage({ isMobile, userName }) {
  return (
    <>
      <h1
        style={{
          fontSize: isMobile ? 20 : 22,
          color: colors.navy,
          margin: isMobile ? "6px 0" : 0,
        }}
      >
        Welcome back, {userName}
      </h1>
      <p
        style={{
          color: isMobile ? "#344b5a" : "#666",
          marginBottom: 9,
        }}
      >
        Here’s your financial snapshot today.
      </p>
    </>
  );
}

function StatsSection({ isMobile, scrollRef, statsData = [], userName }) {
  const deskTopStats = [statsData[0], statsData[1], statsData[2], statsData[3]];
  const mobileStats = [statsData[0], statsData[1], statsData[2], statsData[5], statsData[3]];
  return (
    <div
      style={{
        padding: "0.5vh 0",
        backgroundColor: colors.lightGray,
      }}
    >
      <div style={{ paddingRight: isMobile ? spacing.pagePadding : 0 }}>
        <WelcomeMessage isMobile={isMobile} userName={userName} />
      </div>

      {isMobile ? (
        // Mobile: horizontal scroll
<div
  ref={scrollRef}
  style={{
    display: "flex",
    overflowX: "auto",
    gap: 12,
    paddingBottom: 8,
    scrollbarWidth: "none",
  }}
>
  <style>{`div::-webkit-scrollbar { display: none; }`}</style>
  {mobileStats.map((stat) => (
    <div
      key={stat.title}
      style={{
        flex: "0 0 70%", // each takes 20% of container width
        minWidth: "70%", // enforce equal width
      }}
    >
      <StatCard title={stat.title} value={stat.value} />
    </div>
  ))}
  <div style={{ minWidth: 1, flexShrink: 0 }} />
</div>

      ) : (
        // Desktop: grid with 4 equal columns
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            paddingTop: 10,
          }}
        >
          {deskTopStats.map((stat) => (
            <StatCard key={stat.title} title={stat.title} value={stat.value} />
          ))}
        </div>
      )}
    </div>
  );
}


export default StatsSection;
