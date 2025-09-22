import React from "react";
import BaseDetailsPage from "./BaseDetailsPage";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

function EarningsDetailsPage() {
  const { memberDashboard } = useMemberDashboard();

  const memberStats = memberDashboard?.home?.memberStats || [];
  const memberOverviewGroups = memberDashboard?.home?.memberOverviewGroups || [];

  const pageName = "Your Earnings";
  const statTitle = "Total Earnings";
  const statValue =
    memberStats.find((t) => t.title === "Your Earnings")?.value ?? "-";

  const overviewGroup =
    memberOverviewGroups.find((t) => t.title === "Earnings") ?? {
      title: "Earnings",
      rows: [],
    };

  const tableHeaders = ["Date", "Amount", "Description"];
  const allTransactions = memberDashboard?.memberEarnings ?? [];

  return (
    <BaseDetailsPage
      pageName={pageName}
      statTitle={statTitle}
      statValue={statValue}
      overviewGroup={overviewGroup}
      tableHeaders={tableHeaders}
      allTransactions={allTransactions}
    />
  );
}

export default EarningsDetailsPage;
