import React from "react";
import BaseDetailsPage from "./BaseDetailsPage";
import { useMemberDashboard } from "../contexts/MemberDashboardContext";

function LoansDetailsPage() {
  const { memberDashboard } = useMemberDashboard();

  const memberStats = memberDashboard?.home?.memberStats || [];
  const memberOverviewGroups = memberDashboard?.home?.memberOverviewGroups || [];

  const pageName = "Your Loans";
  const statTitle = "Your Debt";
  const statValue =
    memberStats.find((t) => t.title === "Your Current Loans")?.value ?? "-";

  const overviewGroup =
    memberOverviewGroups.find((t) => t.title === "Loans") ?? {
      title: "Loans",
      rows: [],
    };

  const tableHeaders = ["Date", "Amount", "Source"];
  const allTransactions = memberDashboard?.memberLoans ?? [];

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

export default LoansDetailsPage;
