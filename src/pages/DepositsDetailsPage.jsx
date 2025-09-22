import React from "react";
import BaseDetailsPage from "./BaseDetailsPage";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

function DepositsDetailsPage() {
  const { memberDashboard } = useMemberDashboard();

  const memberStats = memberDashboard?.home?.memberStats || [];
  const memberOverviewGroups = memberDashboard?.home?.memberOverviewGroups || [];

  const pageName = "Your Deposits";
  const statTitle = "Total Savings";
  const statValue = memberStats.find((t) => t.title === "Your Worth")?.value ?? "-";

  const overviewGroup = memberOverviewGroups.find((t) => t.title === "Savings") ?? { title: "Savings", rows: [] };

  const tableHeaders = ["Date", "Amount", "Source"];
  const allTransactions = memberDashboard?.memberDeposits ?? [];

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

export default DepositsDetailsPage;


    
