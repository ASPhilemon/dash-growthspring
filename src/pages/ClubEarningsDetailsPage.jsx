import React from "react";
import BaseDetailsPage from "./BaseDetailsPage";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

function ClubEarningsDetailsPage() {
  const { memberDashboard } = useMemberDashboard();

  const memberStats = memberDashboard?.home?.memberStats || [];
  const memberOverviewGroups = memberDashboard?.home?.memberOverviewGroups || [];

  const pageName = "Club Earnings";
  const statTitle = "Club Total Earnings";
  const statValue =
    memberStats.find((t) => t.title === "Club Earnings (Total)")?.value ?? "-";

  const overviewGroup =
    memberOverviewGroups.find((t) => t.title === "Club Figures") ?? {
      title: "Club Figures",
      rows: [],
    };

  const tableHeaders = ["Month", "Amount", "Source"];
  const allTransactions = memberDashboard?.clubEarnings ?? [];

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

export default ClubEarningsDetailsPage;
