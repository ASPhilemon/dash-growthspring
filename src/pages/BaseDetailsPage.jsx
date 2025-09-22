import React, { useState, useEffect, useRef } from "react";
import { THEME } from "../theme";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import ScrollContainer from "../components/layout/ScrollContainer";
import MobileNavMenu from "../components/common/MobileNavMenu";
import DetailsCard from "../components/details/DetailsCard";
import LoanAccordions from "../components/details/LoanAccordions";
import StatCard from "../components/common/StatCard";
import DetailsWelcomeMessage from "../components/details/DetailsWelcomeMessage";
import DetailsOverviewSection from "../components/details/DetailsOverviewSection";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

function BaseDetailsPage({ pageName, statTitle, statValue, overviewGroup, tableHeaders, allTransactions, formatTotal }) { 
    const { memberDashboard, isLoading, error } = useMemberDashboard();
    const dashboardAppearance =
      memberDashboard?.dashboardAppearance ?? { layoutStyle: "stacked", colorTheme: "gold" };
    
    const { colors, spacing, sizes } = THEME;
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [innerHeight, setInnerHeight] = useState(sizes.minInnerHeight);
    const [selectedYear, setSelectedYear] = useState(() => {
        const ys = (statTitle !== "Your Debt"
          ? [...new Set(allTransactions.map((t) => Number(t.year)))]
          : [...new Set(allTransactions.map((t) => getYearFromAny(t.issueDate)).filter((y) => Number.isFinite(y)))]
        ).sort((a, b) => a - b);
        return ys.length ? String(ys[ys.length - 1]) : String(new Date().getFullYear());
      });
      
    const headerRef = useRef(null);
    const sectionBarRef = useRef(null);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            function computeInnerHeight() {
                const h = headerRef.current?.offsetHeight || sizes.headerHeight;
                const s = sectionBarRef.current?.offsetHeight || 50;
                const pad = spacing.pagePadding * 2;
                const newHeight = Math.max(sizes.minInnerHeight, window.innerHeight - h - s - pad);
                setInnerHeight(newHeight);
            }
            const t = setTimeout(computeInnerHeight, 50);
            window.addEventListener("resize", computeInnerHeight);
            return () => { clearTimeout(t); window.removeEventListener("resize", computeInnerHeight); };
        }
    }, [isMobile, spacing.pagePadding, sizes.headerHeight, sizes.minInnerHeight]);

    // Transform context transactions into objects the DetailsCard expects
    function getYearFromAny(input) {
        if (!input) return NaN;
        if (input instanceof Date) return input.getFullYear();
        if (typeof input === "string") {
          // Try ISO first
          const iso = new Date(input);
          if (!isNaN(iso)) return iso.getFullYear();
          // Fallback for "d/M/yyyy" (e.g., "21/8/2025")
          const m = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (m) {
            const [, d, mth, y] = m.map(Number);
            return new Date(y, mth - 1, d).getFullYear();
          }
        }
        // Object with a date field?
        if (typeof input === "object" && input.date) {
          return getYearFromAny(input.date);
        }
        return NaN;
      }

      const transactionsForYear =
      statTitle !== "Your Debt"
        ? allTransactions
            .filter((t) => Number(t.year) === Number(selectedYear))
            .flatMap((t) =>
              (t.values || []).map(([date, amount, source]) => ({
                date,
                amount: `UGX ${Number(amount || 0).toLocaleString()}`,
                source,
              }))
            )
            : allTransactions.filter(
                (t) => getYearFromAny(t.issueDate) === Number(selectedYear)
              );
    

    // Calculate total
    const totalValue = transactionsForYear.reduce((sum, t) => {
        const value = statTitle !== "Your Debt" ? t.amount : t.loanAmount;
        if (typeof value === 'string' && value.startsWith('UGX')) {
            return sum + parseInt(value.replace(/UGX |,/g, ""));
        }
        return sum + (parseInt(value) || 0);
      }, 0);
      
      
    const formattedTotal = formatTotal ? formatTotal(totalValue) : `UGX ${totalValue.toLocaleString()}`;
    const years =
    statTitle !== "Your Debt"
      ? [...new Set(allTransactions.map((t) => Number(t.year)))]
      : [...new Set(
          allTransactions
            .map((t) => getYearFromAny(t.issueDate))
            .filter((y) => Number.isFinite(y))
        )];
  
  
    const dashboard = pageName.includes("Temporary") ? "temporary" : "member";

    // Updated menu items to include routes for navigation
    const menuItems = pageName.includes("Temporary") ? 
    [
        { text: "Home", to: "/temporary-savings" },
        { text: "Deposits & Withdrawals", to: "/temporary-savings/transactions" },
        { text: "Loans", to: "/temporary-savings/loans" },
        { text: "The Club", to: "/temporary-savings/club" },
      ] : 
      [
        { text: "Home", to: "/home" },
        { text: "Your Deposits", to: "/deposits" },
        { text: "Your Earnings", to: "/earnings" },
        { text: "Your Points", to: "/points" },
        { text: "Your Loans", to: "/loans" },
        { text: "Club Deposits", to: "/club-deposits" },
        { text: "Club Earnings", to: "/club-earnings" },
      ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const sidebarTransform = isSidebarOpen ? "translateX(0)" : "translateX(-100%)";

    return (
        <div style={{ minHeight: "100vh", backgroundColor: colors.lightGray, display: "flex", overflow: 'hidden' }}>
            <Sidebar dashboard={dashboard} isMobile={isMobile} navLinks = {menuItems} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} transform={sidebarTransform} />
            {isMobile && isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 999 }} />}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: '100vh' }}>
                <Header dashboard={dashboard} isMobile={isMobile} onToggle={toggleSidebar} headerRef={headerRef} />
                {isMobile ? (
                    <>
                        <div ref={sectionBarRef} className="mobile-nav-container" style={{ backgroundColor: colors.lightGray }}>
                            <MobileNavMenu items={menuItems} activeItem={pageName} />
                        </div>
                        <div style={{ margin: "0 2vw", height: "100%" }}>
                            <DetailsCard
                                isMobile={isMobile}
                                selectedYear={selectedYear}
                                onYearChange={(e) => setSelectedYear(e.target.value)}
                                years={years}
                                total={formattedTotal}
                                transactions={transactionsForYear}
                                tableHeaders={tableHeaders}
                            />
                        </div>
                    </>
                ) : (
                    <main style={{ padding: 20, flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, height: "100%" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: spacing.gap }}>
                                <div>
                                    <DetailsWelcomeMessage pageName={pageName} />
                                    <StatCard title={statTitle} value={statValue} />
                                </div>
                                <DetailsOverviewSection isMobile={false} overviewGroup={overviewGroup} />
                            </div>
                            <div>
                                <DetailsCard
                                    isMobile={false}
                                    selectedYear={selectedYear}
                                    onYearChange={(e) => setSelectedYear(e.target.value)}
                                    years={years}
                                    total={formattedTotal}
                                    transactions={transactionsForYear}
                                    tableHeaders={tableHeaders}
                                />
                            </div>
                        </div>
                    </main>
                )}
            </div>
        </div>
    );
}

export default BaseDetailsPage;
