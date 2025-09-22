// src/pages/MemberDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout1 from "../pages/DashboardLayout1";
import DashboardLayout2 from "../pages/DashboardLayout2";
import StatsSection from "../components/dashboard/StatsSection"; 
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

export default function MemberDashboard({}) {
  const { memberDashboard } = useMemberDashboard();

  // guard in case data hasn’t loaded yet
  if (!memberDashboard) {
    return <div>Loading dashboard...</div>;
  }

  const { home, user, dashboardAppearance } = memberDashboard;

  const Layout = dashboardAppearance.layout === "Layout 1" ? DashboardLayout1 : DashboardLayout2;

  const memberLinks = [
    { text: "Home", to: "/home" },
    { text: "Your Deposits", to: "/deposits" },
    { text: "Your Earnings", to: "/earnings" },
    { text: "Your Points", to: "/points" },
    { text: "Your Loans", to: "/loans" },
    // { text: "Your Discounts", to: "/discounts" },
    { text: "Club Deposits", to: "/club-deposits" },
    { text: "Club Earnings", to: "/club-earnings" },
  ];

  return (
    <Layout
      StatsComponent={(props) => (
        <StatsSection
          {...props}
          statsData={home.memberStats} 
          userName={user?.displayName || user?.fullName || "Member"}
        />
      )}
      navLinks={memberLinks}
      userName={user?.displayName || user?.fullName || "Member"}
      overviewGroups={home.memberOverviewGroups}
      memberStats={home.memberStats}
      dashboard="member"
    />
  );
}
