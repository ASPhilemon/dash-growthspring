import React from "react";
import BaseDetailsPage from "./BaseDetailsPage";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

function TemporaryClubDetailsPage() {
  const { memberDashboard } = useMemberDashboard();

  const memberStats = memberDashboard?.temporary?.memberStats || [];
  const memberOverviewGroups = memberDashboard?.temporary?.memberOverviewGroups || [];

  const pageName = "Total Temporary Savings";
  const statTitle = "Total Contributions";
  const statValue = memberStats.find((t) => t.title === "Total Contributions")?.value ?? "-";

  const overviewGroup = memberOverviewGroups.find((t) => t.title === "Club Figures") ?? { title: "Club Figures", rows: [] };

  const tableHeaders = ["Month", "Amount", "Savers"];
  const allTransactions = memberDashboard?.clubTemporaryFigures ?? [];

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

export default TemporaryClubDetailsPage;


    
