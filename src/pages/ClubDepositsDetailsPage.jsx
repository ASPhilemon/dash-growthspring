import React from "react";
import BaseDetailsPage from "./BaseDetailsPage";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

function ClubDepositsDetailsPage() {
  const { memberDashboard } = useMemberDashboard();

  const memberStats = memberDashboard?.home?.memberStats || [];
  const memberOverviewGroups = memberDashboard?.home?.memberOverviewGroups || [];

  const pageName = "Club Deposits";
  const statTitle = "Club Total Savings";
  const statValue =
    memberStats.find((t) => t.title === "Club Worth")?.value ?? "-";

  const overviewGroup =
    memberOverviewGroups.find((t) => t.title === "Club Figures") ?? {
      title: "Club Figures",
      rows: [],
    };

  const tableHeaders = ["Month", "Amount", "Savers"];
  const allTransactions = memberDashboard?.clubDeposits ?? [];

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

export default ClubDepositsDetailsPage;
