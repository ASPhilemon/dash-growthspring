// src/pages/SavingsDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout1 from "../pages/DashboardLayout1";
import DashboardLayout2 from "../pages/DashboardLayout2";
import StatsSection from "../components/dashboard/StatsSection"; 
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

function TemporarySavingsDashboard({ }) {
  const { memberDashboard } = useMemberDashboard();

  // guard in case data hasn’t loaded yet
  if (!memberDashboard) {
    return <div>Loading dashboard...</div>;
  }

  const { temporary, home, user } = memberDashboard;
  const Layout = DashboardLayout1;

const temporaryLinks = [
  { text: "Home", to: "/temporary-savings" },
  { text: "Deposits & Withdrawals", to: "/temporary-savings/transactions" },
  { text: "Loans", to: "/temporary-savings/loans" },
  { text: "The Club", to: "/temporary-savings/club" },
];

  return (
    <Layout
    StatsComponent={(props) => (
      <StatsSection
        {...props}
        statsData={temporary.memberStats} 
        userName={user?.displayName || user?.fullName || "Member"}
      />
    )}
    navLinks={temporaryLinks}
    userName={user?.displayName || user?.fullName || "Member"}
    overviewGroups={temporary.memberOverviewGroups}
    memberStats={temporary.memberStats}
    dashboard="temporary"
  />
  );
}

export default TemporarySavingsDashboard;
