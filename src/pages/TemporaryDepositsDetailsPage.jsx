import React from "react";
import BaseDetailsPage from "./BaseDetailsPage";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

function TemporaryDepositsDetailsPage() {
  const { memberDashboard } = useMemberDashboard();

  const memberStats = memberDashboard?.temporary?.memberStats || [];
  const memberOverviewGroups = memberDashboard?.temporary?.memberOverviewGroups || [];

  const pageName = "Temporary Deposits & Withdrawals";
  const statTitle = "Total Savings";
  const statValue = memberStats.find((t) => t.title === "Current Worth")?.value ?? "-";

  const overviewGroup = memberOverviewGroups.find((t) => t.title === "Savings") ?? { title: "Savings", rows: [] };

  const tableHeaders = ["Date", "Amount", "Source"];
  const allTransactions = memberDashboard?.memberTemporaryDeposits ?? [];

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

export default TemporaryDepositsDetailsPage;


    
