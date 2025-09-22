// src/pages/DashboardLayout2.jsx
import React, { useEffect, useRef, useState } from "react";
import { THEME } from "../theme";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import DataRow from "../components/common/DataRow";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

const { colors, spacing, sizes } = THEME;

// Small stat card
function LargeStatCard({ title, value }) {
  const { memberDashboard } = useMemberDashboard();
  const { dashboardAppearance } = memberDashboard;
  return (
    <div
      style={{
        backgroundColor: colors.navy,
        color: colors.white,
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: dashboardAppearance.color === "gold" ? colors.gold : "rgb(70,130,180)" }}>{value}</div>
    </div>
  );
}

// Renders a group's rows
function DataGroup({ rows, startIndex = 0, isMobile, rowSize = "small" }) {
  return (
    <div>
      {rows?.map((r, i) => (
        <DataRow
          key={r[0] + i}
          label={r[0]}
          value={r[1]}
          index={startIndex + i}
          small={isMobile}
          rowSize={rowSize}
        />
      ))}
    </div>
  );
}

/**
 * DashboardLayout2
 * Props:
 * - userName
 * - memberStats: array of stat objects [{title, value}]
 * - overviewGroups: array of overview group objects [{title, rows: [[label, value]]}]
 * - navLinks
 * - dashboard
 */
export default function DashboardLayout2({
  userName,
  memberStats = [],
  navLinks = [],
  overviewGroups = [],
  dashboard = "member",
}) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const headerRef = useRef(null);
  const topPinnedRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(sizes.minInnerHeight);

  // handle window resize for mobile
  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // compute content height
  useEffect(() => {
    function computeHeights() {
      const headerH = headerRef.current?.getBoundingClientRect().height || sizes.headerHeight;
      const pinnedH = topPinnedRef.current?.getBoundingClientRect().height || 0;
      const pagePad = spacing.pagePadding * 2;
      const h = Math.max(
        sizes.minInnerHeight,
        window.innerHeight - headerH - (isMobile ? pinnedH : 0) - pagePad
      );
      setContentHeight(h);
    }
    computeHeights();
    window.addEventListener("resize", computeHeights);
    const t = setTimeout(computeHeights, 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", computeHeights);
    };
  }, [isMobile]);

  const toggleSidebar = () => setIsSidebarOpen((s) => !s);
  const sidebarTransform = isSidebarOpen ? "translateX(0)" : "translateX(-100%)";

  const pageBase = { minHeight: "100vh", backgroundColor: colors.lightGray, display: "flex", overflow: "hidden" };
  const mainArea = { flex: 1, display: "flex", flexDirection: "column", height: "100vh", position: "relative" };
  const largeCardBase = {
    backgroundColor: colors.white,
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(10,34,66,0.06)",
    border: `1px solid rgba(0,0,0,0.04)`,
    padding: "1vh",
    boxSizing: "border-box",
  };

  // determine large stat card
  const firstMemberStat = memberStats?.[0] || { title: "Your Worth", value: "-" };
  const largeStatTitle = firstMemberStat.title;
  const largeStatValue = firstMemberStat.value;

  return (
    <div style={pageBase}>
      {/* Sidebar */}
      <Sidebar
        dashboard={dashboard}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        transform={sidebarTransform}
        navLinks={navLinks}
      />
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 999 }}
        />
      )}

      {/* Main Area */}
      <div style={mainArea}>
        <Header isMobile={isMobile} onToggle={toggleSidebar} headerRef={headerRef} dashboard={dashboard} />

        {isMobile ? (
          <>
            <div ref={topPinnedRef} style={{ padding: `0 ${spacing.pagePadding}px`, backgroundColor: colors.lightGray }}>
              <div style={{ paddingTop: 10 }}>
                <h1 style={{ fontSize: 20, color: colors.navy, margin: "6px 0" }}>
                  Welcome back, {userName}
                </h1>
                <p style={{ color: "#344b5a", marginBottom: 11 }}>
                  Here’s your financial snapshot today.
                </p>
                <LargeStatCard title={largeStatTitle} value={largeStatValue} />
              </div>
            </div>

            <div style={{ height: contentHeight, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: `12px ${spacing.pagePadding}px ${spacing.pagePadding}px` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                {overviewGroups?.map((g, idx) => (
                  <div key={g.title + idx} style={largeCardBase}>
                    <h3 style={{ color: colors.navy, fontSize: 18, margin: 0 }}>{g.title}</h3>
                    <div style={{ height: 3, width: 56, backgroundColor: colors.gold, borderRadius: 2, margin: "10px 0 14px 0" }} />
                    <DataGroup rows={g.rows} startIndex={overviewGroups.slice(0, idx).reduce((acc, cur) => acc + (cur.rows?.length || 0), 0)} isMobile={isMobile} />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <main style={{ padding: 20, flex: 1, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20, height: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.gap }}>
                <div>
                  <h1 style={{ fontSize: 22, color: colors.navy, marginBottom: "1vh" }}>Welcome back, {userName}</h1>
                  <p style={{ color: "#666", marginBottom: 11 }}>Here’s your financial snapshot today.</p>
                  <LargeStatCard title={largeStatTitle} value={largeStatValue} />
                </div>
                {overviewGroups?.[0] && (
                  <div style={largeCardBase}>
                    <h3 style={{ color: colors.navy, fontSize: 18, margin: 0 }}>{overviewGroups[0].title}</h3>
                    <div style={{ height: 3, width: 60, backgroundColor: colors.gold, borderRadius: 2, margin: "10px 0 14px 0" }} />
                    <DataGroup rowSize={"Big"} rows={overviewGroups[0].rows} isMobile={isMobile} />
                  </div>
                )}
              </div>

              <div style={{ height: contentHeight, display: "grid", gridTemplateRows: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, height: "100%" }}>
                  {overviewGroups.slice(1, 3)?.map((g, i) => (
                    <div key={g.title + i} style={{ ...largeCardBase, overflow: "hidden" }}>
                      <h3 style={{ color: colors.navy, fontSize: 18, margin: 0 }}>{g.title}</h3>
                      <div style={{ height: 3, width: 60, backgroundColor: colors.gold, borderRadius: 2, margin: "10px 0 14px 0" }} />
                      <DataGroup rows={g.rows} startIndex={overviewGroups.slice(0, 1 + i).reduce((acc, cur) => acc + (cur.rows?.length || 0), 0)} isMobile={isMobile} />
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, height: "100%" }}>
                  {overviewGroups.slice(3, 5)?.map((g, i) => (
                    <div key={g.title + i} style={{ ...largeCardBase, overflow: "hidden" }}>
                      <h3 style={{ color: colors.navy, fontSize: 18, margin: 0 }}>{g.title}</h3>
                      <div style={{ height: 3, width: 60, backgroundColor: colors.gold, borderRadius: 2, margin: "10px 0 14px 0" }} />
                      <DataGroup rows={g.rows} startIndex={overviewGroups.slice(0, 3 + i).reduce((acc, cur) => acc + (cur.rows?.length || 0), 0)} isMobile={isMobile} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
