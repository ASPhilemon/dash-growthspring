// src/pages/DashboardLayout1.jsx
import React, { useEffect, useRef, useState } from "react";
import { THEME } from "../theme";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import DataRow from "../components/common/DataRow";
import StatsSection from "../components/dashboard/StatsSection";

const { colors, spacing, divider } = THEME;

/**
 * OverviewSection - renders the overview cards
 */
export function OverviewSection({ isMobile, overviewGroups = [], groupRefs = null }) {
  const largeCardBase = {
    backgroundColor: colors.white,
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(10,34,66,0.06)",
    border: `1px solid rgba(0,0,0,0.04)`,
    boxSizing: "border-box",
  };

  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // individual group rows
  function DataGroup({ title, rows, startIndex }) {
    return (
      <div style={{ marginBottom: isMobile ? 16 : 0 }}>
        {!isMobile ? (
          <>
          <h4 style={{ color: colors.navy, fontSize: 15, margin: "0 0 8px 0", fontWeight: "bold" }}>{title}</h4>
          </>
          ) : (
          <>
          <h3 style={{ color: colors.navy, fontSize: 18, margin: 0 }}>{title}</h3>
          <div style={{ height: 3, width: isMobile ? 56 : 60, backgroundColor: colors.gold, borderRadius: 2, margin: "10px 0 14px 0" }} />
          </>
          )}
        {rows?.map((r, i) => (
          <DataRow key={r[0] + i} label={r[0]} value={r[1]} index={startIndex + i} small={isMobile} />
        ))}
      </div>
    );
  }

  const visibleDesktopCols = 3;
  const desktopGap = 0;
  const cardWidth = `calc((100% - ${(visibleDesktopCols - 1) * desktopGap}px) / ${visibleDesktopCols})`;

  let cumulativeIndex = 0;

  // update scroll arrows for desktop
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function update() {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [overviewGroups, isMobile]);

  const scrollByPage = (dir) => {
    const el = containerRef.current;
    if (!el) return;
    const amount = el.clientWidth;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section style={{ ...largeCardBase, padding: isMobile ? 0 : 15 }}>
      <style>{`
        .overview-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: ${colors.navy} transparent;
        }
        .overview-scroll::-webkit-scrollbar { height: 4px; }
        .overview-scroll::-webkit-scrollbar-track { background: transparent; }
        .overview-scroll::-webkit-scrollbar-thumb {
          background-color: ${colors.navy};
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      {!isMobile && (<div style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{ color: colors.navy, fontSize: 18, margin: 0 }}>Overview</h3>
          <div style={{ height: 3, width: isMobile ? 56 : 60, backgroundColor: colors.gold, borderRadius: 2, margin: "4px 0 14px 0" }} />
        </div>
       )}

        {!isMobile && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 12 }}>
            <button onClick={() => scrollByPage("left")} disabled={!canScrollLeft} aria-label="Scroll left" style={{
              width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(0,0,0,0.06)",
              background: "white", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: canScrollLeft ? "pointer" : "not-allowed", opacity: canScrollLeft ? 1 : 0.45
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke={colors.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => scrollByPage("right")} disabled={!canScrollRight} aria-label="Scroll right" style={{
              width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(0,0,0,0.06)",
              background: "white", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: canScrollRight ? "pointer" : "not-allowed", opacity: canScrollRight ? 1 : 0.45
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke={colors.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="overview-scroll"
        style={{
          display: isMobile ? "block" : "flex",
          gap: isMobile ? 0 : desktopGap,
          alignItems: "start",
          paddingBottom: isMobile ? 0 : 8,
          scrollSnapType: isMobile ? "none" : "x mandatory",
        }}
      >
        {overviewGroups?.map((group, idx) => {
          const groupElem = (
            <div
              key={group.title + idx}
              ref={(el) => { if (groupRefs && Array.isArray(groupRefs.current)) groupRefs.current[idx] = el; }}
              style={{
                flex: isMobile ? "0 1 auto" : `0 0 ${cardWidth}`,
                boxSizing: "border-box",
                padding: 9,
                scrollSnapAlign: isMobile ? "none" : "start",
                borderRight: !isMobile && idx < overviewGroups.length - 1 ? "1px solid #eee" : "none",
                borderRadius: 10,
                backgroundColor: colors.white,
              }}
            >
              <DataGroup title={group.title} rows={group.rows} startIndex={cumulativeIndex} />
            </div>
          );

          cumulativeIndex += group.rows?.length || 0;
          return groupElem;
        })}
      </div>
    </section>
  );
}

/**
 * DashboardLayout1 - main layout component
 * Accepts dynamic props from parent:
 * - StatsComponent (default StatsSection)
 * - memberStats
 * - overviewGroups
 * - navLinks
 */
export default function DashboardLayout1({
  StatsComponent = StatsSection,
  memberStats = [],
  overviewGroups = [],
  navLinks = [],
  dashboard = "member",
}) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const headerRef = useRef(null);
  const statsScrollRef = useRef(null);
  const overviewScrollRef = useRef(null);
  const groupRefs = useRef([]);
  const isSyncingRef = useRef(null);
  const syncClearTimeout = useRef(null);

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 768); }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // scroll sync for mobile
  useEffect(() => {
    if (!isMobile) return;
    const statsEl = statsScrollRef.current;
    const overviewEl = overviewScrollRef.current;
    if (!statsEl || !overviewEl) return;

    const clearLock = () => {
      if (syncClearTimeout.current) clearTimeout(syncClearTimeout.current);
      syncClearTimeout.current = setTimeout(() => { isSyncingRef.current = null; }, 120);
    };

    const handleStatsScroll = () => {
      if (isSyncingRef.current === "overview") return;
      isSyncingRef.current = "stats";
      const percent = statsEl.scrollWidth > statsEl.clientWidth ? statsEl.scrollLeft / (statsEl.scrollWidth - statsEl.clientWidth) : 0;
      overviewEl.scrollTop = Math.round((overviewEl.scrollHeight - overviewEl.clientHeight) * percent);
      clearLock();
    };

    const handleOverviewScroll = () => {
      if (isSyncingRef.current === "stats") return;
      isSyncingRef.current = "overview";
      const percent = overviewEl.scrollHeight > overviewEl.clientHeight ? overviewEl.scrollTop / (overviewEl.scrollHeight - overviewEl.clientHeight) : 0;
      statsEl.scrollLeft = Math.round((statsEl.scrollWidth - statsEl.clientWidth) * percent);
      clearLock();
    };

    statsEl.addEventListener("scroll", handleStatsScroll, { passive: true });
    overviewEl.addEventListener("scroll", handleOverviewScroll, { passive: true });
    return () => {
      statsEl.removeEventListener("scroll", handleStatsScroll);
      overviewEl.removeEventListener("scroll", handleOverviewScroll);
      if (syncClearTimeout.current) clearTimeout(syncClearTimeout.current);
    };
  }, [isMobile]);

  const toggleSidebar = () => setIsSidebarOpen((s) => !s);
  const sidebarTransform = isSidebarOpen ? "translateX(0)" : "translateX(-100%)";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.lightGray, display: "flex" }}>
      <Sidebar dashboard={dashboard} navLinks={navLinks} isMobile={isMobile} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} transform={sidebarTransform} />
      {isMobile && isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 999 }} />}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <Header isMobile={isMobile} onToggle={toggleSidebar} headerRef={headerRef} dashboard={dashboard} />

        {isMobile ? (
          <>
            <div style={{ padding: `0 ${spacing.pagePadding}px` }}>
              <StatsComponent isMobile scrollRef={statsScrollRef} statsData={memberStats} />
            </div>
            <div ref={overviewScrollRef} style={{ flex: 1, overflowY: "auto", padding: `0 ${spacing.pagePadding}px ${spacing.pagePadding}px` }}>
              <OverviewSection isMobile overviewGroups={overviewGroups} groupRefs={groupRefs} />
            </div>
          </>
        ) : (
          <main style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing.gap }}>
              <StatsComponent isMobile={false} statsData={memberStats} />
              <OverviewSection isMobile={false} overviewGroups={overviewGroups} groupRefs={groupRefs} />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
