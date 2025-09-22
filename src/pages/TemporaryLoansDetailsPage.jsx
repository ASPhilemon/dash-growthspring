import React from "react";
import BaseDetailsPage from "./BaseDetailsPage";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

function TemporaryLoansDetailsPage() {
  const { memberDashboard } = useMemberDashboard();

  const memberStats = memberDashboard?.temporary?.memberStats || [];
  const memberOverviewGroups = memberDashboard?.temporary?.memberOverviewGroups || [];

  const pageName = "Temporary Loans";
  const statTitle = "Total Loans";
  const statValue = memberStats.find((t) => t.title === "Your Current Loans")?.value ?? "-";

  const overviewGroup = memberOverviewGroups.find((t) => t.title === "Loans") ?? { title: "Loans", rows: [] };

  const tableHeaders = ["Date", "Amount", "Source"];
  const allTransactions = memberDashboard?.memberFreeLoans ?? [];

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

export default TemporaryLoansDetailsPage;


    
